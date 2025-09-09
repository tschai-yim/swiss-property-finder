import React, { useState, useEffect, useRef } from 'react';
import { FilterCriteria, TravelMode, IsochroneData } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { BikeIcon, TrainIcon, CarIcon, WalkIcon } from '../icons';
import { TravelModeControl } from './TravelModeControl';
import { trpc } from '../../utils/trpc';

interface CommuteFilterProps {
    filters: FilterCriteria;
    onFilterChange: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
    onHoverTravelMode: (mode: TravelMode | null) => void;
    isochrones?: IsochroneData[] | null;
}

export const CommuteFilter: React.FC<CommuteFilterProps> = ({ filters, onFilterChange, onHoverTravelMode, isochrones }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [destinationQuery, setDestinationQuery] = useState(filters.destination);
    const [editingMode, setEditingMode] = useState<TravelMode | null>(null);
    const modeControlRefs = useRef<Record<TravelMode, HTMLDivElement | null>>({ public: null, bike: null, car: null, walk: null });
    const destinationInputRef = useRef<HTMLDivElement>(null);
    const debouncedDestinationQuery = useDebounce(destinationQuery, 400);

    const { data: suggestions, refetch: fetchAddressSuggestions } = trpc.geo.fetchAddressSuggestions.useQuery(debouncedDestinationQuery, { enabled: false });

    useEffect(() => {
        setDestinationQuery(filters.destination);
    }, [filters.destination]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close destination suggestions
            if (destinationInputRef.current && !destinationInputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            // Close travel time editor
            if (editingMode) {
                const currentRef = modeControlRefs.current[editingMode];
                if (currentRef && !currentRef.contains(event.target as Node)) {
                    setEditingMode(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [editingMode]);

    useEffect(() => {
        if (showSuggestions && debouncedDestinationQuery && debouncedDestinationQuery.length > 2) {
            fetchAddressSuggestions();
        }
    }, [debouncedDestinationQuery, showSuggestions, fetchAddressSuggestions]);

    const handleSuggestionClick = (suggestion: string) => {
        setDestinationQuery(suggestion);
        onFilterChange('destination', suggestion);
        setShowSuggestions(false);
    };

    const travelModeConfig: { mode: TravelMode, icon: React.ReactNode, name: string }[] = [
        { mode: 'public', icon: <TrainIcon />, name: 'Transit' },
        { mode: 'bike', icon: <BikeIcon />, name: 'Bike' },
        { mode: 'car', icon: <CarIcon />, name: 'Car' },
        { mode: 'walk', icon: <WalkIcon />, name: 'Walk' }
    ];

    return (
        <div className="flex-grow flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div ref={destinationInputRef} className="relative w-full lg:w-80">
                <input
                    type="text"
                    value={destinationQuery}
                    onChange={(e) => setDestinationQuery(e.target.value)}
                    onBlur={() => onFilterChange('destination', destinationQuery)}
                    placeholder="Commute from..."
                    className="w-full p-2.5 bg-white border rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base text-gray-900"
                    autoComplete="off"
                    onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && suggestions && suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white border mt-1 rounded-md shadow-lg z-[4000] max-h-60 overflow-y-auto">
                        {suggestions.map((s: { display_name: string }, i: number) => (
                            <li key={i} className="px-4 py-2 cursor-pointer text-gray-800 hover:bg-rose-50" onClick={() => handleSuggestionClick(s.display_name)}>
                                {s.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex items-center flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
                {travelModeConfig.map(config => {
                    const { mode } = config;
                    const isChecked = filters.travelModes.includes(mode);

                    const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const { checked } = e.target;
                        const currentModes = filters.travelModes;
                        if (currentModes.length === 1 && currentModes[0] === mode && !checked) return;

                        const newModes = checked ? [...currentModes, mode] : currentModes.filter(m => m !== mode);
                        onFilterChange('travelModes', newModes.sort());

                        if (!checked && editingMode === mode) {
                            setEditingMode(null);
                        }
                    };

                    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const newMaxTravelTimes = { ...filters.maxTravelTimes, [mode]: e.target.value };
                        onFilterChange('maxTravelTimes', newMaxTravelTimes);
                    };

                    return (
                        <TravelModeControl
                            ref={el => { modeControlRefs.current[mode] = el; }}
                            key={mode}
                            mode={mode}
                            icon={config.icon}
                            name={config.name}
                            isChecked={isChecked}
                            isEditing={editingMode === mode}
                            value={filters.maxTravelTimes[mode]}
                            onCheckChange={handleCheckChange}
                            onTimeChange={handleTimeChange}
                            onSetEditing={setEditingMode}
                            onHover={onHoverTravelMode}
                            canHighlight={!!isochrones?.some(iso => iso.mode === mode)}
                        />
                    );
                })}
            </div>
        </div>
    );
};