import React from 'react';
import { SearchMetadata, SortBy, FilterCriteria } from '../types';

interface SearchSummaryProps {
    metadata: SearchMetadata | null;
    resultCount: number;
    sortBy: SortBy;
    onSortChange: (sortBy: SortBy) => void;
    isLoading: boolean;
    loadingMessage: string;
    filters: FilterCriteria;
}

const SearchSummary: React.FC<SearchSummaryProps> = ({ metadata, resultCount, sortBy, onSortChange, isLoading, loadingMessage, filters }) => {
    
    const renderMetadata = () => {
        if (!metadata && isLoading) {
            return <div className="h-5 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>;
        }
        if (!metadata) return <p className="text-sm text-gray-600">Enter your criteria and press Search to begin.</p>;

        const { searchLocations } = metadata;

        const locationsString = (searchLocations || []).join(', ');
        let locationDisplay: React.ReactNode;

        const locations = searchLocations || [];
        if (locations.length > 2) {
            locationDisplay = <span className="font-semibold text-gray-800" title={locationsString}>{locations.length} locations</span>;
        } else if (locations.length > 0) {
            locationDisplay = <span className="font-semibold text-gray-800">{locations.join(' & ')}</span>;
        } else {
            locationDisplay = "the selected area";
        }
        
        return (
            <p className="text-sm text-gray-600">
                Displaying <span className="font-semibold text-rose-500">{resultCount}</span> matching properties in {locationDisplay}.
            </p>
        );
    };

    const hasResults = resultCount > 0;
    const hasDestination = !!metadata?.destinationCoords;

    const travelModeSortOptions: { value: SortBy, label: string, mode: FilterCriteria['travelModes'][number] }[] = [
        { value: 'travelTimePublic', label: 'Time (Public)', mode: 'public' },
        { value: 'travelTimeBike', label: 'Time (Bike)', mode: 'bike' },
        { value: 'travelTimeCar', label: 'Time (Car)', mode: 'car' },
        { value: 'travelTimeWalk', label: 'Time (Walk)', mode: 'walk' },
    ];

    return (
        <div className="bg-white/50 border rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex-grow min-w-[200px]">
                {renderMetadata()}
            </div>
            <div className="flex items-center space-x-4">
                 {isLoading && (
                    <div className="flex items-center space-x-2" role="status" aria-live="polite">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500"></div>
                        <span className="text-sm text-gray-600 hidden md:inline">{loadingMessage}</span>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select 
                        id="sort-by"
                        value={sortBy} 
                        onChange={(e) => onSortChange(e.target.value as SortBy)}
                        className="p-2 border rounded-md shadow-sm text-sm focus:ring-rose-500 focus:border-rose-500 disabled:opacity-50 bg-white text-gray-900"
                        disabled={!hasResults}
                    >
                        <option value="latest">Latest Added</option>
                        <option value="priceAsc">Price (low to high)</option>
                        <option value="priceDesc">Price (high to high)</option>
                        <option value="travelTime" disabled={!hasDestination}>Travel Time (shortest)</option>
                        <option value="distance" disabled={!hasDestination}>Distance (closest)</option>
                        {travelModeSortOptions.map(opt => (
                            <option 
                                key={opt.value} 
                                value={opt.value} 
                                disabled={!hasDestination || !filters.travelModes.includes(opt.mode)}
                            >
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default SearchSummary;