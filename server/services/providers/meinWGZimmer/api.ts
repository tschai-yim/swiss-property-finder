import { Property, FilterBucket } from '../../../../types';
import { MeinWGZimmerResultItem, MeinWGZimmerResponse } from './types';
import { PropertyWithoutCommuteTimes, RequestManager } from '../providerTypes';
import { RateLimiter } from '../../rateLimiter';
import { isTemporaryBasedOnText } from '../../../../utils/textUtils';
import { memoize, SHORT_CACHE_TTL_MS } from '../../cache';
import { RequestLimitError } from '../../errors';

const MEINWGZIMMER_API_URL = 'https://api1.meinwgzimmer.ch/live/classes/Room';
const MEINWGZIMMER_APP_ID = '94aa8f52080089940731d6952815ec7233b745cc';
const MEINWGZIMMER_JS_KEY = 'pjWJhcGN4ObY0pymyCQS';
const meinWgZimmerRateLimiter = new RateLimiter(2); // 2 requests per second

/**
 * Maps a raw `MeinWGZimmerResultItem` from their API to our standardized `Property` object.
 * 
 * Key mapping decisions:
 * - **ID**: Uses `objectId` for a unique identifier.
 * - **Address**: Combines `Street`, `Zip`, and `City` into a single address string.
 * - **Coordinates**: Uses the `PosLat` and `PosLng` fields, which are direct numerical values.
 * - **Rooms**: Defaults to 1, as the platform is for single rooms in shared flats.
 * - **Size**: Uses `RoomSizeSquareMeter` for the size of the individual room.
 * - **Image URL**: Constructs the full image URL from the `PrimaryImage.Fid` field, as this is required by their CDN.
 * - **Detail URL**: Constructs the detail page URL using the `RoomNr` field.
 * 
 * @param item The raw listing object from the MeinWGZimmer API.
 * @returns A standardized `Property` object.
 */
export const mapMeinWGZimmerToProperty = (item: MeinWGZimmerResultItem): PropertyWithoutCommuteTimes => {
    const fullAddress = [item.Street, `${item.Zip} ${item.City}`].filter(Boolean).join(', ');
    
    let imageUrl: string | null = null;
    if (item.PrimaryImage?.Fid) {
        // Correct URL format as requested, e.g., https://cdn.meinwgzimmer.ch/image/68b1ce6a4e626-w640-h335
        imageUrl = `https://cdn.meinwgzimmer.ch/image/${item.PrimaryImage.Fid}-w640-h335`;
    }

    const detailUrl = `https://www.meinwgzimmer.ch/zimmer/${item.RoomNr}`;
    
    let rentalDuration: 'permanent' | 'temporary' = 'permanent';
    if (item.ValidUntil?.iso) {
        const validUntilDate = new Date(item.ValidUntil.iso);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (!isNaN(validUntilDate.getTime()) && validUntilDate < oneYearFromNow) {
            rentalDuration = 'temporary';
        }
    } else if (isTemporaryBasedOnText(item.RoomTitle)) {
        rentalDuration = 'temporary';
    }

    let genderPreference: 'any' | 'male' | 'female' = 'any';
    if (item.PreferedGender === 'male' || item.PreferedGender === 'female') {
        genderPreference = item.PreferedGender;
    }

    return {
        id: `meinwgzimmer-${item.objectId}`,
        providers: [{ name: 'MeinWGZimmer', url: detailUrl }],
        title: item.RoomTitle,
        description: item.RoomTitle,
        price: item.Price,
        rooms: 1, // meinwgzimmer.ch is for single rooms in shared flats
        size: item.RoomSizeSquareMeter,
        address: fullAddress,
        lat: item.PosLat,
        lng: item.PosLng,
        imageUrl: imageUrl || '',
        imageUrls: imageUrl ? [imageUrl] : [],
        createdAt: new Date(item.createdAt).toISOString(),
        type: 'sharedFlat',
        roommates: item.FlatSizeRoommates,
        rentalDuration,
        genderPreference,
    };
};

const _fetchMeinWGZimmerApi = async (
    bucket: FilterBucket,
    searchCoords: { lat: number; lng: number },
    radiusKm: number,
    requestManager: RequestManager,
    createdSince?: Date
): Promise<MeinWGZimmerResultItem[]> => {
    
    if (requestManager.count >= requestManager.limit) {
        const message = `[DEBUG MODE] MeinWGZimmer request limit (${requestManager.limit}) reached.`;
        console.warn(message);
        throw new RequestLimitError(message);
    }

    const priceRange = { min: parseFloat(bucket.price.min) || null, max: parseFloat(bucket.price.max) || null };
    const sizeRange = { min: parseFloat(bucket.size.min) || null, max: parseFloat(bucket.size.max) || null };
    const roommatesRange = { min: parseFloat(bucket.roommates.min) || null, max: parseFloat(bucket.roommates.max) || null };

    
    const where: any = { Status: "active" };
    if (priceRange.max || priceRange.min) {
        where.Price = {};
        if (priceRange.max) where.Price["$lte"] = priceRange.max;
        if (priceRange.min) where.Price["$gte"] = priceRange.min;
    }
    if (sizeRange.max || sizeRange.min) {
        where.RoomSizeSquareMeter = {};
        if (sizeRange.max) where.RoomSizeSquareMeter["$lte"] = sizeRange.max;
        if (sizeRange.min) where.RoomSizeSquareMeter["$gte"] = sizeRange.min;
    }
     if (roommatesRange.max || roommatesRange.min) {
        where.FlatSizeRoommates = {};
        if (roommatesRange.max) where.FlatSizeRoommates["$lte"] = roommatesRange.max;
        if (roommatesRange.min) where.FlatSizeRoommates["$gte"] = roommatesRange.min;
    }

    const maxDistanceRadians = (radiusKm * 1.1) / 6371; // 10% buffer
    where.Location = {
        "$nearSphere": { "__type": "GeoPoint", "latitude": searchCoords.lat, "longitude": searchCoords.lng },
        "$maxDistance": maxDistanceRadians
    };

    if (createdSince) {
        where.createdAt = { "$gte": { "__type": "Date", "iso": createdSince.toISOString() } };
    }

    const payload = {
        where,
        keys: "RoomNr,PosLat,PosLng,PrimaryImage.Fid,objectId,createdAt,Location,Price,RoomTitle,Street,Zip,City,RoomSizeSquareMeter,Status,ValidUntil,FlatSizeRoommates,PreferedGender",
        limit: 500,
        _method: "GET",
        _ApplicationId: MEINWGZIMMER_APP_ID,
        _JavaScriptKey: MEINWGZIMMER_JS_KEY
    };
    
    try {
        requestManager.count++;
        const response = await meinWgZimmerRateLimiter.schedule(() => fetch(MEINWGZIMMER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }));
        if (!response.ok) throw new Error(`API request failed with status ${response.status} (${response.statusText}): ${await response.text()}`);

        const data: MeinWGZimmerResponse = await response.json();
        return data.results || [];

    } catch (error) {
        console.error(`Failed to fetch from MeinWGZimmer:`, error);
        throw new RequestLimitError(`Failed to fetch from MeinWGZimmer: ${error}`);
    }
};

export const fetchMeinWGZimmerApi = memoize(
    _fetchMeinWGZimmerApi,
    (bucket, searchCoords, radiusKm, _, createdSince) => {
        const {id, ...bucketWithoutId} = bucket;
        return `meinWGZimmer-api:${JSON.stringify({ bucketWithoutId, searchCoords, radiusKm, createdSince: createdSince?.toISOString() })}`
    },
    SHORT_CACHE_TTL_MS
);
