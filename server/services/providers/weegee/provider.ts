import { Property } from '../../../../types';
import { PropertyProvider, PropertyWithoutCommuteTimes, SearchContext } from '../providerTypes';
import { matchesGeneralFilters } from '../../../../utils/filterUtils';
import { mapWeegeeToProperty, fetchWeegeeStubs, fetchWeegeeDetails } from './api';
import { EnrichedWeegeeListing } from './types';

const BATCH_SIZE = 5;

export const weegeeProvider: PropertyProvider = {
    name: 'Weegee',
    fetchProperties: async function* (context, requestManager): AsyncGenerator<PropertyWithoutCommuteTimes[]> {
        const { filters, places, createdSince } = context;

        // Optimization: If all filter buckets are for properties, skip this provider.
        if (filters.buckets.length > 0 && !filters.buckets.some(b => b.type === 'sharedFlat')) {
            return;
        }
        
        // Keep track of already processed listing IDs to avoid duplicates
        const processedIds = new Set<string>();
        
        // Process each place sequentially and yield results as they come
        for (const place of places) {
            // Fetch stubs for this place
            const listingStubs = await fetchWeegeeStubs(place.name, requestManager);
            
            if (listingStubs.length === 0) continue;
            
            // Filter out already processed listings
            const newListingStubs = listingStubs.filter(stub => !processedIds.has(stub.public_id));
            
            // Skip if no new listings
            if (newListingStubs.length === 0) continue;
            
            // Mark these as processed
            newListingStubs.forEach(stub => processedIds.add(stub.public_id));
            
            // Fetch details for the new stubs
            // Process listings in batches and yield each batch
            for (let i = 0; i < newListingStubs.length; i += BATCH_SIZE) {
                const batch = newListingStubs.slice(i, i + BATCH_SIZE);
                
                // Fetch details for this batch
                const batchPromises = batch.map(stub => fetchWeegeeDetails(stub));
                const batchResults = await Promise.all(batchPromises);
                
                // Filter valid results
                const detailedListings: EnrichedWeegeeListing[] = batchResults
                    .filter((item): item is EnrichedWeegeeListing => item !== null);
                
                // Map to standard Property format, then apply client-side bucket filters
                let batchProperties = detailedListings
                    .map(mapWeegeeToProperty)
                    .filter((p): p is PropertyWithoutCommuteTimes => {
                        if (!p) return false;
                        // Weegee has no server-side filtering, so apply all general filters client-side.
                        return matchesGeneralFilters(p, filters);
                    });
                
                if (createdSince) {
                    batchProperties = batchProperties.filter(p => p.createdAt && new Date(p.createdAt) >= createdSince);
                }

                if (batchProperties.length > 0) {
                    yield batchProperties;
                }
            }
        }
    }
};