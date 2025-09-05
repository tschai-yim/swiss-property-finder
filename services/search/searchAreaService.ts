import { FilterCriteria, SearchEvent, IsochroneData, City, BoundingBox } from '../../types';
import { geocodeAddress } from '../api/geoApi';
import { findNearbyCities, findCitiesInBoundingBox } from '../api/locationApi';
import { getIsochrone } from '../api/openRouteServiceApi';
import { getPolygonBoundingBox, mergeBoundingBoxes, padBoundingBox, doesPolygonIntersectBoundingBox, calculateDistance } from '../geoUtils';

const getCityFromSearch = (search: string): string => {
    const parts = search.split(',');
    return parts[0].trim();
};

/**
 * Determines the geographical area to search based on user filters.
 * This is an async generator that yields progress updates.
 * 
 * The process is as follows:
 * 1. Geocode the destination address.
 * 2. Fetch isochrones (reachable areas) for selected travel modes.
 * 3. Find cities/towns that intersect with these reachable areas.
 * 4. Use fallback methods (radius search, city name) if isochrones fail.
 * 
 * @param filters The user's search criteria.
 * @returns A promise that resolves to an object containing the destination coordinates,
 *          isochrones, overall bounding box, and a list of places to search.
 */
export async function* determineSearchArea(filters: FilterCriteria): AsyncGenerator<SearchEvent, {
    destinationCoords: { lat: number; lng: number; } | null;
    isochrones: IsochroneData[];
    overallBoundingBox: BoundingBox | null;
    places: City[];
}> {
    let destCoords: { lat: number; lng: number } | null = null;
    let isochrones: IsochroneData[] = [];
    let places: City[] = [];
    let overallBoundingBox: BoundingBox | null = null;

    if (filters.destination) {
        yield { type: 'progress', message: `Geocoding: ${filters.destination}...` };
        destCoords = await geocodeAddress(filters.destination);
        if (destCoords) {
            yield { type: 'metadata', metadata: { destinationCoords: destCoords } };
        }

        if (destCoords && filters.travelModes.length > 0) {
            yield { type: 'progress', message: 'Calculating reachable areas...' };
            const isochronePromises = filters.travelModes
                .map(mode => {
                    const time = parseInt(filters.maxTravelTimes[mode], 10);
                    return (time > 0) ? getIsochrone(destCoords!, mode, time) : null;
                })
                .filter((p): p is Promise<IsochroneData | null> => p !== null);
                
            isochrones = (await Promise.all(isochronePromises)).filter((p): p is IsochroneData => p !== null);
            if (isochrones.length > 0) {
                 yield { type: 'metadata', metadata: { isochrones } };
            }

            if (isochrones.length > 0) {
                yield { type: 'progress', message: 'Finding locations within reachable areas...' };
                const bboxes = isochrones.map(iso => getPolygonBoundingBox(iso.polygon));
                const mergedBbox = mergeBoundingBoxes(bboxes);
                overallBoundingBox = padBoundingBox(mergedBbox, 5);
                const candidateCities = await findCitiesInBoundingBox(overallBoundingBox);

                if (candidateCities.length > 0) {
                    yield { type: 'progress', message: `Checking ${candidateCities.length} locations...` };
                    places = candidateCities.filter(city => 
                        isochrones.some(iso => doesPolygonIntersectBoundingBox(iso.polygon, city.bbox))
                    );
                    const getBboxCenter = (bbox: BoundingBox) => ({ lat: (bbox.minLat + bbox.maxLat) / 2, lng: (bbox.minLng + bbox.maxLng) / 2 });
                    places.sort((a, b) => 
                        calculateDistance(destCoords!, getBboxCenter(a.bbox)) - calculateDistance(destCoords!, getBboxCenter(b.bbox))
                    );
                    const placeNames = Array.from(new Set(places.map(city => city.name)));
                    yield { type: 'metadata', metadata: { searchLocations: placeNames } };
                }
            } else {
                yield { type: 'progress', message: 'Warning: Could not get reachable area. Search may be slow.' };
            }
        }
        
        if (places.length === 0 && destCoords) {
            yield { type: 'progress', message: 'Using radius search as fallback...' };
            const nearbyCities = await findNearbyCities(destCoords);
            places = nearbyCities.map(name => ({ name, bbox: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 } }));
            const placeNames = places.map(p => p.name);
            yield { type: 'metadata', metadata: { searchLocations: placeNames } };
        }
    }
    
    if (places.length === 0) {
        const fallbackCityName = getCityFromSearch(filters.destination) || "Zürich";
        places = [{ name: fallbackCityName, bbox: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 } }];
        const placeNames = places.map(p => p.name);
        yield { type: 'metadata', metadata: { searchLocations: placeNames } };
    }
    
    return { destinationCoords: destCoords, isochrones, overallBoundingBox, places };
}
