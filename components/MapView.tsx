import React, { useRef } from "react";
import { Property, IsochroneData, FilterCriteria } from "../types";
import { useMapDestination } from "../hooks/map/useMapDestination";
import { useMapIsochrones } from "../hooks/map/useMapIsochrones";
import { useMapMarkers } from "../hooks/map/useMapMarkers";
import { useMapTempPin } from "../hooks/map/useMapTempPin";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

interface MapViewProps {
  properties: Property[];
  selectedPropertyId: string | null;
  hoveredPropertyId: string | null;
  destinationCoords: { lat: number; lng: number } | null;
  tempPinCoords: { lat: number; lng: number } | null;
  isochrones: IsochroneData[] | null;
  hoveredTravelMode: FilterCriteria["travelModes"][number] | null;
  isLoading: boolean;
  onSelectProperty: (id: string) => void;
  onHoverProperty: (id: string | null) => void;
}

function TemoMapChild({ props }: { props: MapViewProps }) {
  // TODO: Refactor this component away by making all hooks into components
  const map = useMap();
  useMapDestination(map, props.destinationCoords);
  useMapIsochrones(map, props.isochrones, props.hoveredTravelMode);
  useMapMarkers(
    map,
    props.properties,
    props.selectedPropertyId,
    props.hoveredPropertyId,
    {
      onSelectProperty: props.onSelectProperty,
      onHoverProperty: props.onHoverProperty,
    },
    props.isLoading
  );
  useMapTempPin(map, props.tempPinCoords);
  return undefined;
}

const MapView: React.FC<MapViewProps> = (props) => {
  return (
    <MapContainer
      className="h-full w-full"
      center={[47.3769, 8.5417]}
      zoom={13}
      scrollWheelZoom={true}
      touchZoom={true}
    >
      <TemoMapChild props={props} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
    </MapContainer>
  );
};

export default MapView;
