
import React, { useState, useEffect, useRef } from 'react';
import { PropertyProviderInfo } from '../../types';

interface ActionButtonsProps {
    providers: PropertyProviderInfo[];
    destinationCoords: { lat: number; lng: number } | null;
    propertyCoords: { lat: number; lng: number };
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ providers, destinationCoords, propertyCoords }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!providers || providers.length === 0) return null;

    const primaryProvider = providers[0];
    const otherProviders = providers.slice(1);
    const hasMultipleProviders = otherProviders.length > 0;
    
    const googleMapsUrl = destinationCoords
        ? `https://www.google.com/maps/dir/?api=1&origin=${propertyCoords.lat},${propertyCoords.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=transit`
        : null;

    const buttonBaseClasses = "w-full text-center text-white font-bold py-2 px-2 transition-colors text-sm flex items-center justify-center";
    const primaryButtonClasses = `bg-rose-500 hover:bg-rose-600 ${hasMultipleProviders ? 'rounded-l-lg' : 'rounded-lg'}`;
    const dropdownButtonClasses = "bg-rose-500 hover:bg-rose-600 rounded-r-lg px-3 border-l border-rose-400 hover:border-rose-500";

    const routeButton = googleMapsUrl && (
         <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`${buttonBaseClasses} bg-rose-500 hover:bg-rose-600 rounded-lg`}
        >
            <i className="fa-solid fa-route mr-1.5"></i>
            <span>Route</span>
        </a>
    );

    if (!hasMultipleProviders) {
        return (
             <div className={`mt-3 grid ${googleMapsUrl ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                <a
                    href={primaryProvider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`${buttonBaseClasses} ${primaryButtonClasses}`}
                >
                    <i className="fa-solid fa-arrow-up-right-from-square mr-1.5"></i>
                    <span>{primaryProvider.name}</span>
                </a>
                {routeButton}
            </div>
        );
    }

    return (
        <div className={`mt-3 grid ${googleMapsUrl ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
            <div className="relative" ref={dropdownRef}>
                <div className="flex">
                    <a
                        href={primaryProvider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`${buttonBaseClasses} ${primaryButtonClasses} flex-grow min-w-0`}
                    >
                        <i className="fa-solid fa-arrow-up-right-from-square mr-1.5"></i>
                        <span className="truncate">{primaryProvider.name}</span>
                    </a>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(prev => !prev); }}
                        className={dropdownButtonClasses}
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                        aria-label="Other providers"
                    >
                        <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                </div>
                {isDropdownOpen && (
                    <div className="absolute bottom-full mb-2 w-full bg-white rounded-md shadow-lg border z-10">
                        <ul className="py-1">
                            {otherProviders.map(p => (
                                <li key={p.name}>
                                    <a
                                        href={p.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        View on {p.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {routeButton}
        </div>
    );
};