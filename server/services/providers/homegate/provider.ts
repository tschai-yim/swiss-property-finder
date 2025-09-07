import { Property, FilterBucket } from '../../../../types';
import { PropertyProvider, RequestManager, SearchContext } from '../providerTypes';
import { matchesAdvancedFilters } from '../../../../utils/filterUtils';
import { mapHomegateToProperty, formatCityForHomegate, fetchHomegateApi } from './api';

export const homegateProvider: PropertyProvider = {
    name: 'Homegate',
    fetchProperties: async function* (context: SearchContext, requestManager: RequestManager): AsyncGenerator<Property[]> {
        const { filters, places, createdSince } = context;
        if (places.length === 0) return;
        
        const geoTags = places.map(loc => formatCityForHomegate(loc.name));

        const bucketsToFetch: FilterBucket[] = filters.buckets.length > 0 
            ? filters.buckets.filter((b: FilterBucket) => b.type === 'property')
            : [{ id: 'default', type: 'property', price: { min: '', max: '' }, rooms: { min: '', max: '' }, size: { min: '', max: '' }, roommates: {min: '', max: ''} }];

        if (bucketsToFetch.length === 0) return;

        for (const bucket of bucketsToFetch) {
            if (requestManager.count >= requestManager.limit) {
                console.warn(`[DEBUG MODE] Homegate request limit (${requestManager.limit}) reached. Halting further requests for this provider.`);
                break;
            }

            const priceRange = { min: parseFloat(bucket.price.min) || null, max: parseFloat(bucket.price.max) || null };
            const roomsRange = { min: parseFloat(bucket.rooms.min) || null, max: parseFloat(bucket.rooms.max) || null };
            const sizeRange = { min: parseFloat(bucket.size.min) || null, max: parseFloat(bucket.size.max) || null };

            let from = 0;
            const BATCH_SIZE = 50;
            let hasMore = true;

            while (hasMore && requestManager.count < requestManager.limit) {
                const query = {
                    query: {
                        offerType: "RENT",
                        categories: ["APARTMENT", "MAISONETTE", "DUPLEX", "ATTIC_FLAT", "ROOF_FLAT", "STUDIO", "SINGLE_ROOM", "TERRACE_FLAT", "BACHELOR_FLAT", "LOFT", "HOUSE", "ROW_HOUSE", "BIFAMILIAR_HOUSE", "TERRACE_HOUSE", "VILLA", "FARM_HOUSE", "CAVE_HOUSE", "CASTLE", "GRANNY_FLAT", "CHALET", "RUSTICO", "SINGLE_HOUSE", "BUNGALOW", "ENGADINE_HOUSE"],
                        excludeCategories: ["FURNISHED_FLAT"],
                        livingSpace: { from: sizeRange.min || 0, to: sizeRange.max || 10000 },
                        numberOfRooms: { from: roomsRange.min || 1, to: roomsRange.max || 20 },
                        monthlyRent: { from: priceRange.min || 0, to: priceRange.max || 50000 },
                        isPriceDefined: true,
                        location: { geoTags },
                    },
                    sortBy: "dateCreated",
                    sortDirection: "desc",
                    from,
                    size: BATCH_SIZE,
                    trackTotalHits: true,
                    fieldset: "web-srp-list"
                };
                
                const result = await fetchHomegateApi(query, requestManager);

                if (!result || result.results.length === 0) {
                    hasMore = false;
                    continue;
                }

                let finalProperties = result.results
                    .map(mapHomegateToProperty)
                    .filter((p): p is Property => {
                        if (!p || p.price <= 0) return false;
                        // Homegate API handles bucket filtering. We apply other general filters client-side.
                        return matchesAdvancedFilters(p, filters);
                    });
                
                if (createdSince) {
                    const recentProperties = finalProperties.filter(p => p.createdAt && new Date(p.createdAt) >= createdSince);
                    // If the entire batch is older than the cutoff, we can stop paginating.
                    if (finalProperties.length > 0 && recentProperties.length === 0) {
                        hasMore = false;
                    }
                    finalProperties = recentProperties;
                }

                if (finalProperties.length > 0) {
                    yield finalProperties;
                }

                from += result.results.length;
                if (from >= result.total || !hasMore) {
                    hasMore = false;
                }
            }
        }
    }
};