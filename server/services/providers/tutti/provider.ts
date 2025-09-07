import { Property, FilterBucket } from '../../../../types';
import { PropertyProvider, RequestManager, SearchContext } from '../providerTypes';
import { matchesAdvancedFilters } from '../../../../utils/filterUtils';
import { fetchTuttiApi, mapTuttiToProperty } from './api';

export const tuttiProvider: PropertyProvider = {
    name: 'Tutti.ch',
    fetchProperties: async function*(context: SearchContext, requestManager: RequestManager): AsyncGenerator<Property[]> {
        const { filters, places, createdSince } = context;
        const allFetchedIds = new Set<string>();
        
        const bucketsToFetch: FilterBucket[] = filters.buckets.length > 0 ? filters.buckets : [
            { id: 'default', type: 'property', price: { min: '', max: '' }, rooms: { min: '', max: '' }, size: { min: '', max: '' }, roommates: {min: '', max: ''} }
        ];

        for (const city of places) {
            for (const bucket of bucketsToFetch) {
                if (requestManager.count >= requestManager.limit) {
                    console.warn(`[DEBUG MODE] Tutti.ch request limit reached. Skipping remaining cities/buckets.`);
                    break;
                }
                for await (const itemBatch of fetchTuttiApi(city.name, bucket, requestManager)) {
                    const uniqueInBatch = itemBatch.filter(item => !allFetchedIds.has(item.listingID));
                    uniqueInBatch.forEach(item => allFetchedIds.add(item.listingID));
                    
                    if (uniqueInBatch.length > 0) {
                        const mappedProperties = uniqueInBatch
                            .map(mapTuttiToProperty)
                            .filter((p): p is Property => !!p);

                        // Tutti API handles bucket filtering. We apply other general filters client-side.
                        let finalProperties = mappedProperties.filter(p => matchesAdvancedFilters(p, filters));

                        if (createdSince) {
                            const recentProperties = finalProperties.filter(p => p.createdAt && new Date(p.createdAt) >= createdSince);
                            // If the entire batch is older than the cutoff, we can stop for this city/bucket.
                            if (finalProperties.length > 0 && recentProperties.length === 0) {
                                finalProperties = []; // Clear the batch
                                break; // Stop fetching more pages for this city/bucket
                            }
                            finalProperties = recentProperties;
                        }

                        if (finalProperties.length > 0) {
                            yield finalProperties;
                        }
                    }
                }
            }
            if (requestManager.count >= requestManager.limit) break;
        }
    }
};