
import React, { useRef } from 'react';
import { Property, IsochroneData, FilterCriteria } from '../types';
import { useLeafletMap } from '../hooks/map/useLeafletMap';
import { useMapDestination } from '../hooks/map/useMapDestination';
import { useMapIsochrones } from '../hooks/map/useMapIsochrones';
import { useMapMarkers } from '../hooks/map/useMapMarkers';
import { useMapTempPin } from '../hooks/map/useMapTempPin';

// Declare Leaflet and the polygon clipping library in the global scope
declare const L: any;
declare const polygonClipping: any;

interface MapViewProps {
    properties: Property[];
    selectedPropertyId: string | null;
    hoveredPropertyId: string | null;
    destinationCoords: { lat: number; lng: number } | null;
    tempPinCoords: { lat: number; lng: number } | null;
    isochrones: IsochroneData[] | null;
    hoveredTravelMode: FilterCriteria['travelModes'][number] | null;
    isLoading: boolean;
    onSelectProperty: (id: string) => void;
    onHoverProperty: (id: string | null) => void;
}

const MapView: React.FC<MapViewProps> = (props) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const map = useLeafletMap(mapContainerRef);

    useMapDestination(map, props.destinationCoords);
    useMapIsochrones(map, props.isochrones, props.hoveredTravelMode);
    useMapMarkers(map, props.properties, props.selectedPropertyId, props.hoveredPropertyId, {
        onSelectProperty: props.onSelectProperty,
        onHoverProperty: props.onHoverProperty,
    }, props.isLoading);
    useMapTempPin(map, props.tempPinCoords);

    return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default MapView;
