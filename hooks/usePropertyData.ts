


import { useState, useCallback, useEffect } from 'react';
import { streamProperties } from '../services/search/searchOrchestrator';
import { lazyEnrichProperty } from '../services/search/propertyEnricher';
import { Property, FilterCriteria, SearchMetadata, DebugConfig, StoredExcludedProperty } from '../types';

export const usePropertyData = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
    const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

    const searchProperties = useCallback(async (currentFilters: FilterCriteria, debugConfig: DebugConfig, excludedProperties: StoredExcludedProperty[]) => {
        setIsLoading(true);
        // CRITICAL FIX: Ensure all state is reset before starting a new search.
        // This prevents stale data from previous searches, fixing the "provider disable" bug.
        setProperties([]);
        setSearchMetadata(null);
        setEnrichingIds(new Set());
        setLoadingMessage('Initializing search...');
        
        try {
            for await (const event of streamProperties(currentFilters, debugConfig, excludedProperties)) {
                switch (event.type) {
                    case 'progress':
                        setLoadingMessage(event.message);
                        break;
                    case 'properties':
                        // This logic handles adding new properties and replacing existing ones
                        // if a merged version or an enriched version arrives.
                        setProperties(prev => {
                            const propMap = new Map(prev.map(p => [p.id, p]));
                            
                            for (const newProp of event.properties) {
                                const componentIds = newProp.id.split('+');
                                if (componentIds.length > 1) {
                                    // This is a merged property. Remove its original components.
                                    componentIds.forEach(id => propMap.delete(id));
                                }
                                // Add or replace the property in the map. This handles new, merged, and enriched properties.
                                propMap.set(newProp.id, newProp);
                            }
                            return Array.from(propMap.values());
                        });
                        break;
                    case 'metadata':
                        setSearchMetadata(prev => ({ 
                            ...(prev || { filteredResults: 0, destinationCoords: null, searchLocations: [] }),
                            ...event.metadata 
                        }));
                        break;
                }
            }
        } catch (error) {
            console.error("An error occurred during property search stream:", error);
            setLoadingMessage("An error occurred during the search.");
        } finally {
            setIsLoading(false);
            // Ensure a final "Search complete" message is set if the stream ends without one.
            setLoadingMessage(prev => prev.includes('complete') ? prev : 'Search complete.');
        }
    }, []);
    
    // Effect to update filtered results count when properties change
    useEffect(() => {
        setSearchMetadata(prev => prev ? { ...prev, filteredResults: properties.length } : null);
    }, [properties]);
    
    const enrichPropertyOnDemand = useCallback(async (propertyId: string, debugConfig: DebugConfig) => {
        if (!searchMetadata?.destinationCoords || enrichingIds.has(propertyId)) return;

        const propertyToEnrich = properties.find(p => p.id === propertyId);
        if (!propertyToEnrich) return;
        
        const needsEnrichment = propertyToEnrich.travelTimePublic === undefined ||
                                propertyToEnrich.travelTimeBike === undefined ||
                                propertyToEnrich.travelTimeCar === undefined ||
                                propertyToEnrich.travelTimeWalk === undefined;

        if (!needsEnrichment) return;
        
        setEnrichingIds(prev => new Set(prev).add(propertyId));
        
        const shouldQueryPublicTransport = !debugConfig.enabled || debugConfig.queryPublicTransport;
        const enrichedProperty = await lazyEnrichProperty(propertyToEnrich, searchMetadata.destinationCoords, shouldQueryPublicTransport);

        setProperties(prevProperties => 
            prevProperties.map(p => p.id === propertyId ? enrichedProperty : p)
        );
        
        setEnrichingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(propertyId);
            return newSet;
        });
    }, [properties, searchMetadata?.destinationCoords, enrichingIds]);

    return {
        properties,
        isLoading,
        loadingMessage,
        searchMetadata,
        searchProperties,
        enrichPropertyOnDemand,
        enrichingIds,
    };
};