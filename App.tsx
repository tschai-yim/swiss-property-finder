



import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import FilterBar from './components/FilterBar';
import ResultsView from './components/ResultsView';
import MapView from './components/MapView';
import { useFilters } from './hooks/useFilters';
import { usePropertyData } from './hooks/usePropertyData';
import { useInteractionState } from './hooks/useInteractionState';
import { FilterCriteria, FilterBucket, DebugConfig, Property, StoredExcludedProperty } from './types';
import DebugPopup from './components/DebugPopup';
import EmailPrototypePopup from './components/email/EmailPrototypePopup';
import { cacheService } from './services/cache';
import { exclusionService } from './services/exclusionService';
import { matchesGeneralFilters, matchesTravelFilters } from './utils/filterUtils';
import { isPointInPolygon } from './services/geoUtils';
import { lazyEnrichProperty } from './services/search/propertyEnricher';


const DEBUG_CONFIG_STORAGE_KEY = 'swissPropertyFinderDebugConfig';
const ALL_PROVIDERS = ['Homegate', 'Comparis', 'Weegee', 'Tutti.ch', 'MeinWGZimmer', 'WGZimmer.ch'];

const App: React.FC = () => {
    const {
        filters,
        editingBucketId,
        handleFilterChange,
        handleAddBucket,
        handleRemoveBucket,
        handleUpdateBucket,
        handleSetEditingBucketId,
        handleToggleBucketType,
    } = useFilters();
    
    const [appliedFilters, setAppliedFilters] = useState<FilterCriteria>(filters);

    const [debugConfig, setDebugConfig] = useState<DebugConfig>(() => {
        try {
            const stored = localStorage.getItem(DEBUG_CONFIG_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {
                enabled: true,
                requestLimit: 2,
                enabledProviders: ['WGZimmer.ch', 'Weegee'],
                queryPublicTransport: false,
            };
        } catch {
            return {
                enabled: true,
                requestLimit: 2,
                enabledProviders: ['WGZimmer.ch', 'Weegee'],
                queryPublicTransport: false,
            };
        }
    });
    
    const [isDebugPopupOpen, setIsDebugPopupOpen] = useState(false);
    const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);
    
    // State for excluded properties, managed by the exclusionService
    const [excludedProperties, setExcludedProperties] = useState<StoredExcludedProperty[]>(exclusionService.getExclusions());
    useEffect(() => {
        const unsubscribe = exclusionService.subscribe(setExcludedProperties);
        return () => unsubscribe();
    }, []);

    const excludedPropertiesRef = useRef(excludedProperties);
    useEffect(() => {
        excludedPropertiesRef.current = excludedProperties;
    }, [excludedProperties]);

    const {
        properties,
        isLoading,
        loadingMessage,
        searchMetadata,
        searchProperties,
        enrichPropertyOnDemand,
        enrichingIds,
    } = usePropertyData();

    const [displayedProperties, setDisplayedProperties] = useState<Property[]>([]);
    const [tempMapPin, setTempMapPin] = useState<{ lat: number; lng: number } | null>(null);

    // Sync displayed properties with fetched properties
    useEffect(() => {
        setDisplayedProperties(properties);
    }, [properties]);

    // Run cache cleanup on initial app load to remove expired items.
    useEffect(() => {
        cacheService.cleanup();
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(DEBUG_CONFIG_STORAGE_KEY, JSON.stringify(debugConfig));
        } catch (e) {
            console.error("Failed to save debug config to localStorage", e);
        }
    }, [debugConfig]);

    const handleUpdateDebugConfig = useCallback((newConfig: Partial<DebugConfig>) => {
        setDebugConfig(prev => ({ ...prev, ...newConfig }));
    }, []);

    useEffect(() => {
        searchProperties(appliedFilters, debugConfig, excludedPropertiesRef.current);
    }, [searchProperties, appliedFilters, debugConfig]);

    const getCanonicalFiltersString = (f: FilterCriteria): string => {
        const fCopy = JSON.parse(JSON.stringify(f));
        if (fCopy.travelModes) {
           fCopy.travelModes.sort();
        }
        if (fCopy.buckets) {
            fCopy.buckets.sort((a: FilterBucket, b: FilterBucket) => a.id.localeCompare(b.id));
        }
        return JSON.stringify(fCopy);
    };

    const areFiltersDirty = useMemo(() => {
        return getCanonicalFiltersString(filters) !== getCanonicalFiltersString(appliedFilters);
    }, [filters, appliedFilters]);
    
    const handleSearch = useCallback(() => {
        if (areFiltersDirty) {
            setAppliedFilters(filters);
        }
    }, [areFiltersDirty, filters]);

    const {
        sortBy,
        selectedPropertyId,
        hoveredPropertyId,
        hoveredTravelMode,
        sortedProperties,
        handleSortChange,
        handleSelectProperty,
        handleHoverProperty,
        handleHoverTravelMode,
    } = useInteractionState(displayedProperties, appliedFilters.travelModes, searchMetadata?.destinationCoords || null);

    const handleSelectPropertyWithScroll = useCallback((id: string) => {
        const newId = handleSelectProperty(id);
        if (newId) {
            setTimeout(() => {
                const element = document.getElementById(`property-${newId}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [handleSelectProperty]);

    const handleExcludeProperty = useCallback((property: Property) => {
        exclusionService.addExclusion(property);
        setDisplayedProperties(prev => prev.filter(p => p.id !== property.id));
        if (selectedPropertyId === property.id) {
            handleSelectProperty(property.id);
        }
    }, [selectedPropertyId, handleSelectProperty]);

    const handleRestoreProperty = useCallback(async (propertyToRestore: Property) => {
        exclusionService.removeExclusion(propertyToRestore.id);
        
        const destinationCoords = searchMetadata?.destinationCoords;
        const isochrones = searchMetadata?.isochrones ?? [];
        const shouldQueryPublicTransport = !debugConfig.enabled || debugConfig.queryPublicTransport;

        // 1. Check if it passes general filters (buckets, keywords, etc.)
        if (!matchesGeneralFilters(propertyToRestore, appliedFilters)) {
            return;
        }

        // 2. If there's a destination, check if it's within the reachable area
        if (destinationCoords && isochrones.length > 0) {
            const isInReachableArea = isochrones.some(iso => isPointInPolygon({ lat: propertyToRestore.lat, lng: propertyToRestore.lng }, iso.polygon));
            if (!isInReachableArea) {
                return;
            }
        }
        
        // 3. If there are travel filters, enrich the property with travel times and check them
        if (destinationCoords && appliedFilters.travelModes.length > 0) {
            const enrichedProperty = await lazyEnrichProperty(propertyToRestore, destinationCoords, shouldQueryPublicTransport);
            if (matchesTravelFilters(enrichedProperty, appliedFilters)) {
                setDisplayedProperties(prev => [...prev, enrichedProperty]);
            }
        } else {
            // No travel filters, just add it back
            setDisplayedProperties(prev => [...prev, propertyToRestore]);
        }

    }, [searchMetadata, appliedFilters, debugConfig]);


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
            <FilterBar 
                filters={filters} 
                onFilterChange={handleFilterChange}
                onAddBucket={handleAddBucket}
                onRemoveBucket={handleRemoveBucket}
                onUpdateBucket={handleUpdateBucket}
                onToggleBucketType={handleToggleBucketType}
                onSearch={handleSearch}
                editingBucketId={editingBucketId}
                onSetEditingBucketId={handleSetEditingBucketId}
                onHoverTravelMode={handleHoverTravelMode}
                areFiltersDirty={areFiltersDirty}
                isochrones={searchMetadata?.isochrones}
                debugConfig={debugConfig}
                onToggleDebugPopup={() => setIsDebugPopupOpen(p => !p)}
                onOpenEmailPopup={() => setIsEmailPopupOpen(true)}
                excludedProperties={excludedProperties}
                onRestoreProperty={handleRestoreProperty}
                destinationCoords={searchMetadata?.destinationCoords || null}
                onFocusPropertyOnMap={setTempMapPin}
            />
            {isEmailPopupOpen && (
                <EmailPrototypePopup
                    onClose={() => setIsEmailPopupOpen(false)}
                    filters={appliedFilters}
                    debugConfig={debugConfig}
                    excludedProperties={excludedPropertiesRef.current}
                />
            )}
            {isDebugPopupOpen && (
                <DebugPopup
                    config={debugConfig}
                    onConfigChange={handleUpdateDebugConfig}
                    onClose={() => setIsDebugPopupOpen(false)}
                    allProviders={ALL_PROVIDERS}
                />
            )}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                <div className="overflow-y-auto">
                    <ResultsView
                        properties={sortedProperties}
                        filters={appliedFilters}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        selectedPropertyId={selectedPropertyId}
                        hoveredPropertyId={hoveredPropertyId}
                        onSelectProperty={handleSelectPropertyWithScroll}
                        onHoverProperty={handleHoverProperty}
                        searchMetadata={searchMetadata}
                        sortBy={sortBy}
                        onSortChange={handleSortChange}
                        onEnrichProperty={(id) => enrichPropertyOnDemand(id, debugConfig)}
                        enrichingIds={enrichingIds}
                        onExcludeProperty={handleExcludeProperty}
                    />
                </div>
                <div className="hidden lg:block relative h-full">
                     <MapView
                        properties={sortedProperties}
                        selectedPropertyId={selectedPropertyId}
                        hoveredPropertyId={hoveredPropertyId}
                        destinationCoords={searchMetadata?.destinationCoords || null}
                        tempPinCoords={tempMapPin}
                        isochrones={searchMetadata?.isochrones || null}
                        hoveredTravelMode={hoveredTravelMode}
                        onSelectProperty={handleSelectPropertyWithScroll}
                        onHoverProperty={handleHoverProperty}
                        isLoading={isLoading}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;