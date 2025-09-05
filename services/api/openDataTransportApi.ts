
import { cacheService, LONG_CACHE_TTL_MS } from '../cache';
import { RateLimiter } from '../rateLimiter';

const transportApiRateLimiter = new RateLimiter(10); // 10 requests per second

/**
 * Fetches public transport travel time from opendata.transport.ch.
 * Implements a rate limiter and an exponential backoff retry mechanism for 429 errors.
 * @param from The starting coordinates { lat, lng }.
 * @param to The destination coordinates { lat, lng }.
 * @returns A promise that resolves to the travel time in minutes or null on failure.
 */
export const getPublicTransportTime = async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
): Promise<number | null> => {
    const cacheKey = `public-transport:${from.lat},${from.lng}-${to.lat},${to.lng}`;
    
    return cacheService.getOrSet(cacheKey, async () => {
        const apiUrl = `https://transport.opendata.ch/v1/connections?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}&limit=1`;

        const fetchWithBackoff = async (attempt = 1): Promise<Response> => {
            const response = await fetch(apiUrl);
            
            if (response.status === 429 && attempt <= 3) {
                // Exponential backoff: e.g., 500ms, 1000ms, 2000ms + jitter
                const jitter = Math.random() * 250;
                const delay = Math.pow(2, attempt - 1) * 500 + jitter;
                console.warn(`Rate limit hit for OpenData Transport. Retrying in ${delay.toFixed(0)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithBackoff(attempt + 1);
            }
            return response;
        };

        try {
            // Schedule the fetch-with-backoff operation through the rate limiter
            const response = await transportApiRateLimiter.schedule(fetchWithBackoff);
            
            if (!response.ok) {
                console.error(`OpenData Transport API error: ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            if (data.connections && data.connections.length > 0) {
                const durationString = data.connections[0].duration; // e.g., "00d00:23:00"
                const parts = durationString.split(':');
                const hours = parseInt(parts[0].slice(-2), 10);
                const minutes = parseInt(parts[1], 10);
                
                if (!isNaN(hours) && !isNaN(minutes)) {
                    return hours * 60 + minutes;
                }
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch public transport time:", error);
            return null;
        }
    }, LONG_CACHE_TTL_MS);
};
