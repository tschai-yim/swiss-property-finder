
import { Property } from '../../../types';
import { RequestManager } from '../providerTypes';
import { WgZimmerResponse, WgZimmerRoom } from './types';
import { proxy } from '../../proxy';
import { RateLimiter } from '../../rateLimiter';
import { isTemporaryBasedOnText } from '../../../utils/textUtils';

const WGZIMMER_API_URL = 'https://www.wg-app.ch/wg-app-rooms/live-ads.json';
const WGZIMMER_AUTH_TOKEN = 'd2ctYXBwLWFsbC1yb29tczpqa25kc2ZodW5rw6clJmRzamhrZHNoamcyMzQ=';
const wgZimmerRateLimiter = new RateLimiter(2); // 2 requests per second

export const mapWgZimmerToProperty = (item: WgZimmerRoom): Property | null => {
    const lat = parseFloat(item.gpsLatitude);
    const lng = parseFloat(item.gpsLongitude);
    if (isNaN(lat) || isNaN(lng)) return null;

    const address = [item.contactAddress, `${item.contactPostal} ${item.contactCity}`].filter(Boolean).join(', ');
    
    const imageIds = [
        item.thumbnail, item.roomPicture2, item.roomPicture3, 
        item.roomPicture4, item.roomPicture5, item.roomPicture6
    ].filter(id => id && id.length > 0);

    const imageUrls = imageIds.map(id => `https://img.wgzimmer.ch/.imaging/wgzimmer_medium-jpg/dam/${id}/temp.jpg`);
    
    // Generate a concise title from the description.
    const title = item.roomDescription.split('\n')[0].trim() || `Room in ${item.contactCity}`;
    const fullText = [title, item.roomDescription, item.roomWeAre, item.roomWeSearch].filter(Boolean).join('\n');

    // 1. Start with the 'permanent' flag as the base.
    let rentalDuration: 'permanent' | 'temporary' = item.permanent ? 'permanent' : 'temporary';

    // 2. An explicit 'till' date or a date found in the text is a stronger signal for 'temporary'.
    // It overrides the 'permanent' flag if it indicates a short-term rental.
    if ((item.till && item.till.trim() !== '') || isTemporaryBasedOnText(fullText)) {
        rentalDuration = 'temporary';
    }

    return {
        id: `wgzimmer-${item.id}`,
        providers: [{ name: 'WGZimmer.ch', url: item.url }],
        title: title,
        description: fullText,
        price: item.price,
        rooms: 1, // wgzimmer.ch is for single rooms in shared flats
        size: null, // API does not provide room size
        address: address,
        lat,
        lng,
        imageUrl: imageUrls[0] || '',
        imageUrls,
        createdAt: new Date(item.creationDate),
        type: 'sharedFlat',
        rentalDuration: rentalDuration,
        genderPreference: 'any', // Not specified
    };
};

export const fetchAllWgZimmerListings = async (requestManager: RequestManager): Promise<WgZimmerRoom[]> => {
    if (requestManager.count >= requestManager.limit) {
        console.warn(`[DEBUG MODE] WGZimmer.ch request limit (${requestManager.limit}) reached.`);
        return [];
    }
    
    try {
        requestManager.count++;
        const response = await wgZimmerRateLimiter.schedule(() => fetch(proxy(WGZIMMER_API_URL), {
            headers: { 'Authorization': `Basic ${WGZIMMER_AUTH_TOKEN}` }
        }));
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const data: WgZimmerResponse = await response.json();
        return data.rooms || [];
    } catch (error) {
        console.error(`Failed to fetch from WGZimmer.ch:`, error);
        return [];
    }
};
