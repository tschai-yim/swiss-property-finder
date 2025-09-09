import { Property, FilterBucket } from '../../../../types';
import { ComparisResultItem } from './types';
import { PropertyWithoutCommuteTimes, RequestManager } from '../providerTypes';
import { proxy } from '../../proxy';
import { RateLimiter } from '../../rateLimiter';
import { isTemporaryBasedOnText } from '../../../../utils/textUtils';
import { memoizeGenerator, SHORT_CACHE_TTL_MS } from '../../cache';
import { RequestLimitError } from '../../errors';

const comparisRateLimiter = new RateLimiter(1);

const parseRooms = (essentialInfo: string[]): number => {
  const roomInfo = essentialInfo.find(info => info.includes('Zimmer') || info.includes('room'));
  if (roomInfo) {
    const roomMatch = roomInfo.match(/(\d+(\.\d+)?)/);
    if (roomMatch && roomMatch[1]) return parseFloat(roomMatch[1]);
  }
  // Fallback for listings like "WG-Zimmer" which might not explicitly state "1 Zimmer".
  return 1;
};

const parseSize = (essentialInfo: string[]): number | null => {
  const sizeInfo = essentialInfo.find(info => info.includes('m²'));
  if (sizeInfo) {
    const sizeMatch = sizeInfo.match(/(\d+)/);
    if (sizeMatch && sizeMatch[1]) return parseInt(sizeMatch[1], 10);
  }
  return null;
};

/**
 * Maps a raw `ComparisResultItem` from their API to our standardized `Property` object.
 * 
 * Key mapping decisions:
 * - **ID**: Uses `AdId` for a unique identifier.
 * - **Price**: Prefers the clean numerical `PriceValue` over the formatted `Price` string.
 * - **Size**: Prefers the clean numerical `AreaValue`. If it's null, it attempts to parse the size from the `EssentialInformation` array as a fallback.
 * - **Rooms**: Parses the room count from the `EssentialInformation` array, as there's no dedicated field.
 * - **Image URL**: Handles both absolute and relative URLs returned by the API.
 * - **Creation Date**: Parses the `Date` string into a Date object.
 * - **Coordinates**: Initializes `lat` and `lng` to 0, as they must be added later via a separate geocoding step.
 * 
 * @param item The raw listing object from the Comparis API.
 * @returns A standardized `Property` object, or `null` if the item is invalid.
 */
export const mapComparisToProperty = (item: ComparisResultItem): PropertyWithoutCommuteTimes | null => {
  if (!item.AdId || !item.PriceValue || !item.Address || item.Address.length === 0) return null;

  // Handle relative image URLs
  let imageUrl: string | null = item.ImageUrl;
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `https://www.comparis.ch${imageUrl}`;
  }

  let createdAt: Date | undefined = undefined;
  if (item.Date) {
    const date = new Date(item.Date);
    if (!isNaN(date.getTime())) {
      createdAt = date;
    }
  }

  const detailUrl = `https://www.comparis.ch/immobilien/marktplatz/details/show/${item.AdId}`;
  
  const propertyType = item.PropertyTypeText.toLowerCase().includes('wg-zimmer') ? 'sharedFlat' : 'property';
  const descriptionText = item.EssentialInformation.join(', ');
  const fullText = [item.Title, descriptionText].filter(Boolean).join('\n');

  return {
    id: `comparis-${item.AdId}`,
    providers: [{ name: 'Comparis', url: detailUrl }],
    title: item.Title,
    description: fullText,
    price: item.PriceValue,
    rooms: parseRooms(item.EssentialInformation),
    size: item.AreaValue ?? parseSize(item.EssentialInformation),
    address: item.Address.filter(Boolean).join(', '),
    lat: 0, // Comparis requires a separate geocoding step
    lng: 0,
    imageUrl: imageUrl || '',
    imageUrls: imageUrl ? [imageUrl] : [],
    createdAt: createdAt?.toISOString(),
    type: propertyType,
    rentalDuration: isTemporaryBasedOnText(fullText) ? 'temporary' : 'permanent',
    genderPreference: 'any', // Not specified
  };
};

/**
 * Fetches properties from the Comparis API for a single filter bucket and city, handling pagination.
 */
async function* _fetchComparisApi(city: string, bucket: FilterBucket, requestManager: RequestManager): AsyncGenerator<ComparisResultItem[]> {
  let page = 0;
  let hasMore = true;

  const minPrice = bucket.price.min ? parseFloat(bucket.price.min) : null;
  const maxPrice = bucket.price.max ? parseFloat(bucket.price.max) : null;
  const minRooms = bucket.type === 'property' && bucket.rooms.min ? parseFloat(bucket.rooms.min) : null;
  const maxRooms = bucket.type === 'property' && bucket.rooms.max ? parseFloat(bucket.rooms.max) : null;
  const minSize = bucket.type === 'property' && bucket.size.min ? parseFloat(bucket.size.min) : null;
  const maxSize = bucket.type === 'property' && bucket.size.max ? parseFloat(bucket.size.max) : null;
  
  const rootPropertyTypes = bucket.type === 'property' ? [1, 2, 4, 7] : [3];

  while (hasMore) {
    if (requestManager.count >= requestManager.limit) {
      const message = `[DEBUG MODE] Comparis request limit (${requestManager.limit}) reached. Halting further requests for this search.`;
      throw new RequestLimitError(message);
    }

    const requestObject = {
      Header: { Language: "en" },
      SearchParams: {
        DealType: 10, RootPropertyTypes: rootPropertyTypes, PropertyTypes: [],
        RoomsFrom: minRooms, RoomsTo: maxRooms,
        LivingSpaceFrom: minSize, LivingSpaceTo: maxSize,
        PriceFrom: minPrice, PriceTo: maxPrice,
        LocationSearchString: city, Page: page,
        Sort: 3 // Sort 3: created at descending
      },
    };
    const apiUrl = `https://www.comparis.ch/immobilien/api/v1/singlepage/resultitems?requestObject=${JSON.stringify(requestObject)}`;
    try {
      const response = await comparisRateLimiter.schedule(() => fetch(proxy(apiUrl)));
      requestManager.count++;

      if (!response.ok) throw new Error(`Comparis API request failed ${response.status} (${response.statusText}): ${await response.text()}`);
      const data = await response.json();
      if (data.ResultItems && data.ResultItems.length > 0) {
        yield data.ResultItems;
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Failed to fetch properties for ${city} (bucket ${bucket.id}) on page ${page}:`, error);
      hasMore = false;
      throw new RequestLimitError(`Failed to fetch properties from Comparis: ${error}`);
    }
  }
}

export const fetchComparisApi = memoizeGenerator(
    _fetchComparisApi,
    ( city, bucket ) => {
        const { id, ...bucketWithoutId } = bucket;
        return `comparis-api:${city}:${JSON.stringify(bucketWithoutId)}`;
    },
    SHORT_CACHE_TTL_MS
);
