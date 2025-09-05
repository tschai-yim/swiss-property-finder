
import { cacheService, LONG_CACHE_TTL_MS } from '../cache';
import { GEOAPIFY_API_KEY } from '../../constants';
import { fetchGeoapify } from './geoapifyService';

export const fetchAddressSuggestions = async (query: string): Promise<{ display_name: string }[]> => {
    if (!query || query.length < 3) return [];
    
    const cacheKey = `suggestions-geoapify:${query}`;
    return cacheService.getOrSet(cacheKey, async () => {
        const apiUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:ch&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
        try {
            const response = await fetchGeoapify(apiUrl);
            if (!response.ok) return [];
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                return data.features.map((feature: any) => ({
                    display_name: feature.properties.formatted,
                }));
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch address suggestions from Geoapify:", error);
            return [];
        }
    }, LONG_CACHE_TTL_MS);
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const cacheKey = `geocode-geoapify:${address}`;
    return cacheService.getOrSet(cacheKey, async () => {
        const apiUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&filter=countrycode:ch&limit=1&apiKey=${GEOAPIFY_API_KEY}`;
        try {
            const response = await fetchGeoapify(apiUrl);
            if (!response.ok) return null;
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const { lat, lon } = data.features[0].properties;
                return { lat: parseFloat(lat), lng: parseFloat(lon) };
            }
            return null;
        } catch (error) { 
            console.error(`Geocoding failed for address with Geoapify: ${address}`, error);
            return null; 
        }
    }, LONG_CACHE_TTL_MS);
};
