

import React, { useState, useRef, useEffect } from 'react';
import { Property } from '../../types';
import PropertyCard from '../propertyCard/PropertyCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { PropertyWithoutCommuteTimes } from '@/server/services/providers/providerTypes';

interface ExcludedPropertiesProps {
    excludedProperties: PropertyWithoutCommuteTimes[];
    onRestoreProperty: (property: PropertyWithoutCommuteTimes) => void;
    destinationCoords: { lat: number, lng: number } | null;
    onFocusPropertyOnMap: (coords: { lat: number, lng: number } | null) => void;
}

export const ExcludedProperties: React.FC<ExcludedPropertiesProps> = ({ excludedProperties, onRestoreProperty, destinationCoords, onFocusPropertyOnMap }) => {
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

    // Effect to clear the temporary map pin when the popup is closed
    useEffect(() => {
        if (!isOpen) {
            onFocusPropertyOnMap(null);
        }
    }, [isOpen, onFocusPropertyOnMap]);

    return (
        <div className="relative" ref={controlRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                title="View and manage excluded listings"
            >
                <FontAwesomeIcon icon={faBan} />
                <span>Excluded ({excludedProperties.length})</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-[350px] bg-white rounded-lg shadow-2xl border z-50 animate-fade-in-fast flex flex-col">
                    <div className="p-4 border-b">
                         <h4 className="font-bold text-gray-800">Excluded Listings</h4>
                         <p className="text-xs text-gray-500 mt-1">These listings will be hidden from all future searches.</p>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
                        {excludedProperties.length > 0 ? (
                            excludedProperties.map(prop => (
                                <PropertyCard
                                    key={prop.id}
                                    property={prop as Property}
                                    isSelected={false}
                                    travelModes={[]}
                                    sortBy='latest'
                                    destinationCoords={destinationCoords}
                                    onSelect={() => {}}
                                    onHover={() => {}}
                                    onEnrich={() => {}}
                                    onFocus={(p) => onFocusPropertyOnMap({ lat: p.lat, lng: p.lng })}
                                    onRestore={() => onRestoreProperty(prop)}
                                    isExcludedView={true}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No listings have been excluded yet.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};