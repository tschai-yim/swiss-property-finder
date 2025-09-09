import { Property, FilterBucket } from '../../../../types';
import { TuttiApiResponse, TuttiListingNode } from './types';
import { PropertyWithoutCommuteTimes, RequestManager } from '../providerTypes';
import { proxy } from '../../proxy';
import { RateLimiter } from '../../rateLimiter';
import { isTemporaryBasedOnText } from '../../../../utils/textUtils';
import { memoizeGenerator, SHORT_CACHE_TTL_MS } from '../../cache';
import { RequestLimitError } from '../../errors';

const TUTTI_API_URL = 'https://www.tutti.ch/api/v10/graphql';
const TUTTI_API_HEADERS = {
    'Content-Type': 'application/json',
    'X-Tutti-Hash': '1e63962c-e049-4988-b64b-20b4306cc30c',
    'X-Tutti-Source': 'web r1.0-2025-08-22-10-28',
    'X-Tutti-Client-Identifier': 'web/1.0.0+env-live.git-786537f2',
};
const tuttiRateLimiter = new RateLimiter(0.1);

const TUTTI_GRAPHQL_QUERY = `
query SearchListingsByConstraints($constraints: ListingSearchConstraints, $first: Int!, $offset: Int!) {
  searchListingsByQuery(constraints: $constraints, category: "realEstate") {
    listings(first: $first, offset: $offset, sort: TIMESTAMP, direction: DESCENDING) {
      totalCount
      edges {
        node {
          listingID
          title
          body
          timestamp
          formattedPrice
          thumbnail { normalRendition: rendition(width: 235, height: 167) { src } }
          images(first: 10) { rendition(width: 600) { src } }
          properties { ... on ListingPropertyDescription { label text } }
          address
          postcodeInformation { postcode locationName }
          coordinates { latitude longitude }
          seoInformation { deSlug: slug(language: DE) }
        }
      }
    }
  }
}`;

export const formatCityForTutti = (city: string): string => {
    const formatted = city
        .toLowerCase()
        .split(',')[0] // Take only the city part
        .replace(/\s*\([^)]*\)/, '') // Remove canton suffixes like (ZH)
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `geo-city-${formatted}`;
}


const parseNumericProperty = (properties: { label: string; text: string }[], label: string): number | null => {
    const prop = properties.find(p => p.label === label);
    if (!prop || !prop.text) return null;
    const match = prop.text.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
};

const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/['’]/g, '').replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
};


export const mapTuttiToProperty = (item: TuttiListingNode): PropertyWithoutCommuteTimes | null => {
    if (!item.listingID || !item.coordinates) return null;

    const price = parsePrice(item.formattedPrice);
    if (price === 0) return null;

    const addressParts = [
        item.address,
        `${item.postcodeInformation.postcode} ${item.postcodeInformation.locationName}`
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    const imageUrls = (item.images && item.images.length > 0
        ? item.images.map(img => img.rendition.src)
        : [item.thumbnail?.normalRendition?.src]).filter(Boolean) as string[];

    let createdAt: Date | undefined = undefined;
    if (item.timestamp) {
        const date = new Date(item.timestamp);
        if (!isNaN(date.getTime())) {
            createdAt = date;
        }
    }

    const detailUrl = `https://www.tutti.ch/de/vi/${item.seoInformation.deSlug}/${item.listingID}`;
    const propertyType = item.title.toLowerCase().includes('wg') ? 'sharedFlat' : 'property';
    const fullText = [item.title, item.body].filter(Boolean).join('\n');

    return {
        id: `tutti-${item.listingID}`,
        providers: [{ name: 'Tutti.ch', url: detailUrl }],
        title: item.title,
        description: fullText,
        price,
        rooms: parseNumericProperty(item.properties, 'Zimmer') || 1,
        size: parseNumericProperty(item.properties, 'Wohnfläche (m²)'),
        address: fullAddress,
        lat: item.coordinates.latitude,
        lng: item.coordinates.longitude,
        imageUrl: imageUrls[0] || '',
        imageUrls: imageUrls,
        createdAt: createdAt?.toISOString(),
        type: propertyType,
        rentalDuration: isTemporaryBasedOnText(fullText) ? 'temporary' : 'permanent',
        genderPreference: 'any', // Not specified
    };
};

const _fetchTuttiApi = async function* (
    cities: string[],
    bucket: FilterBucket,
    requestManager: RequestManager
): AsyncGenerator<TuttiListingNode[]> {
    let offset = 0;
    const BATCH_SIZE = 200;
    
    const priceRange = { min: parseFloat(bucket.price.min) || null, max: parseFloat(bucket.price.max) || null };
    const roomsRange = { min: bucket.type === 'property' && bucket.rooms.min ? parseFloat(bucket.rooms.min) : null, max: bucket.type === 'property' && bucket.rooms.max ? parseFloat(bucket.rooms.max) : null };
    const sizeRange = { min: bucket.type === 'property' && bucket.size.min ? parseFloat(bucket.size.min) : null, max: bucket.type === 'property' && bucket.size.max ? parseFloat(bucket.size.max) : null };

    const listingType = bucket.type === 'property' ? ["apartment", "house"] : ["flatShare"];

    while (true) {
         if (requestManager.count >= requestManager.limit) {
            const message = `[DEBUG MODE] Tutti.ch request limit (${requestManager.limit}) reached for ${cities}.`;
            console.warn(message);
            throw new RequestLimitError(message);
        }

        const variables = {
            first: BATCH_SIZE,
            offset: offset,
            constraints: {
                intervals: [
                    { key: "realEstateSize", min: sizeRange.min, max: sizeRange.max },
                    { key: "realEstateRooms", min: roomsRange.min, max: roomsRange.max },
                ],
                locations: [{ key: "location", localities: cities.map(formatCityForTutti), radius: 0 }],
                prices: [{ key: "price", min: priceRange.min, max: priceRange.max, freeOnly: false }],
                strings: [
                    { key: "listingType", value: listingType },
                    { key: "priceType", value: ["RENT"] },
                    { key: "organic", value: ["tutti"] },
                ],
            },
        };

        try {
            requestManager.count++;
            const response = await tuttiRateLimiter.schedule(() => fetch(proxy(TUTTI_API_URL), {
                method: 'POST',
                headers: TUTTI_API_HEADERS,
                body: JSON.stringify({ query: TUTTI_GRAPHQL_QUERY, variables }),
            }));

            if (!response.ok) {
                throw new Error(`Tutti.ch GraphQL request failed with status ${response.status} (${response.statusText}): ${await response.text()}`);
            }

            const result = (await response.json()) as TuttiApiResponse;
            const listings = result.data?.searchListingsByQuery?.listings;
            
            if (!listings || listings.edges.length === 0) break;

            const nodes = listings.edges.map(edge => edge.node);
            yield nodes;
            
            offset += listings.edges.length;
            if (offset >= listings.totalCount) break;

        } catch (error) {
            console.error(`Failed to fetch properties from Tutti.ch for ${cities} with bucket ${bucket.id}:`, error);
            throw new RequestLimitError(`Failed to fetch properties from Tutti.ch: ${error}`);
        }
    }
}

export const fetchTuttiApi = memoizeGenerator(
    _fetchTuttiApi,
    (cities, bucket) => {
        const {id, ...withoutId} = bucket;
        return `tutti-api:${cities.join(',')}:${JSON.stringify(withoutId)}`
    },
    SHORT_CACHE_TTL_MS
);
