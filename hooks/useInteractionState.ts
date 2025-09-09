import { useState, useCallback, useMemo } from 'react';
import { Property, SortBy, FilterCriteria } from '../types';
import { getBestTravelTime } from '../utils/propertyUtils';
import { calculateDistance } from '../utils/geoUtils';

export const useInteractionState = (
    properties: Property[],
    travelModes: FilterCriteria['travelModes'],
    destinationCoords: { lat: number; lng: number } | null
) => {
    const [sortBy, setSortBy] = useState<SortBy>('latest');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
    const [hoveredTravelMode, setHoveredTravelMode] = useState<FilterCriteria['travelModes'][number] | null>(null);
    
    const sortedProperties = useMemo(() => {
        const sortValue = (a: number | null | undefined, b: number | null | undefined): number => {
            const valA = a ?? Infinity;
            const valB = b ?? Infinity;
            if (valA === Infinity && valB === Infinity) return 0;
            if (valA === Infinity) return 1;
            if (valB === Infinity) return -1;
            return valA - valB;
        };
        
        return [...properties].sort((a, b) => {
            switch (sortBy) {
                case 'latest':
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
                    return timeB - timeA;
                case 'priceAsc':
                    return a.price - b.price;
                case 'priceDesc':
                    return b.price - a.price;
                case 'distance':
                    if (!destinationCoords) return 0;
                    const distA = calculateDistance({ lat: a.lat, lng: a.lng }, destinationCoords);
                    const distB = calculateDistance({ lat: b.lat, lng: b.lng }, destinationCoords);
                    return distA - distB;
                case 'travelTimePublic':
                    return sortValue(a.commuteTimes.public, b.commuteTimes.public);
                case 'travelTimeBike':
                    return sortValue(a.commuteTimes.bike, b.commuteTimes.bike);
                case 'travelTimeCar':
                    return sortValue(a.commuteTimes.car, b.commuteTimes.car);
                case 'travelTimeWalk':
                    return sortValue(a.commuteTimes.walk, b.commuteTimes.walk);
                case 'travelTime':
                default:
                    const aBestTime = getBestTravelTime(a, travelModes)?.time ?? Infinity;
                    const bBestTime = getBestTravelTime(b, travelModes)?.time ?? Infinity;

                    if (aBestTime !== bBestTime) {
                        if (aBestTime === Infinity) return 1; // Properties without times go to the end
                        if (bBestTime === Infinity) return -1;
                        return aBestTime - bBestTime;
                    }

                    // Tie-breaker: if travel times are equal, sort by distance
                    if (destinationCoords) {
                         const distA = calculateDistance({ lat: a.lat, lng: a.lng }, destinationCoords);
                         const distB = calculateDistance({ lat: b.lat, lng: b.lng }, destinationCoords);
                         return distA - distB;
                    }

                    return 0; // No destination, can't use tie-breaker
            }
        });
    }, [properties, sortBy, travelModes, destinationCoords]);

    const handleSortChange = useCallback((newSortBy: SortBy) => {
        setSortBy(newSortBy);
    }, []);
    
    const handleSelectProperty = useCallback((id: string): string | null => {
        const newId = selectedPropertyId === id ? null : id;
        setSelectedPropertyId(newId);
        return newId;
    }, [selectedPropertyId]);

    const handleHoverProperty = useCallback((id: string | null) => {
        setHoveredPropertyId(id);
    }, []);

    const handleHoverTravelMode = useCallback((mode: FilterCriteria['travelModes'][number] | null) => {
        setHoveredTravelMode(mode);
    }, []);

    return {
        sortBy,
        selectedPropertyId,
        hoveredPropertyId,
        hoveredTravelMode,
        sortedProperties,
        handleSortChange,
        handleSelectProperty,
        handleHoverProperty,
        handleHoverTravelMode,
    };
};