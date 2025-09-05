
import { useEffect, useRef } from 'react';

// Declare Leaflet in the global scope
declare const L: any;

const tempPinIconHtml = `
<style>
    @keyframes pulse-blue {
        0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    .map-temp-pin-icon-inner {
        background-color: #3B82F6; /* blue-500 */
        border-radius: 50%;
        width: 12px;
        height: 12px;
        border: 2px solid white;
        box-shadow: 0 0 0 2px #3B82F6;
        animation: pulse-blue 2s infinite;
    }
</style>
<div class="map-temp-pin-icon-inner"></div>
`;


export const useMapTempPin = (map: any, coords: { lat: number; lng: number } | null) => {
    const tempPinMarkerRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;
        
        // Remove existing pin if coords are null or it exists
        if (tempPinMarkerRef.current) {
            tempPinMarkerRef.current.remove();
            tempPinMarkerRef.current = null;
        }

        if (coords) {
            const customIcon = L.divIcon({
                html: tempPinIconHtml,
                className: '', // No extra class needed, style is in the HTML
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
            
            const marker = L.marker([coords.lat, coords.lng], {
                icon: customIcon,
                zIndexOffset: 2000, // Ensure it's on top of everything
                interactive: false, // Make it non-clickable
            }).addTo(map);

            tempPinMarkerRef.current = marker;
            map.flyTo([coords.lat, coords.lng], 15);
        }

    }, [map, coords]);
};
