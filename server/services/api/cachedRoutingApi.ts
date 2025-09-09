import { Property, TravelMode } from '../../../types';
import { getRouteTime } from './openRouteServiceApi';
import { getPublicTransportTime } from './openDataTransportApi';
import { cacheService, LONG_CACHE_TTL_MS } from '../cache';
import { PropertyWithoutCommuteTimes } from '../providers/providerTypes';

// Grid cell size in degrees. ~0.002 degrees is roughly 222 meters.
const GRID_CELL_SIZE = 0.002;

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
export const enrichItemsWithTravelTimes = async (
    items: PropertyWithoutCommuteTimes[],
    destCoords: { lat: number; lng: number },
    travelModes: TravelMode[],
    queryPublicTransport: boolean
): Promise<Property[]> => {
    // A map of promises, one for each unique grid cell, to avoid redundant fetches within a single run.
    const cellPromises = new Map<string, Promise<Partial<Record<TravelMode, number | null>>>>();

    // This function fetches and caches travel times for a single grid cell.
    const getCellTravelTimes = async (item: PropertyWithoutCommuteTimes): Promise<Partial<Record<TravelMode, number | null>>> => {
        const from = { lat: item.lat, lng: item.lng };
        const cellId = getCellId(item.lat, item.lng);
        const cacheKey = `travel-time-cell:${cellId}:${destCoords.lat},${destCoords.lng}`;
        
        const cachedData = await cacheService.get<Partial<Record<TravelMode, number | null>>>(cacheKey) || {};
        const newData: Partial<Record<TravelMode, number | null>> = {};
        const fetchTasks: Promise<void>[] = [];

        // Helper to check if a mode needs fetching and add its async task.
        const addFetchTask = (mode: TravelMode, task: Promise<number | null>) => {
            // Only fetch if the mode was requested AND is not already in the cache.
            if (travelModes.includes(mode) && cachedData[mode] === undefined) {
                fetchTasks.push(task.then(result => { newData[mode] = result; }));
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
            return { ...item, commuteTimes: {} }; // Return item as is, without travel times
        }
        
        const cellId = getCellId(item.lat, item.lng);
        const cellData = await cellPromises.get(cellId) || {};
        
        // Construct a result object with only the specifically requested travel times.
        const commuteTimes: Partial<Record<TravelMode, number | null>> = {};
        travelModes.forEach(mode => {
            if (cellData[mode] !== undefined) {
                commuteTimes[mode] = cellData[mode];
            }
        });

        return { ...item, commuteTimes };
    }));

    return enrichedItems;
};