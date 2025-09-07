
import { Property } from '../../../../types';
import { HomegateResult, HomegateApiResponse } from './types';
import { proxy } from '../../proxy';
import { RequestManager } from '../providerTypes';
import { RateLimiter } from '../../rateLimiter';
import { isTemporaryBasedOnText } from '../../../../utils/textUtils';

const HOMEGATE_API_URL = 'https://api.homegate.ch/search/listings';
const homegateRateLimiter = new RateLimiter(2); // 2 requests per second

export const mapHomegateToProperty = (item: HomegateResult): Property | null => {
    const { listing } = item;
    if (!listing.id || !listing.address.geoCoordinates) return null;

    const localization = listing.localization[listing.localization.primary] || listing.localization.de;
    const fullAddress = [listing.address.street, `${listing.address.postalCode} ${listing.address.locality}`]
        .filter(Boolean)
        .join(', ');
    
    const imageUrls = localization.attachments
        .filter(att => att.type === 'IMAGE' && att.url)
        .map(att => att.url);
        
    const detailUrl = `https://www.homegate.ch/rent/${listing.id}`;
    const fullText = [localization.text.title, localization.text.description].filter(Boolean).join('\n');

    return {
        id: `homegate-${listing.id}`,
        providers: [{ name: 'Homegate', url: detailUrl }],
        title: localization.text.title,
        description: fullText,
        price: listing.prices.rent.gross || listing.prices.rent.net || 0,
        rooms: listing.characteristics.numberOfRooms,
        size: listing.characteristics.livingSpace || null,
        address: fullAddress,
        lat: listing.address.geoCoordinates.latitude,
        lng: listing.address.geoCoordinates.longitude,
        imageUrl: imageUrls[0] || '',
        imageUrls: imageUrls,
        createdAt: new Date(listing.meta.createdAt).toISOString(),
        type: 'property', // Homegate lists properties and houses
        rentalDuration: isTemporaryBasedOnText(fullText) ? 'temporary' : 'permanent',
        genderPreference: 'any', // Not specified
    };
};

export const formatCityForHomegate = (city: string): string => {
    const formatted = city
        .toLowerCase()
        .split(',')[0] // Take only the city part
        .replace(/\s*\(([a-z]{2})\)/, '-$1') // Remove brackets from canton suffixes
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `geo-city-${formatted}`;
};

export const fetchHomegateApi = async (query: object, requestManager: RequestManager): Promise<HomegateApiResponse | null> => {
    try {
        requestManager.count++;
        const response = await homegateRateLimiter.schedule(() => fetch(proxy(HOMEGATE_API_URL), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        }));

        if (!response.ok) {
            console.error(`Homegate API request failed with status ${response.status}`, await response.text());
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch from Homegate API:`, error);
        return null;
    }
};
