
import { GEOAPIFY_API_KEY } from '../../constants';
import { cacheService, LONG_CACHE_TTL_MS } from '../cache';
import { IsochroneData } from '../../types';
import { fetchGeoapify } from './geoapifyService';

type GeoapifyProfile = 'drive' | 'bicycle' | 'walk' | 'approximated_transit';
type TravelMode = 'car' | 'bike' | 'walk' | 'public';

const mapTravelModeToGeoapifyProfile = (mode: TravelMode): GeoapifyProfile => {
    switch (mode) {
        case 'car': return 'drive';
        case 'bike': return 'bicycle';
        case 'walk': return 'walk';
        case 'public': return 'approximated_transit';
    }
};

/**
 * Fetches an isochrone polygon from Geoapify.
 * @param coords The starting coordinates { lat, lng }.
 * @param travelMode The mode of transport.
 * @param maxTravelTimeInMinutes The maximum travel time in minutes.
 * @returns A promise that resolves to a polygon (array of [lng, lat] coordinates) or null on failure.
 */
export const getIsochrone = async (
    coords: { lat: number; lng: number },
    travelMode: TravelMode,
    maxTravelTimeInMinutes: number
): Promise<IsochroneData | null> => {
    const profile = mapTravelModeToGeoapifyProfile(travelMode);
    const rangeInSeconds = maxTravelTimeInMinutes * 60;
    const cacheKey = `isochrone-geoapify:${profile}:${coords.lat},${coords.lng}:${maxTravelTimeInMinutes}`;

    return cacheService.getOrSet(cacheKey, async () => {
        const apiUrl = `https://api.geoapify.com/v1/isoline?lat=${coords.lat}&lon=${coords.lng}&type=time&mode=${profile}&traffic=approximated&range=${rangeInSeconds}&apiKey=${process.env.GEOAPIFY_API_KEY}`;
        try {
            const response = await fetchGeoapify(apiUrl);
            if (!response.ok) {
                console.error(`Geoapify Isoline API error for ${profile}: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const geometry = data.features[0].geometry;
                let polygon: number[][] | undefined;

                if (geometry.type === 'Polygon') {
                    // It's an array of rings, we take the first (outer) one.
                    polygon = geometry.coordinates[0];
                } else if (geometry.type === 'MultiPolygon') {
                    // It's an array of polygons. We take the first polygon's outer ring.
                    // This is a simplification; a more robust solution might handle all polygons.
                    polygon = geometry.coordinates[0][0];
                }
                
                if (polygon) {
                    return { mode: travelMode, polygon };
                }
            }
            return null;
        } catch (error) {
            console.error(`Failed to fetch isochrone from Geoapify for ${profile}:`, error);
            return null;
        }
    }, LONG_CACHE_TTL_MS);
};

/**
 * Fetches route travel time from Geoapify.
 * @param from The starting coordinates { lat, lng }.
 * @param to The destination coordinates { lat, lng }.
 * @param travelMode The mode of transport.
 * @returns A promise that resolves to the travel time in minutes or null on failure.
 */
export const getRouteTime = async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    travelMode: 'car' | 'bike' | 'walk'
): Promise<number | null> => {
    const profile = mapTravelModeToGeoapifyProfile(travelMode);
    const cacheKey = `route-geoapify:${profile}:${from.lat},${from.lng}-${to.lat},${to.lng}`;

    return cacheService.getOrSet(cacheKey, async () => {
        const apiUrl = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=${profile}&apiKey=${process.env.GEOAPIFY_API_KEY}`;
        try {
            const response = await fetchGeoapify(apiUrl);
            if (!response.ok) {
                 console.error(`Geoapify Routing API error for ${profile}: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const durationInSeconds = data.features[0].properties.time;
                return Math.round(durationInSeconds / 60);
            }
            return null;
        } catch (error) {
            console.error(`Failed to fetch route time from Geoapify for ${profile}:`, error);
            return null;
        }
    }, LONG_CACHE_TTL_MS);
};
