

import { useEffect, useRef } from 'react';

// Declare Leaflet in the global scope
declare const L: any;

export const useLeafletMap = (mapContainerRef: React.RefObject<HTMLDivElement | null>) => {
    const mapRef = useRef<any>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                // Allow mouse scroll and touch drag to zoom the map
                scrollWheelZoom: true,
                touchZoom: true,
            }).setView([47.3769, 8.5417], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            mapRef.current = map;
        }
    }, [mapContainerRef]);

    return mapRef.current;
};