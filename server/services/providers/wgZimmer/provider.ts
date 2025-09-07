import { Property } from '../../../../types';
import { PropertyProvider, SearchContext } from '../providerTypes';
import { matchesGeneralFilters } from '../../../../utils/filterUtils';
import { isPointInBoundingBox } from '../../../../utils/geoUtils';
import { fetchAllWgZimmerListings, mapWgZimmerToProperty } from './api';

export const wgZimmerProvider: PropertyProvider = {
    name: 'WGZimmer.ch',
    fetchProperties: async function* (context: SearchContext, requestManager): AsyncGenerator<Property[]> {
        const { filters, overallBoundingBox, createdSince } = context;

        // Optimization: If all filter buckets are for properties, skip this provider.
        if (filters.buckets.length > 0 && !filters.buckets.some(b => b.type === 'sharedFlat')) {
            return;
        }

        if (!overallBoundingBox) {
            console.warn("WGZimmer.ch provider requires a search area (isochrone) to function.");
            return;
        }

        const allRooms = await fetchAllWgZimmerListings(requestManager);

        if (!allRooms || allRooms.length === 0) return;
        
        // As the API returns all listings, we must filter them client-side.
        const propertiesInArea = allRooms
            .map(mapWgZimmerToProperty)
            .filter((p): p is Property => {
                if (!p) return false;
                // 1. Filter by location using the isochrone bounding box.
                return isPointInBoundingBox({ lat: p.lat, lng: p.lng }, overallBoundingBox);
            });

        // 2. Apply all general filters since we fetched all listings.
        let finalProperties = propertiesInArea.filter(p => matchesGeneralFilters(p, filters));

        if (createdSince) {
            finalProperties = finalProperties.filter(p => p.createdAt && new Date(p.createdAt) >= createdSince);
        }

        if (finalProperties.length > 0) {
            yield finalProperties;
        }
    }
};