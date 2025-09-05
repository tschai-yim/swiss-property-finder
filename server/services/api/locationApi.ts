
import { GEOAPIFY_API_KEY } from '../../constants';
import { BoundingBox, City } from '../../types';
import { cacheService, LONG_CACHE_TTL_MS } from '../cache';
import { fetchGeoapify } from './geoapifyService';

// List of public Overpass API endpoints to try in order. This provides resilience
// against a single endpoint being overloaded or temporarily down.
const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
];

/**
 * Executes an Overpass query against a series of endpoints.
 * @param query The Overpass query string (e.g., `[out:json]; node(around:1000,50.7,7.1); out;`).
 * @returns The JSON response data from the first successful endpoint, or null if all attempts fail.
 */
const executeOverpassQuery = async (query: string): Promise<any | null> => {
    for (const endpoint of OVERPASS_ENDPOINTS) {
        const url = `${endpoint}?data=${encodeURIComponent(query)}`;
        try {
            // Set a generous timeout for the fetch request itself to catch unresponsive servers.
            const response = await fetch(url, { signal: AbortSignal.timeout(45000) }); // 45-second timeout

            if (response.ok) {
                return await response.json(); // Success!
            }

            console.error(`Overpass API error at ${endpoint}:`, response.status, response.statusText);
            
            // If it's a client error (e.g., 400 Bad Request), the query is likely malformed.
            // Don't retry with other endpoints as they will probably fail too.
            if (response.status >= 400 && response.status < 500) {
                console.error("Query failed with a client error, aborting retries.");
                return null;
            }
            // For server errors (5xx) or timeouts, we'll automatically try the next endpoint in the list.
        } catch (error) {
            // This catches network errors or the AbortSignal timeout.
            console.error(`Failed to fetch from Overpass endpoint ${endpoint}:`, error);
        }
    }
    console.error("All Overpass API endpoints failed for the query.");
    return null;
};

export const findNearbyCities = async (coords: { lat: number; lng: number }, radiusKm: number = 15): Promise<string[]> => {
    const cacheKey = `nearby-cities:${coords.lat},${coords.lng}:${radiusKm}`;
    return cacheService.getOrSet(cacheKey, async () => {
        const radiusMeters = radiusKm * 1000;
        // Increased the server-side timeout for the query itself.
        const overpassQuery = `[out:json][timeout:40];(node["place"~"^(city|town|village)$"](around:${radiusMeters},${coords.lat},${coords.lng}););out body;`;
        
        const geoapifyApiUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.lat}&lon=${coords.lng}&apiKey=${process.env.GEOAPIFY_API_KEY}`;

        try {
            const [overpassData, geoapifyResponse] = await Promise.all([
                executeOverpassQuery(overpassQuery),
                fetchGeoapify(geoapifyApiUrl)
            ]);

            let nearbyCities: string[] = [];
            if (overpassData && overpassData.elements) {
                nearbyCities = overpassData.elements
                    .map((el: any) => el.tags.name)
                    .filter((name: string | undefined): name is string => !!name);
            }

            let primaryCity: string | null = null;
            if (geoapifyResponse.ok) {
                 const data = await geoapifyResponse.json();
                 if (data.features && data.features.length > 0) {
                    const props = data.features[0].properties;
                    primaryCity = props.city || props.town || props.village || null;
                 }
            }
            
            const allCities = primaryCity ? [primaryCity, ...nearbyCities] : nearbyCities;
            const uniqueCities = Array.from(new Set(allCities));
            
            return uniqueCities.slice(0, 10); // Limit to a reasonable number
        } catch (error) {
            console.error("Failed to find nearby cities:", error);
            return [];
        }
    }, LONG_CACHE_TTL_MS);
};

export const findCitiesInBoundingBox = async (bbox: BoundingBox): Promise<City[]> => {
    const { minLat, minLng, maxLat, maxLng } = bbox;
    const cacheKey = `cities-in-bbox:${minLat},${minLng},${maxLat},${maxLng}`;
    
    return cacheService.getOrSet(cacheKey, async () => {
        // This multi-step query first finds nodes for places (cities, towns) within the bounding box.
        // Then, it finds the administrative boundary relations that these nodes belong to.
        // This ensures we get the full boundary for a city even if only its center point is within the initial search box.
        const overpassQuery = `[out:json][timeout:90];node["place"~"^(city|town|village)$"](${minLat},${minLng},${maxLat},${maxLng})->.places;rel(bn.places)["boundary"="administrative"]["admin_level"~"^[89]$"];out tags bb;`;

        try {
            const data = await executeOverpassQuery(overpassQuery);
            if (!data || !data.elements) {
                 console.error('Overpass query succeeded but returned no elements or invalid data.');
                 return [];
            }

            const cities: City[] = data.elements
                .map((el: any): City | null => {
                    // We need both a name and a bounding box.
                    if (!el.tags?.name || !el.bounds) {
                        return null;
                    }
                    // Overpass returns bounds with minlat, minlon, etc.
                    const cityBbox: BoundingBox = {
                        minLat: el.bounds.minlat,
                        minLng: el.bounds.minlon,
                        maxLat: el.bounds.maxlat,
                        maxLng: el.bounds.maxlon,
                    };
                    return { name: el.tags.name, bbox: cityBbox };
                })
                .filter((city: City | null): city is City => city !== null);

            // Deduplicate cities by name, as Overpass might return multiple elements for the same place.
            // We'll keep the first one found. A more advanced approach might merge bboxes, but this is sufficient.
            const uniqueCities = Array.from(new Map(cities.map(city => [city.name, city])).values());

            return uniqueCities;
        } catch (error) {
            console.error("Failed to find cities in bounding box:", error);
            return [];
        }
    }, LONG_CACHE_TTL_MS);
};
