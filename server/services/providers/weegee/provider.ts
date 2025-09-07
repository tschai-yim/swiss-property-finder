import { Property } from '../../../../types';
import { PropertyProvider, SearchContext } from '../providerTypes';
import { matchesGeneralFilters } from '../../../../utils/filterUtils';
import { mapWeegeeToProperty, fetchWeegeeStubs, fetchWeegeeDetails } from './api';
import { EnrichedWeegeeListing } from './types';

export const weegeeProvider: PropertyProvider = {
    name: 'Weegee',
    fetchProperties: async function* (context, requestManager): AsyncGenerator<Property[]> {
        const { filters, places, createdSince } = context;

        // Optimization: If all filter buckets are for properties, skip this provider.
        if (filters.buckets.length > 0 && !filters.buckets.some(b => b.type === 'sharedFlat')) {
            return;
        }
        
        const listingStubsPromises = places.map(city => fetchWeegeeStubs(city.name, requestManager));
        const allListingsStubs = (await Promise.all(listingStubsPromises)).flat();
        
        const uniqueListings = Array.from(new Map(allListingsStubs.map(l => [l.public_id, l])).values());
        
        const detailedListingsPromises = uniqueListings.map(fetchWeegeeDetails);
        
        const detailedListings: EnrichedWeegeeListing[] = (await Promise.all(detailedListingsPromises)).filter((item): item is EnrichedWeegeeListing => item !== null);
        
        // Map to standard Property format, then apply client-side bucket filters.
        let finalProperties = detailedListings
            .map(mapWeegeeToProperty)
            .filter((p): p is Property => {
                if (!p) return false;
                // Weegee has no server-side filtering, so apply all general filters client-side.
                return matchesGeneralFilters(p, filters);
            });
        
        if (createdSince) {
            finalProperties = finalProperties.filter(p => p.createdAt && new Date(p.createdAt) >= createdSince);
        }

        if (finalProperties.length > 0) {
            yield finalProperties;
        }
    }
};