
import React from 'react';

interface MapPinProps {
    lat: number;
    lng: number;
    price: number;
    isHovered: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onHover: (isHovering: boolean) => void;
}

// Simple normalization function
const normalize = (val: number, min: number, max: number) => ((val - min) / (max - min)) * 100;

import { ZURICH_BOUNDS } from '../constants';

const MapPin: React.FC<MapPinProps> = ({ price, lat, lng, isHovered, isSelected, onSelect, onHover }) => {
    const top = normalize(ZURICH_BOUNDS.maxLat - lat, 0, ZURICH_BOUNDS.maxLat - ZURICH_BOUNDS.minLat);
    const left = normalize(lng - ZURICH_BOUNDS.minLng, 0, ZURICH_BOUNDS.maxLng - ZURICH_BOUNDS.minLng);

    const isHighlighted = isHovered || isSelected;

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${top}%`, left: `${left}%` }}
            onClick={onSelect}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
        >
            <div
                className={`flex items-center justify-center font-bold text-xs px-2 py-1 rounded-full shadow-lg cursor-pointer transition-all duration-200
                ${isHighlighted
                    ? 'bg-rose-500 text-white scale-125 z-10'
                    : 'bg-white text-gray-800'
                }`}
            >
                {Math.round(price / 1000)}k
            </div>
        </div>
    );
};

export default MapPin;
