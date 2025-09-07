import { Property } from '../../../../types';
import { proxy } from '../../proxy';
import { RequestManager } from '../providerTypes';
import { cacheService, LONG_CACHE_TTL_MS } from '../../cache';
import { WeegeeListing, WeegeeResponse, WeegeeDetailResponse, EnrichedWeegeeListing } from './types';
import { RateLimiter } from '../../rateLimiter';
import { isTemporaryBasedOnText } from '../../../../utils/textUtils';

const WEEGEE_BUILD_ID = 'h-LRGq2CpW9N_IbD1D7ea';
const weegeeRateLimiter = new RateLimiter(2); // 2 requests per second

const calculateCreatedAt = (created: { unit: string; value: number; }): Date | null => {
    const now = new Date();
    const value = created.value;
    switch (created.unit) {
        case 'minute':
        case 'minutes':
            now.setMinutes(now.getMinutes() - value);
            break;
        case 'hour':
        case 'hours':
            now.setHours(now.getHours() - value);
            break;
        case 'day':
        case 'days':
            now.setDate(now.getDate() - value);
            break;
        case 'week':
        case 'weeks':
            now.setDate(now.getDate() - (value * 7));
            break;
        default:
            return null;
    }
    return now;
};

/**
 * Maps a raw, enriched `WeegeeListing` from their API to our standardized `Property` object.
 * 
 * Key mapping decisions:
 * - **ID**: Uses `public_id` for a unique identifier.
 * - **Address**: Combines `address_street`, `address_postalcode`, and `address_locality`.
 * - **Coordinates**: Uses the precise `address_lat` and `address_lon` fields from the detail API, eliminating the need for a separate geocoding step.
 * - **Rooms**: Defaults to 1, as Weegee is primarily a platform for single rooms in shared flats and the API does not provide a room count.
 * - **Image URLs**: Normalizes image URLs by prefixing them with "https:" if they start with "//". It uses the `pictures` array from the detail view.
 * - **Creation Date**: Calculates the creation date from the `created` object from the detail view, providing a more precise timestamp.
 * 
 * @param item The enriched listing object, combining stub and detail data.
 * @returns A standardized `Property` object, or `null` if essential data (like coordinates) is missing.
 */
export const mapWeegeeToProperty = (item: EnrichedWeegeeListing): Property | null => {
    if (!item.public_id || !item.address_lat || !item.address_lon) {
        return null;
    }

    const address = [item.address_street, item.address_postalcode, item.address_locality]
        .filter(Boolean)
        .join(', ');
    
    const rawImageUrls = item.pictures && item.pictures.length > 0 ? item.pictures : [item.main_image];
    const imageUrls = rawImageUrls
        .map(url => {
            if (!url) return null;
            if (url.startsWith('//')) return 'https:' + url;
            return url;
        })
        .filter((url): url is string => !!url);

    const detailUrl = `https://www.weegee.ch${item.detail_url}`;
    
    const creationData = item.created;

    const title = item.text_description_extract || `Room in ${item.address_locality}`;
    const fullText = item.text_description_extract || '';

    let rentalDuration: 'permanent' | 'temporary' = item.temporarily ? 'temporary' : 'permanent';

    // If API says permanent, double-check text for an overriding end date.
    if (!item.temporarily && isTemporaryBasedOnText(fullText)) {
        rentalDuration = 'temporary';
    }

    return {
        id: `weegee-${item.public_id}`,
        providers: [{ name: 'Weegee', url: detailUrl }],
        title: title,
        description: fullText,
        price: item.price,
        rooms: 1, // Weegee API does not provide room count, defaulting to 1 as it's often shared flats
        size: item.characteristics_livingspace,
        address: address,
        lat: item.address_lat,
        lng: item.address_lon,
        imageUrl: imageUrls[0] || '',
        imageUrls: imageUrls,
        createdAt: creationData ? (calculateCreatedAt(creationData)?.toISOString() ?? undefined) : undefined,
        type: 'sharedFlat',
        rentalDuration,
        genderPreference: item.women_only ? 'female' : 'any',
    };
};

export const fetchWeegeeStubs = async (city: string, requestManager: RequestManager): Promise<WeegeeListing[]> => {
    const cityListings: WeegeeListing[] = [];
    let page = 1;
    let hasMore = true;

    const formattedCity = city
        .toLowerCase()
        .replace(/\s*\(([a-z]{2})\)/, '-$1')
        .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    while (hasMore) {
        if (requestManager.count >= requestManager.limit) {
            break;
        }

        const apiUrl = `https://weegee.ch/api/en/search/city-${formattedCity}?page=${page}`;
        
        try {
            requestManager.count++;
            const response = await weegeeRateLimiter.schedule(() => fetch(proxy(apiUrl)));
            if (!response.ok) {
                 if (response.status === 404) {
                    hasMore = false;
                    continue;
                 }
                 throw new Error(`Status ${response.status}`);
            }
            
            const data = (await response.json()) as WeegeeResponse;

            if (data.listings?.length > 0) cityListings.push(...data.listings);
            if (page >= data.num_pages || page >= 3) hasMore = false; else page++;
        } catch (error) {
            console.error(`Failed to fetch from Weegee for ${city} on page ${page}:`, error);
            hasMore = false;
        }
    }
    return cityListings;
};

export const fetchWeegeeDetails = async (listing: WeegeeListing): Promise<EnrichedWeegeeListing | null> => {
    const detailUrl = `https://weegee.ch/_next/data/${WEEGEE_BUILD_ID}/en/wg/-/${listing.public_id}.json`;
    const cacheKey = `weegee-detail:${listing.public_id}`;

    try {
        const data = await cacheService.getOrSet(cacheKey, async () => {
            const response = await weegeeRateLimiter.schedule(() => fetch(proxy(detailUrl)));
            return response.ok ? (await response.json()) as WeegeeDetailResponse : null;
        }, LONG_CACHE_TTL_MS);
        
        if (data) {
            const detailProps = data.pageProps.listing;
            return { ...listing, ...detailProps };
        }
    } catch (e) {
        console.error(`Failed to fetch details for weegee listing ${listing.public_id}`, e);
    }
    return null;
};