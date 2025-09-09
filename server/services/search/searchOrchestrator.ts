import { Property, FilterCriteria, SearchEvent, GeneralFilters, DebugConfig, TravelMode } from '../../../types';
import { isPointInPolygon } from '../../../utils/geoUtils';
import { enrichItemsWithTravelTimes } from '../api/cachedRoutingApi';
import { PropertySet } from './PropertySet';
import { determineSearchArea } from './searchAreaService';
import { getActiveProviders, createRequestManagers, mergeProviderStreams } from './providerService';
import { SearchContext } from '../providers/providerTypes';
import { matchesTravelFilters } from '../../../utils/filterUtils';

/**
 * The main orchestrator for property searching. It streams search events (progress, metadata, properties)
 * back to the UI.
 * 
 * @param filters The user's complete search criteria.
 * @param debugConfig The application's debug configuration for throttling/filtering providers.
 * @returns An async generator that yields `SearchEvent` objects.
 */
export async function* streamProperties(
    filters: FilterCriteria,
    debugConfig: DebugConfig,
    excludedProperties: Property[],
    createdSince?: Date,
): AsyncGenerator<SearchEvent> {
    
    // Step 1: Determine the geographical search area based on destination and travel times.
    const searchAreaResult = yield* determineSearchArea(filters);
    if (!searchAreaResult) {
         yield { type: 'progress', message: 'Error: Failed to determine search area.' };
         return;
    }
    const { destinationCoords: destCoords, isochrones, overallBoundingBox, places } = searchAreaResult;

    // Step 2: Set up providers and the search context for them.
    const activeProviders = getActiveProviders(debugConfig);
    if (activeProviders.length === 0) {
        yield { type: 'progress', message: 'No property providers are enabled. Search complete.' };
        return;
    }
    const requestManagers = createRequestManagers(activeProviders, debugConfig);
    const { buckets, exclusionKeywords, genderPreference, rentalDuration } = filters;
    const generalFilters: GeneralFilters = { buckets, exclusionKeywords, genderPreference, rentalDuration };
    const searchContext: SearchContext = { filters: generalFilters, places, overallBoundingBox, createdSince };
    const shouldQueryPublicTransport = !debugConfig.enabled || debugConfig.queryPublicTransport;

    // Step 3: Fetch, process, and stream properties from all active providers in parallel.
    const propertySet = new PropertySet(); // Handles de-duplication and merging.
    let processedCount = 0;
    
    // Create a PropertySet for efficient spatial duplicate checking of excluded properties.
    const exclusionSet = new PropertySet();
    excludedProperties.forEach(p => exclusionSet.addForLookupOnly(p as Property));


    const providerGenerators = activeProviders.map(provider =>
        provider.fetchProperties(searchContext, requestManagers[provider.name])
    );
    const mergedProviderStream = mergeProviderStreams(providerGenerators);
    yield { type: 'progress', message: `Querying ${places.length} location(s) with ${activeProviders.length} provider(s)...` };

    for await (const propertyBatch of mergedProviderStream) {
        const BATCH_SIZE = 10;
        for (let i = 0; i < propertyBatch.length; i += BATCH_SIZE) {
            const chunk = propertyBatch.slice(i, i + BATCH_SIZE);
            // Step 3a: Filter out properties that are duplicates of anything in the exclusion list.
            const nonExcludedBatch = chunk.filter(prop => !exclusionSet.findDuplicate(prop));

            // Step 3b: De-duplicate and merge the remaining incoming properties.
            const mergedBatch = nonExcludedBatch.map(prop => propertySet.add(prop).finalProperty);
            
            // Step 3c: Filter properties to ensure they are inside the calculated reachable area (isochrone).
            let isochroneFilteredBatch = mergedBatch;
            if (destCoords && isochrones.length > 0) {
                isochroneFilteredBatch = mergedBatch.filter(p => 
                    isochrones.some(iso => isPointInPolygon({ lat: p.lat, lng: p.lng }, iso.polygon))
                );
            }
            
            let finalBatch = isochroneFilteredBatch;
            
            // Step 3d: Enrich with travel times and filter by the user's max travel time constraints.
            const modesToEnrich = filters.travelModes;
            if (finalBatch.length > 0 && destCoords && modesToEnrich.length > 0) {
                processedCount += finalBatch.length;
                yield { type: 'progress', message: `Enriching ${processedCount}+ properties...` };
                const enrichedBatch = await enrichItemsWithTravelTimes(finalBatch, destCoords, modesToEnrich, shouldQueryPublicTransport);
                finalBatch = enrichedBatch.filter(p => matchesTravelFilters(p, filters));
            }
            
            // Step 3e: Yield the final, processed batch to the UI.
            if (finalBatch.length > 0) {
                yield { type: 'properties', properties: finalBatch };
            }
        }
    }

    yield { type: 'progress', message: 'Search complete.' };
}
