import React, { useState, useRef, useEffect } from 'react';
import { FilterCriteria } from '../../types';

interface AdvancedFilterControlProps {
    filters: FilterCriteria;
    onFilterChange: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
}

export const AdvancedFilterControl: React.FC<AdvancedFilterControlProps> = ({ filters, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const controlRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (controlRef.current && !controlRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={controlRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
                <span>More Filters</span>
                <i className={`fa-solid fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border z-50 p-4 space-y-4 animate-fade-in-fast">
                    <div>
                        <label htmlFor="exclusion-keywords" className="block text-sm font-medium text-gray-700 mb-1">Exclusion Keywords</label>
                        <input
                            type="text"
                            id="exclusion-keywords"
                            value={filters.exclusionKeywords}
                            onChange={e => onFilterChange('exclusionKeywords', e.target.value)}
                            placeholder="e.g. Tausch, exchange"
                            className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900"
                        />
                         <p className="text-xs text-gray-500 mt-1">Comma-separated words to exclude from title/description.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User Gender</label>
                        <select
                            value={filters.genderPreference}
                            onChange={e => onFilterChange('genderPreference', e.target.value as FilterCriteria['genderPreference'])}
                            className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900"
                        >
                            <option value="any">Any</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rental Duration</label>
                        <select
                            value={filters.rentalDuration}
                            onChange={e => onFilterChange('rentalDuration', e.target.value as FilterCriteria['rentalDuration'])}
                            className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900"
                        >
                            <option value="permanent">Permanent (&ge; 1 yr)</option>
                            <option value="temporary">Temporary (&lt; 1 yr)</option>
                        </select>
                         <p className="text-xs text-gray-500 mt-1">Filters for long-term (permanent) or short-term lets.</p>
                    </div>
                </div>
            )}
        </div>
    );
};