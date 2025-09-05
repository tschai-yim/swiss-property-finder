

import { useEffect, useRef, useMemo } from 'react';
import { Property } from '../../types';
import { formatMapPrice } from '../../utils/formatters';

// Declare Leaflet in the global scope
declare const L: any;

interface MapMarkerHandlers {
    onSelectProperty: (id: string) => void;
    onHoverProperty: (id: string | null) => void;
}

export const useMapMarkers = (
    map: any, 
    properties: Property[],
    selectedPropertyId: string | null,
    hoveredPropertyId: string | null,
    handlers: MapMarkerHandlers,
    isLoading: boolean
) => {
    const markersRef = useRef<{ [key: string]: any }>({});
    const propertyIdsRef = useRef<string>('');
    const { onSelectProperty, onHoverProperty } = handlers;

    const useFullNumberFormat = useMemo(() => properties.some(p => p.price < 1000), [properties]);

    const userInteractedRef = useRef(false);
    const isSearchingRef = useRef(isLoading);

    // Reset interaction flag on new search and listen for user interaction
    useEffect(() => {
        if (!map) return;
        
        // When a new search starts (isLoading goes from false to true), reset the interaction flag.
        if (isLoading && !isSearchingRef.current) {
            userInteractedRef.current = false;
        }
        isSearchingRef.current = isLoading;

        const onUserInteraction = () => {
            userInteractedRef.current = true;
        };

        map.on('dragstart', onUserInteraction);
        map.on('zoomstart', onUserInteraction);

        return () => {
            if (map) {
                map.off('dragstart', onUserInteraction);
                map.off('zoomstart', onUserInteraction);
            }
        };
    }, [map, isLoading]);


    // Add/remove markers and fit bounds
    useEffect(() => {
        if (!map) return;

        const existingMarkerIds = new Set(Object.keys(markersRef.current));
        const newPropertyIdsSet = new Set(properties.map(p => p.id));

        // Remove old markers
        existingMarkerIds.forEach(id => {
            if (!newPropertyIdsSet.has(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Add or update markers
        properties.forEach(property => {
             if (!markersRef.current[property.id]) {
                const marker = L.marker([property.lat, property.lng]).addTo(map);
                marker.on('click', () => onSelectProperty(property.id));
                marker.on('mouseover', () => onHoverProperty(property.id));
                marker.on('mouseout', () => onHoverProperty(null));
                markersRef.current[property.id] = marker;
            }
        });
        
        // Only fit bounds if the set of properties has actually changed
        const newPropertyIds = properties.map(p => p.id).sort().join(',');
        if (newPropertyIds !== propertyIdsRef.current) {
            propertyIdsRef.current = newPropertyIds;

            // Do not refocus map if user has already interacted with it
            if (!userInteractedRef.current) {
                const bounds = L.latLngBounds(properties.map(p => [p.lat, p.lng]));

                if (properties.length > 0 && bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                }
            }
        }
    }, [map, properties, onSelectProperty, onHoverProperty]);

    // Update marker styles on selection/hover
    useEffect(() => {
        if (!map) return;
        
        Object.values(markersRef.current).forEach(marker => marker.setZIndexOffset(0));

        properties.forEach(property => {
            const marker = markersRef.current[property.id];
            if (!marker) return;

            const isHighlighted = property.id === selectedPropertyId || property.id === hoveredPropertyId;

            const iconHtml = `
               <div class="flex items-center justify-center font-bold text-xs px-2 py-1 rounded-full shadow-lg cursor-pointer transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2
               ${isHighlighted
                   ? 'bg-rose-500 text-white scale-125'
                   : 'bg-white text-gray-800'
               }">
                   ${formatMapPrice(property.price, useFullNumberFormat)}
               </div>
           `;
           
           const customIcon = L.divIcon({
               html: iconHtml,
               className: 'map-pin-custom-icon', // an empty class name for targeting if needed
               iconSize: null,
               iconAnchor: [0,0],
           });
           
           marker.setIcon(customIcon);
           if (isHighlighted) {
               marker.setZIndexOffset(1000); // Bring to front
           }
        });

        // Pan to selected property if it's off-screen
        if (selectedPropertyId) {
            const selectedProperty = properties.find(p => p.id === selectedPropertyId);
            if (selectedProperty) {
                const latLng = L.latLng(selectedProperty.lat, selectedProperty.lng);
                if (!map.getBounds().contains(latLng)) {
                    map.panTo(latLng);
                }
            }
        }
    }, [map, properties, selectedPropertyId, hoveredPropertyId, useFullNumberFormat]);
};