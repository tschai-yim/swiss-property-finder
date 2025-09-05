
import React from 'react';
import { InfoIcon } from './InfoIcon';
import { calculateDistance } from '../../services/geoUtils';
import { formatDistance } from '../../utils/formatters';
import { SortBy } from '../../types';

interface DistanceDisplayProps {
    propertyCoords: { lat: number; lng: number };
    destinationCoords: { lat: number; lng: number };
    sortBy: SortBy;
}

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({ propertyCoords, destinationCoords, sortBy }) => {
    const distance = calculateDistance(propertyCoords, destinationCoords);
    return (
        <InfoIcon>
            <i className="fa-solid fa-location-arrow h-5 w-5 mr-1.5 text-gray-500"></i>
            <span className={sortBy === 'distance' ? 'font-bold' : ''}>{formatDistance(distance)}</span>
        </InfoIcon>
    );
};