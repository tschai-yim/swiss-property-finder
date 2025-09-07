


import React from 'react';
// Fix: Import `Property` type.
import { FilterCriteria, IsochroneData, DebugConfig, Property } from '../types';
import { CommuteFilter } from './filters/CommuteFilter';
import { FilterBucketList } from './filters/FilterBucketList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faCheck, faHouseChimney, faEnvelope } from '@fortawesome/free-solid-svg-icons';

// Fix: Add 'onToggleBucketType' and extend 'onUpdateBucket' to match the props required by FilterBucketList.
interface FilterBarProps {
    filters: FilterCriteria;
    onFilterChange: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
    onAddBucket: () => void;
    onRemoveBucket: (id: string) => void;
    onUpdateBucket: (id: string, field: 'price' | 'rooms' | 'size' | 'roommates', subField: 'min' | 'max', value: string) => void;
    onToggleBucketType: (id: string) => void;
    onSearch: () => void;
    editingBucketId: string | null;
    onSetEditingBucketId: (id: string | null) => void;
    onHoverTravelMode: (mode: FilterCriteria['travelModes'][number] | null) => void;
    areFiltersDirty: boolean;
    isochrones?: IsochroneData[] | null;
    debugConfig: DebugConfig;
    onToggleDebugPopup: () => void;
    onOpenEmailPopup: () => void;
    excludedProperties: Property[];
    // Fix: Changed `onRemoveExclusion` to `onRestoreProperty` to match the prop passed from `App.tsx` and required by `FilterBucketList`.
    onRestoreProperty: (property: Property) => void;
    destinationCoords: { lat: number, lng: number } | null;
    onFocusPropertyOnMap: (coords: { lat: number, lng: number } | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = (props) => {
    const SearchButton: React.FC = () => {
        const isDirty = props.areFiltersDirty;

        // The container size now determines the "normal" size of the button.
        const containerSizeClasses = "min-w-[150px] min-h-[44px]";

        const buttonBaseClasses = "w-full h-full font-bold rounded-lg focus:outline-none flex items-center justify-center text-lg transition-all duration-300 ease-in-out";
        
        // Active state is now slightly larger.
        const activeClasses = "bg-rose-500 text-white hover:bg-rose-600 focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 shadow-lg scale-105";
        // Inactive state is now the default "normal" size.
        const inactiveClasses = "bg-gray-200 text-gray-500 cursor-not-allowed scale-100";

        // Base classes for the content spans to handle the text transition.
        const contentSpanBase = "flex items-center justify-center transition-opacity duration-300 whitespace-nowrap";

        return (
            <div className={`relative w-full lg:w-auto ${containerSizeClasses}`}>
                 <button
                    onClick={props.onSearch}
                    disabled={!isDirty}
                    title={!isDirty ? "Your search criteria is already applied." : "Run a new search with the current filters."}
                    // The button fills the container absolutely, allowing it to scale without affecting layout.
                    className={`absolute inset-0 ${buttonBaseClasses} ${isDirty ? activeClasses : inactiveClasses}`}
                >
                    {/* Active state content: "Search" */}
                    <span className={`${contentSpanBase} ${isDirty ? 'opacity-100' : 'opacity-0'}`}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2" />
                        Search
                    </span>
                    
                    {/* Inactive state content: "Searched". Positioned absolutely to overlap. */}
                     <span className={`${contentSpanBase} absolute ${!isDirty ? 'opacity-100' : 'opacity-0'}`}>
                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                        Searched
                    </span>
                </button>
            </div>
        );
    };


    return (
        <div className="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-[1001] p-4 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Row: Logo, Title, Commute, and Desktop Search */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 self-start lg:self-center">
                        <div
                            className="flex items-center space-x-3 cursor-pointer"
                            onClick={props.onToggleDebugPopup}
                            title={`Click to configure debug settings. Debug mode is currently: ${props.debugConfig.enabled ? 'ON' : 'OFF'}`}
                        >
                            <FontAwesomeIcon icon={faHouseChimney} className={`text-3xl transition-colors ${!props.debugConfig.enabled ? 'text-rose-500' : 'text-gray-400'}`} />
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight hidden sm:block">
                                Swiss Property Finder
                            </h1>
                        </div>
                        <button
                            onClick={props.onOpenEmailPopup}
                            title="Generate Email Prototype"
                            className="text-gray-400 hover:text-rose-500 transition-colors"
                            aria-label="Generate Email Prototype"
                        >
                            <FontAwesomeIcon icon={faEnvelope} className="text-2xl" />
                        </button>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
                        <CommuteFilter 
                            filters={props.filters} 
                            onFilterChange={props.onFilterChange} 
                            onHoverTravelMode={props.onHoverTravelMode}
                            isochrones={props.isochrones}
                        />
                        <div className="hidden lg:block">
                           <SearchButton />
                        </div>
                    </div>
                </div>

                {/* Second Row: Buckets and Mobile Search */}
                 <div className="flex flex-col gap-4 mt-4">
                    <FilterBucketList {...props} />
                    <div className="lg:hidden">
                        <SearchButton />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;