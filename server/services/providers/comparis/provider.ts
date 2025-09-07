import { PropertyProvider } from '../providerTypes';
import { fetchComparisApi, mapComparisToProperty } from './api';
import { Property, FilterBucket } from '../../../../types';
import { enrichWithGeocoding } from '../../search/propertyEnricher';
import { matchesAdvancedFilters } from '../../../../utils/filterUtils';

export const comparisProvider: PropertyProvider = {
    name: 'Comparis',
    fetchProperties: async function*(context, requestManager): AsyncGenerator<Property[]> {
        const { filters, places, createdSince } = context;
        const allFetchedIds = new Set<number>();

        const bucketsToFetch: FilterBucket[] = filters.buckets.length > 0 ? filters.buckets : [
            { id: 'default', type: 'property', price: { min: '', max: '' }, rooms: { min: '', max: '' }, size: { min: '', max: '' }, roommates: {min: '', max: ''} }
        ];

        for (const city of places) {
            for (const bucket of bucketsToFetch) {
                if (requestManager.count >= requestManager.limit) {
                    break;
                }
                for await (const itemBatch of fetchComparisApi(city.name, bucket, requestManager)) {
                    const uniqueInBatch = itemBatch.filter(item => !allFetchedIds.has(item.AdId));
                    uniqueInBatch.forEach(item => allFetchedIds.add(item.AdId));

                    if (uniqueInBatch.length > 0) {
                        const mappedProperties = uniqueInBatch.map(mapComparisToProperty).filter((p): p is Property => p !== null);
                        
                        const geocodedProperties = await enrichWithGeocoding(mappedProperties);

                        // Comparis fetches per bucket, so we only need to apply advanced filters here.
                        let finalProperties = geocodedProperties.filter(p => matchesAdvancedFilters(p, filters));

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
            if (requestManager.count >= requestManager.limit) {
                console.warn(`[DEBUG MODE] Comparis request limit (${requestManager.limit}) reached. Skipping remaining cities.`);
                break;
            }
        }
    }
};