import { Property } from '../../../types';
import { geocodeAddress } from '../api/geoApi';
import { getRouteTime } from '../api/openRouteServiceApi';
import { getPublicTransportTime } from '../api/openDataTransportApi';

// This function is now a utility for providers that don't get coordinates from their API.
export async function enrichWithGeocoding(properties: Property[]): Promise<Property[]> {
    const geocodedProperties = await Promise.all(properties.map(async p => {
        if (p.lat !== 0 && p.lng !== 0) return p;
        const coord = await geocodeAddress(p.address);
        if (!coord) return null;
        return { ...p, lat: coord.lat, lng: coord.lng };
    }));
    return geocodedProperties.filter((p): p is Property => p !== null);
}

/**
 * Enriches a single property with any missing travel time data.
 * Used for lazy-loading travel times on demand (e.g., on hover).
 * @param property - The property to enrich.
 * @param destCoords - The destination coordinates.
 * @param queryPublicTransport - Whether to actually query the public transport API.
 * @returns A promise that resolves to the fully enriched property.
 */
export const lazyEnrichProperty = async (
    property: Property,
    destCoords: { lat: number; lng: number },
    queryPublicTransport: boolean
): Promise<Property> => {
    const from = { lat: property.lat, lng: property.lng };

    const [publicTime, bikeTime, carTime, walkTime] = await Promise.all([
        property.travelTimePublic !== undefined ? Promise.resolve(property.travelTimePublic) : (queryPublicTransport ? getPublicTransportTime(from, destCoords) : Promise.resolve(null)),
        property.travelTimeBike !== undefined ? Promise.resolve(property.travelTimeBike) : getRouteTime(from, destCoords, 'bike'),
        property.travelTimeCar !== undefined ? Promise.resolve(property.travelTimeCar) : getRouteTime(from, destCoords, 'car'),
        property.travelTimeWalk !== undefined ? Promise.resolve(property.travelTimeWalk) : getRouteTime(from, destCoords, 'walk'),
    ]);

    return {
        ...property,
        travelTimePublic: publicTime,
        travelTimeBike: bikeTime,
        travelTimeCar: carTime,
        travelTimeWalk: walkTime,
    };
};
