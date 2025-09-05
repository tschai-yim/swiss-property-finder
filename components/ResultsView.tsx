
import React from 'react';
import { Property, SearchMetadata, FilterCriteria, SortBy } from '../types';
import PropertyCard from './propertyCard/PropertyCard';
import SearchSummary from './SearchSummary';

interface ResultsViewProps {
    properties: Property[];
    filters: FilterCriteria;
    isLoading: boolean;
    loadingMessage: string;
    selectedPropertyId: string | null;
    hoveredPropertyId: string | null;
    searchMetadata: SearchMetadata | null;
    sortBy: SortBy;
    enrichingIds: Set<string>;
    onSortChange: (sortBy: SortBy) => void;
    onSelectProperty: (id: string) => void;
    onHoverProperty: (id: string | null) => void;
    onEnrichProperty: (id: string) => void;
    onExcludeProperty: (property: Property) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
    properties,
    filters,
    isLoading,
    loadingMessage,
    selectedPropertyId,
    hoveredPropertyId,
    searchMetadata,
    sortBy,
    enrichingIds,
    onSortChange,
    onSelectProperty,
    onHoverProperty,
    onEnrichProperty,
    onExcludeProperty,
}) => {

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
             <div className="space-y-4">
                <SearchSummary 
                    metadata={searchMetadata}
                    sortBy={sortBy}
                    onSortChange={onSortChange}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    filters={filters}
                />
                
                {properties.length > 0 ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                        {properties.map(property => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                isSelected={property.id === selectedPropertyId}
                                travelModes={filters.travelModes}
                                sortBy={sortBy}
                                destinationCoords={searchMetadata?.destinationCoords || null}
                                onSelect={onSelectProperty}
                                onHover={onHoverProperty}
                                onEnrich={onEnrichProperty}
                                onExclude={onExcludeProperty}
                            />
                        ))}
                    </div>
                ) : isLoading ? (
                     <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rose-500" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-16">
                         <h3 className="text-xl font-semibold text-gray-700">No properties found</h3>
                         <p className="text-gray-500 mt-2">Try adjusting your search filters or searching a different area.</p>
                     </div>
                )}
            </div>
        </div>
    );
};

export default ResultsView;
