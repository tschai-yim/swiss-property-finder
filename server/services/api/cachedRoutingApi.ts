import { TravelMode } from '../../types';
import { getRouteTime } from './openRouteServiceApi';
import { getPublicTransportTime } from './openDataTransportApi';
import { cacheService, LONG_CACHE_TTL_MS } from '../cache';

// Grid cell size in degrees. ~0.002 degrees is roughly 222 meters.
const GRID_CELL_SIZE = 0.002;

interface TravelTimes {
    travelTimePublic: number | null | undefined;
    travelTimeBike: number | null | undefined;
    travelTimeCar: number | null | undefined;
    travelTimeWalk: number | null | undefined;
}

const getCellId = (lat: number, lng: number): string => {
    const x = Math.floor(lng / GRID_CELL_SIZE);
    const y = Math.floor(lat / GRID_CELL_SIZE);
    return `${x},${y}`;
};

/**
 * Enriches a batch of items (like properties) with travel times using a spatially-aware cache.
 * It groups items by grid cell, reads existing data from the cache for that cell, fetches only
 * the missing travel times that were requested, and updates the cache with the more complete data.
 * This enables fast initial searches and efficient lazy-loading.
 * 
 * @param items An array of objects, each with `lat` and `lng` properties.
 * @param destCoords The destination coordinates.
 * @param travelModes The travel modes to fetch data for.
 * @param queryPublicTransport Whether to query the public transport API.
 * @returns A promise that resolves to the array of items, enriched with the requested travel times.
 */
export const enrichItemsWithTravelTimes = async <T extends { lat: number; lng: number }>(
    items: T[],
    destCoords: { lat: number; lng: number },
    travelModes: TravelMode[],
    queryPublicTransport: boolean
): Promise<(T & Partial<TravelTimes>)[]> => {
    // A map of promises, one for each unique grid cell, to avoid redundant fetches within a single run.
    const cellPromises = new Map<string, Promise<Partial<TravelTimes>>>();

    // This function fetches and caches travel times for a single grid cell.
    const getCellTravelTimes = async (item: T): Promise<Partial<TravelTimes>> => {
        const from = { lat: item.lat, lng: item.lng };
        const cellId = getCellId(item.lat, item.lng);
        const cacheKey = `travel-time-cell:${cellId}:${destCoords.lat},${destCoords.lng}`;
        
        const cachedData = await cacheService.get<Partial<TravelTimes>>(cacheKey) || {};
        const newData: Partial<TravelTimes> = {};
        const fetchTasks: Promise<void>[] = [];

        // Helper to check if a mode needs fetching and add its async task.
        const addFetchTask = (mode: TravelMode, task: Promise<number | null>) => {
            const key = `travelTime${mode.charAt(0).toUpperCase() + mode.slice(1)}` as keyof TravelTimes;
            // Only fetch if the mode was requested AND is not already in the cache.
            if (travelModes.includes(mode) && cachedData[key] === undefined) {
                fetchTasks.push(task.then(result => { newData[key] = result; }));
            }
        };

        addFetchTask('public', queryPublicTransport ? getPublicTransportTime(from, destCoords) : Promise.resolve(null));
        addFetchTask('bike', getRouteTime(from, destCoords, 'bike'));
        addFetchTask('car', getRouteTime(from, destCoords, 'car'));
        addFetchTask('walk', getRouteTime(from, destCoords, 'walk'));

        // If we have new data to fetch, await the tasks and update the cache.
        if (fetchTasks.length > 0) {
            await Promise.all(fetchTasks);
            const combinedData = { ...cachedData, ...newData };
            await cacheService.set(cacheKey, combinedData, LONG_CACHE_TTL_MS);
            return combinedData;
        }

        // Otherwise, just return the data we found in the cache.
        return cachedData;
    };

    // Group items by cell and create one promise per cell to handle fetching.
    for (const item of items) {
        if (!item.lat || !item.lng) continue;
        const cellId = getCellId(item.lat, item.lng);
        if (!cellPromises.has(cellId)) {
            cellPromises.set(cellId, getCellTravelTimes(item));
        }
    }

    // Enrich all items by awaiting the promise for their respective cell.
    const enrichedItems = await Promise.all(items.map(async (item) => {
        if (!item.lat || !item.lng) {
            return { ...item }; // Return item as is, without travel times
        }
        
        const cellId = getCellId(item.lat, item.lng);
        const cellData = await cellPromises.get(cellId);
        
        // Construct a result object with only the specifically requested travel times.
        const resultTimes: Partial<TravelTimes> = {};
        if (travelModes.includes('public')) resultTimes.travelTimePublic = cellData?.travelTimePublic;
        if (travelModes.includes('bike')) resultTimes.travelTimeBike = cellData?.travelTimeBike;
        if (travelModes.includes('car')) resultTimes.travelTimeCar = cellData?.travelTimeCar;
        if (travelModes.includes('walk')) resultTimes.travelTimeWalk = cellData?.travelTimeWalk;
        
        return { ...item, ...resultTimes };
    }));

    return enrichedItems;
};