import { useState, useCallback } from 'react';
import { Property, FilterCriteria, SearchMetadata, DebugConfig } from '../types';
import { trpc } from '../utils/trpc';

export const usePropertyData = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
    const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

    const searchMutation = trpc.search.search.useMutation();

    const searchProperties = useCallback(async (currentFilters: FilterCriteria, debugConfig: DebugConfig, excludedProperties: Property[]) => {
        setIsLoading(true);
        setProperties([]);
        setSearchMetadata(null);
        setEnrichingIds(new Set());
        setLoadingMessage('Initializing search...');
        
        try {
            const result = await searchMutation.mutateAsync({ currentFilters, debugConfig, excludedProperties });
            setProperties(result.properties);
            setSearchMetadata({ ...result.metadata, filteredResults: result.metadata?.filteredResults ?? 0 } as SearchMetadata);
        } catch (error) {
            console.error("An error occurred during property search:", error);
            setLoadingMessage("An error occurred during the search.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('Search complete.');
        }
        // MUST pass the mutateAsync not the searchMutation to avoid infinite render loops
    }, [searchMutation.mutateAsync]);
    
    

    return {
        properties,
        isLoading,
        loadingMessage,
        searchMetadata,
        searchProperties,
        enrichingIds,
        enrichPropertyOnDemand: () => {},
    };
};