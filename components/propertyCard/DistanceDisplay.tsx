import React from "react";
import { InfoIcon } from "./InfoIcon";
import { calculateDistance } from "../../utils/geoUtils";
import { formatDistance } from "../../utils/formatters";
import { SortBy } from "../../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";

interface DistanceDisplayProps {
  propertyCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number } | null;
  sortBy: SortBy;
}

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({
  propertyCoords,
  destinationCoords,
  sortBy,
}) => {
  const distance = destinationCoords
    ? calculateDistance(propertyCoords, destinationCoords)
    : null;
  return (
    <InfoIcon>
      <FontAwesomeIcon
        icon={faLocationArrow}
        className="h-5 w-5 mr-1.5 text-gray-500"
      />
      <span className={sortBy === "distance" ? "font-bold" : ""}>
        {formatDistance(distance)}
      </span>
    </InfoIcon>
  );
};
