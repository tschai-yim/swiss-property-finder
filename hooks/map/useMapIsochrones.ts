
import { useEffect, useRef } from 'react';
import { IsochroneData, FilterCriteria } from '../../types';

// Declare Leaflet and the polygon clipping library in the global scope
declare const L: any;
declare const polygonClipping: any;

const mergedIsochroneStyle = { color: '#f43f5e', fillColor: '#f43f5e', weight: 2, opacity: 0.6, fillOpacity: 0.15 };
const highlightIsochroneStyle = mergedIsochroneStyle;
const grayedOutIsochroneStyle = { color: '#d1d5db', fillColor: '#d1d5db', weight: 2, opacity: 0.5, fillOpacity: 0.1 };

const toLeafletCoords = (geojsonPolygon: any) => {
    // It's a MultiPolygon if the third level of nesting is an array (Point)
    if (Array.isArray(geojsonPolygon[0]?.[0]?.[0])) {
        return geojsonPolygon.map((poly: any) => 
            poly.map((ring: any) => 
                ring.map((coord: number[]) => [coord[1], coord[0]])
            )
        );
    }
    // It's a single Polygon (array of rings)
    return geojsonPolygon.map((ring: any) =>
        ring.map((coord: number[]) => [coord[1], coord[0]])
    );
};

export const useMapIsochrones = (map: any, isochrones: IsochroneData[] | null, hoveredTravelMode: FilterCriteria['travelModes'][number] | null) => {
    const baseIsochroneLayerRef = useRef<any>(null);
    const highlightIsochroneLayerRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        // Clear existing layers
        if (baseIsochroneLayerRef.current) baseIsochroneLayerRef.current.remove();
        if (highlightIsochroneLayerRef.current) highlightIsochroneLayerRef.current.remove();
        baseIsochroneLayerRef.current = null;
        highlightIsochroneLayerRef.current = null;

        if (!isochrones || isochrones.length === 0 || typeof polygonClipping === 'undefined') return;

        const allPolygonsForClipping = isochrones.map(i => [i.polygon]);

        const mergedGeoJsonPolygon = allPolygonsForClipping.length > 1
            ? allPolygonsForClipping.reduce((acc, p) => polygonClipping.union(acc, p))
            : allPolygonsForClipping[0];
        
        const leafletMergedCoords = toLeafletCoords(mergedGeoJsonPolygon);

        if (hoveredTravelMode) {
            // On hover: draw the merged area as grayed out
            baseIsochroneLayerRef.current = L.polygon(leafletMergedCoords, grayedOutIsochroneStyle).addTo(map);

            // ...and draw the highlighted specific travel mode's area on top
            const hoveredIsochrone = isochrones.find(iso => iso.mode === hoveredTravelMode);
            if (hoveredIsochrone) {
                const leafletHoveredCoords = hoveredIsochrone.polygon.map(coord => [coord[1], coord[0]]);
                highlightIsochroneLayerRef.current = L.polygon(leafletHoveredCoords, highlightIsochroneStyle).addTo(map);
                highlightIsochroneLayerRef.current.bringToFront();
            }
        } else {
            // Default: draw the colorful merged area
             baseIsochroneLayerRef.current = L.polygon(leafletMergedCoords, mergedIsochroneStyle).addTo(map);
        }
    }, [map, isochrones, hoveredTravelMode]);
};
