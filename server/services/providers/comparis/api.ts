import {
    AdDetails,
    DetailsRequest,
    DetailsResponse,
    ResultAd,
    ResultListRequest,
    ResultListResponse,
    SearchCriteria,
} from './types';
import { PropertyWithoutCommuteTimes, RequestManager } from '../providerTypes';
import { proxy } from '../../proxy';
import { RateLimiter } from '../../rateLimiter';
import { isTemporaryBasedOnText } from '../../../../utils/textUtils';
import { memoizeGenerator, SHORT_CACHE_TTL_MS } from '../../cache';
import { RequestLimitError } from '../../errors';
import { randomUUID } from 'crypto';

const comparisRateLimiter = new RateLimiter(1);

const ANDROID_MODELS = ['M2012K11AG', 'SM-G991B', 'SM-A525F', 'Pixel 6', 'Pixel 7 Pro'];

const getRandomModel = () => ANDROID_MODELS[Math.floor(Math.random() * ANDROID_MODELS.length)];

const getComparisHeaders = () => {
    return {
        'deviceapplicationguid': randomUUID(),
        'bundlename': 'ch.comparis.immoapp',
        'bundleversion': '9.12.1',
        'platform': 'Android',
        'platformversion': '15',
        'device': 'Android',
        'model': getRandomModel(),
        'accept': 'application/vnd.comparis.immobilien.v2+json',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Linux; Android 15; M2012K11AG Build/BP1A.250505.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.143 Mobile Safari/537.36 [comparis Property Android/9.12.1]',
        'accept-encoding': 'gzip, deflate',
    };
};

/**
 * Fetches detailed information for a single property ad.
 * @param adId The ID of the ad to fetch.
 * @returns The detailed ad information.
 */
export const fetchComparisDetails = async (adId: number): Promise<AdDetails> => {
    const requestObject: DetailsRequest = {
        AdId: adId,
        Header: {
            Language: 'en',
            Locale: 'en-GB',
        },
    };

    const url = `https://en.comparis.ch/immobilien/api/mobile/details?requestObject=${encodeURIComponent(JSON.stringify(requestObject))}`;

    const response = await fetch(proxy(url), {
        headers: getComparisHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Comparis details API request failed with status ${response.status}`);
    }

    const data: DetailsResponse = await response.json();

    if (data.Header?.StatusCode ?? 0 !== 0) {
        throw new Error(`Comparis details API returned status code ${data.Header?.StatusCode}: ${data.Header?.DebugMessage}`);
    }

    return data.Ad;
};


/**
 * Maps a raw `ResultAd` from the new API to our standardized `Property` object.
 */
export const mapComparisToProperty = (item: ResultAd): PropertyWithoutCommuteTimes | null => {
    if (!item.AdId || !item.PriceValue || !item.GeoCoordinates) return null;

    const detailUrl = `https://www.comparis.ch/immobilien/marktplatz/details/show/${item.AdId}`;

    const propertyType = item.RootPropertyTypeID === 3 ? 'sharedFlat' : 'property';
    const fullText = [item.ContactAdTitle].filter(Boolean).join('\n');

    let createdAt: Date | undefined = undefined;
    if (item.LastRelevantChangeDate) {
        // The date is in "dd.MM.yyyy HH:mm:ss" format, need to parse it correctly
        const parts = item.LastRelevantChangeDate.match(/(\d+)/g);
        if (parts && parts.length >= 5) {
            // new Date(year, monthIndex, day, hours, minutes, seconds)
            createdAt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4]), parseInt(parts[5] || '0'));
        }
    }


    return {
        id: `comparis-${item.AdId}`,
        providers: [{ name: 'Comparis', url: detailUrl }],
        title: item.ContactAdTitle,
        description: fullText,
        price: item.PriceValue,
        rooms: item.Rooms,
        size: item.Area,
        address: `${item.Street}, ${item.Zip} ${item.City}`,
        lat: item.GeoCoordinates.Latitude,
        lng: item.GeoCoordinates.Longitude,
        imageUrl: item.ThumbnailImageUrl || (item.ImageUrls && item.ImageUrls[0]) || '',
        imageUrls: item.ImageUrls || [],
        createdAt: createdAt?.toISOString(),
        type: propertyType,
        rentalDuration: isTemporaryBasedOnText(fullText) ? 'temporary' : 'permanent',
        genderPreference: 'any', // Not specified
    };
};

/**
 * Fetches properties from the Comparis API for a given search criteria, handling pagination.
 */
async function* _fetchComparisApi(searchCriteria: SearchCriteria, requestManager: RequestManager): AsyncGenerator<ResultAd[]> {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        if (requestManager.count >= requestManager.limit) {
            throw new RequestLimitError('Request limit reached for Comparis provider.');
        }

        const task = async () => {
            requestManager.count++;

            const requestObject: ResultListRequest = {
                Page: page,
                SearchCriteria: searchCriteria,
                Header: {
                    Language: 'en',
                    Locale: 'en-GB',
                },
            };

            const url = `https://en.comparis.ch/immobilien/api/mobile/resultlist?requestObject=${encodeURIComponent(JSON.stringify(requestObject))}`;

            try {
                const response = await fetch(proxy(url), {
                    headers: getComparisHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`Comparis API request failed with status ${response.status} (${response.statusText}): ${await response.text()}`);
                }

                const data: ResultListResponse = await response.json();

                if (data.Header.StatusCode !== 0) {
                    throw new Error(`Comparis API returned status code ${data.Header.StatusCode} (${data.Header.StatusMessage}): ${data.Header.DebugMessage}`);
                }

                if (data && data.Ads && data.Ads.length > 0) {
                    page++;
                    hasMore = data.CurrentPage < data.TotalPages - 1;
                    return data.Ads;
                } else {
                    hasMore = false;
                    return [];
                }
            } catch (error) {
                throw new Error('Failed to fetch from Comparis API', { cause: error } );
            }
        };

        const ads = await comparisRateLimiter.schedule(task);
        if (ads.length > 0) {
            yield ads;
        }
    }
}

export const fetchComparisApi = memoizeGenerator(
    _fetchComparisApi,
    (searchCriteria: SearchCriteria) => `comparis-search-${JSON.stringify(searchCriteria)}`,
    SHORT_CACHE_TTL_MS
);
