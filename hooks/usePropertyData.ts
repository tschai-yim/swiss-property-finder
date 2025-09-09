import { useState, useCallback } from 'react';
import { Property, FilterCriteria, SearchMetadata } from '../types';
import { trpc } from '../utils/trpc';
import { PropertyWithoutCommuteTimes } from '@/server/services/providers/providerTypes';

export const usePropertyData = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
    const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

    const searchMutation = trpc.search.search.useMutation();
    const enrichMutation = trpc.property.enrich.useMutation();

    const searchProperties = useCallback(async (currentFilters: FilterCriteria, excludedProperties: PropertyWithoutCommuteTimes[]) => {
        setIsLoading(true);
        setProperties([]);
        setSearchMetadata(null);
        setEnrichingIds(new Set());
        setLoadingMessage('Initializing search...');
        
        try {
            const result = await searchMutation.mutateAsync({ currentFilters, excludedProperties });
            setProperties(result.properties);
            setSearchMetadata(result.metadata as SearchMetadata);
        } catch (error) {
            console.error("An error occurred during property search:", error);
            setLoadingMessage("An error occurred during the search.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('Search complete.');
        }
        // MUST pass the mutateAsync not the searchMutation to avoid infinite render loops
    }, [searchMutation.mutateAsync]);
    
    const enrichPropertyOnDemand = useCallback(async (propertyId: string) => {
        if (!searchMetadata?.destinationCoords) return;

        const property = properties.find(p => p.id === propertyId);
        if (!property) return;

        setEnrichingIds(prev => new Set(prev).add(propertyId));

        try {
            const enrichedProperty = await enrichMutation.mutateAsync({
                property,
                destinationCoords: searchMetadata.destinationCoords,
            });
            setProperties(prev => prev.map(p => p.id === propertyId ? enrichedProperty : p));
        } catch (error) {
            console.error(`Failed to enrich property ${propertyId}:`, error);
        } finally {
            setEnrichingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(propertyId);
                return newSet;
            });
        }
    }, [properties, searchMetadata, enrichMutation.mutateAsync]);

    const addProperty = useCallback((newProperty: Property) => {
        setProperties(prev => [newProperty, ...prev]);
    }, []);

    const removeProperty = useCallback((propertyId: string) => {
        setProperties(prev => prev.filter(p => p.id !== propertyId));
    }, []);

    return {
        properties,
        isLoading,
        loadingMessage,
        searchMetadata,
        searchProperties,
        enrichingIds,
        enrichPropertyOnDemand,
        addProperty,
        removeProperty
    };
};