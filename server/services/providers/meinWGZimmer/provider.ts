import { Property, FilterBucket } from '../../../../types';
import { PropertyProvider, PropertyWithoutCommuteTimes, RequestManager, SearchContext } from '../providerTypes';
import { calculateDistance } from '../../../../utils/geoUtils';
import { matchesGeneralFilters } from '../../../../utils/filterUtils';
import { fetchMeinWGZimmerApi, mapMeinWGZimmerToProperty } from './api';

export const meinWGZimmerProvider: PropertyProvider = {
    name: 'MeinWGZimmer',
    fetchProperties: async function* (context: SearchContext, requestManager: RequestManager): AsyncGenerator<PropertyWithoutCommuteTimes[]> {
        const { filters, overallBoundingBox, createdSince } = context;

        const bucketsToFetch: FilterBucket[] = filters.buckets.length > 0 
            ? filters.buckets.filter((b: FilterBucket) => b.type === 'sharedFlat')
            : [{ id: 'default', type: 'sharedFlat', price: { min: '', max: '' }, rooms: { min: '', max: '' }, size: { min: '', max: '' }, roommates: {min: '', max: ''} }];

        if (bucketsToFetch.length === 0) {
            return;
        }
        
        if (!overallBoundingBox) {
            console.warn("MeinWGZimmer provider requires a search area (isochrone) to function.");
            return;
        }

        const centerLat = (overallBoundingBox.minLat + overallBoundingBox.maxLat) / 2;
        const centerLng = (overallBoundingBox.minLng + overallBoundingBox.maxLng) / 2;
        const searchCoords = { lat: centerLat, lng: centerLng };
        const radiusKm = calculateDistance(searchCoords, { lat: overallBoundingBox.maxLat, lng: overallBoundingBox.maxLng });

        const allFetchedIds = new Set<string>();

        for (const bucket of bucketsToFetch) {
            if (requestManager.count >= requestManager.limit) break;
            const bucketItems = await fetchMeinWGZimmerApi(bucket, searchCoords, radiusKm, requestManager, createdSince);
            
            const uniqueInBatch = bucketItems.filter(item => !allFetchedIds.has(item.objectId));
            uniqueInBatch.forEach(item => allFetchedIds.add(item.objectId));
            
            if (uniqueInBatch.length > 0) {
                 const mappedProperties = uniqueInBatch.map(mapMeinWGZimmerToProperty);
                 // The API does some filtering, but we apply all general filters for consistency.
                 const finalProperties = mappedProperties.filter(p => matchesGeneralFilters(p, filters));
                 if (finalProperties.length > 0) {
                     yield finalProperties;
                 }
            }
        }
    }
};