
import { useEffect, useRef } from 'react';

// Declare Leaflet in the global scope
declare const L: any;

export const useMapDestination = (map: any, destinationCoords: { lat: number; lng: number } | null) => {
    const destinationMarkerRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        if (destinationCoords) {
            const iconHtml = `<div class="text-white text-3xl [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.7))]"><i class="fa-solid fa-location-dot"></i></div>`;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'map-pin-custom-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
            });

            if (destinationMarkerRef.current) {
                destinationMarkerRef.current.setLatLng([destinationCoords.lat, destinationCoords.lng]);
            } else {
                const marker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: customIcon, zIndexOffset: 1000 }).addTo(map);
                destinationMarkerRef.current = marker;
            }
        } else if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
            destinationMarkerRef.current = null;
        }
    }, [map, destinationCoords]);
};
