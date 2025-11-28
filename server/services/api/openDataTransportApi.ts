
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
        // Get next Monday at 08:00 for realistic commute time
        const getNextMondayMorning = (): Date => {
            const date = new Date();
            date.setHours(8, 0, 0, 0);
            date.setDate(date.getDate() + (8 - date.getDay()) % 7);
            return date;
        };

        // [YYYY-MM-DD, HH:MM]
        const [dateStr, timeStr] = getNextMondayMorning().toISOString().slice(0, 16).split('T'); 
        // Request multiple connections to find the shortest one
        const apiUrl = `https://transport.opendata.ch/v1/connections?`+
            `from=${from.lat},${from.lng}&to=${to.lat},${to.lng}&` +
            `date=${dateStr}&time=${timeStr}&limit=10`;

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
                // Parse all connections and find the shortest one
                let shortestDuration: number | null = null;
                
                for (const connection of data.connections) {
                    const durationString = connection.duration; // e.g., "00d00:23:00"
                    const parts = durationString.split(':');
                    const hours = parseInt(parts[0].slice(-2), 10);
                    const minutes = parseInt(parts[1], 10);
                    
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        const totalMinutes = hours * 60 + minutes;
                        if (shortestDuration === null || totalMinutes < shortestDuration) {
                            shortestDuration = totalMinutes;
                        }
                    }
                }
                
                if (shortestDuration === null)
                    console.log("Public transport time could not be determined:", data);
                return shortestDuration;
            }
            console.error("Public transport time got unexpected json:", data);
            return null;
        } catch (error) {
            console.error("Failed to fetch public transport time:", error);
            return null;
        }
    }, LONG_CACHE_TTL_MS);
};
