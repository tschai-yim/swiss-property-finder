import { useState, useCallback } from 'react';
import { Property, FilterCriteria, SearchMetadata, SearchEvent } from '../types';
import { trpc } from '../utils/trpc';
import { PropertyWithoutCommuteTimes } from '@/server/services/providers/providerTypes';

export const usePropertyData = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
    const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

    const [subscriptionInput, setSubscriptionInput] = useState<{
        currentFilters: FilterCriteria;
        excludedProperties: PropertyWithoutCommuteTimes[];
    } | null>(null);

    const enrichMutation = trpc.property.enrich.useMutation();

    trpc.search.search.useSubscription(subscriptionInput!, {
        enabled: !!subscriptionInput,
        onData(event: SearchEvent) {
            switch (event.type) {
                case "progress":
                    setLoadingMessage(event.message);
                    break;
                case "properties":
                    setProperties((prev) => {
                        const propMap = new Map(prev.map((p) => [p.id, p]));

                        for (const newProp of event.properties) {
                            const componentIds = newProp.id.split("+");
                            if (componentIds.length > 1) {
                                componentIds.forEach((id) => propMap.delete(id));
                            }
                            propMap.set(newProp.id, newProp);
                        }
                        return Array.from(propMap.values());
                    });
                    break;
                case "metadata":
                    setSearchMetadata((prev) => ({
                        ...(prev || {
                            filteredResults: 0,
                            destinationCoords: null,
                            searchLocations: [],
                        }),
                        ...event.metadata,
                    }));
                    break;
            }
        },
        onError(err) {
            console.error("An error occurred during property search stream:", err);
            setLoadingMessage("An error occurred during the search.");
            setIsLoading(false);
            setSubscriptionInput(null);
        },
        onComplete() {
            setIsLoading(false);
            setLoadingMessage((prev) =>
                prev.includes("complete") ? prev : "Search complete."
            );
            setSubscriptionInput(null);
        },
    });

    const searchProperties = useCallback((currentFilters: FilterCriteria, excludedProperties: PropertyWithoutCommuteTimes[]) => {
        setIsLoading(true);
        setProperties([]);
        setSearchMetadata(null);
        setEnrichingIds(new Set());
        setLoadingMessage('Initializing search...');
        setSubscriptionInput({ currentFilters, excludedProperties });
    }, []);
    
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