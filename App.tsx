import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import FilterBar from "./components/FilterBar";
import ResultsView from "./components/ResultsView";
import { useFilters } from "./hooks/useFilters";
import { usePropertyData } from "./hooks/usePropertyData";
import { useInteractionState } from "./hooks/useInteractionState";
import { debugConfig } from "./utils/env";
import {
  FilterCriteria,
  FilterBucket,
  Property,
} from "./types";
import EmailPrototypePopup from "./components/email/EmailPrototypePopup";
import {
  matchesGeneralFilters,
  matchesTravelFilters,
} from "./utils/filterUtils";
import { isPointInPolygon } from "./utils/geoUtils";
import { trpc } from "./utils/trpc";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import('./components/MapView'), {
    ssr: false,
})



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

  const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);

  const { data: excludedProperties, refetch: refetchExcludedProperties } =
    trpc.exclusion.getExclusions.useQuery(undefined);

  const addExclusion = trpc.exclusion.addExclusion.useMutation();
  const removeExclusion = trpc.exclusion.removeExclusion.useMutation();

  

  const {
    properties,
    isLoading,
    loadingMessage,
    searchMetadata,
    searchProperties,
    enrichPropertyOnDemand,
    enrichingIds,
  } = usePropertyData();

  const [displayedProperties, setDisplayedProperties] = useState<Property[]>(
    []
  );
  const [tempMapPin, setTempMapPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Sync displayed properties with fetched properties
  useEffect(() => {
    setDisplayedProperties(properties);
  }, [properties]);

  const cleanupCache = trpc.cache.cleanup.useMutation();
  useEffect(() => {
    cleanupCache.mutate();
  }, []);

  

  const getCanonicalFiltersString = (f: FilterCriteria): string => {
    const fCopy = JSON.parse(JSON.stringify(f));
    if (fCopy.travelModes) {
      fCopy.travelModes.sort();
    }
    if (fCopy.buckets) {
      fCopy.buckets.sort((a: FilterBucket, b: FilterBucket) =>
        a.id.localeCompare(b.id)
      );
    }
    return JSON.stringify(fCopy);
  };

  const areFiltersDirty = useMemo(() => {
    return (
      getCanonicalFiltersString(filters) !==
      getCanonicalFiltersString(appliedFilters)
    );
  }, [filters, appliedFilters]);

  useEffect(() => {
    // Initial search on mount
    searchProperties(appliedFilters, excludedProperties || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(() => {
    if (areFiltersDirty) {
      setAppliedFilters(filters);
      searchProperties(filters, excludedProperties || []);
    }
  }, [areFiltersDirty, filters, appliedFilters, searchProperties, excludedProperties]);

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
  } = useInteractionState(
    displayedProperties,
    appliedFilters.travelModes,
    searchMetadata?.destinationCoords || null
  );

  const handleSelectPropertyWithScroll = useCallback(
    (id: string) => {
      const newId = handleSelectProperty(id);
      if (newId) {
        setTimeout(() => {
          const element = document.getElementById(`property-${newId}`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    },
    [handleSelectProperty]
  );

  const handleExcludeProperty = useCallback(
    (property: Property) => {
      addExclusion.mutate(property, {
        onSuccess: () => refetchExcludedProperties(),
      });
      setDisplayedProperties((prev) =>
        prev.filter((p) => p.id !== property.id)
      );
      if (selectedPropertyId === property.id) {
        handleSelectProperty(property.id);
      }
    },
    [
      selectedPropertyId,
      handleSelectProperty,
      addExclusion,
      refetchExcludedProperties,
    ]
  );

  const enrichProperty = trpc.property.enrich.useMutation();

  const handleRestoreProperty = useCallback(
    async (propertyToRestore: Property) => {
      removeExclusion.mutate(propertyToRestore.id, {
        onSuccess: () => refetchExcludedProperties(),
      });

      const destinationCoords = searchMetadata?.destinationCoords;
      const isochrones = searchMetadata?.isochrones ?? [];
      const shouldQueryPublicTransport =
        !debugConfig.enabled || debugConfig.queryPublicTransport;

      // 1. Check if it passes general filters (buckets, keywords, etc.)
      if (!matchesGeneralFilters(propertyToRestore, appliedFilters)) {
        return;
      }

      // 2. If there's a destination, check if it's within the reachable area
      if (destinationCoords && isochrones.length > 0) {
        const isInReachableArea = isochrones.some((iso) =>
          isPointInPolygon(
            { lat: propertyToRestore.lat, lng: propertyToRestore.lng },
            iso.polygon
          )
        );
        if (!isInReachableArea) {
          return;
        }
      }

      // 3. If there are travel filters, enrich the property with travel times and check them
      if (destinationCoords && appliedFilters.travelModes.length > 0) {
        const enrichedProperty = await enrichProperty.mutateAsync({
          property: propertyToRestore,
          destinationCoords,
          shouldQueryPublicTransport,
        });
        if (matchesTravelFilters(enrichedProperty, appliedFilters)) {
          setDisplayedProperties((prev) => [...prev, enrichedProperty]);
        }
      } else {
        // No travel filters, just add it back
        setDisplayedProperties((prev) => [...prev, propertyToRestore]);
      }
    },
    [
      searchMetadata,
      appliedFilters,
      removeExclusion,
      refetchExcludedProperties,
      enrichProperty,
    ]
  );

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
        onOpenEmailPopup={() => setIsEmailPopupOpen(true)}
        excludedProperties={excludedProperties || []}
        onRestoreProperty={handleRestoreProperty}
        destinationCoords={searchMetadata?.destinationCoords || null}
        onFocusPropertyOnMap={setTempMapPin}
      />
      {isEmailPopupOpen && (
        <EmailPrototypePopup
          onClose={() => setIsEmailPopupOpen(false)}
          filters={appliedFilters}
          excludedProperties={excludedProperties || []}
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