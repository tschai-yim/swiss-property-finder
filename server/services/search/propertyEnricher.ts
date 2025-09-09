import { Property, TravelMode } from "../../../types";
import { geocodeAddress } from "../api/geoApi";
import { getRouteTime } from "../api/openRouteServiceApi";
import { getPublicTransportTime } from "../api/openDataTransportApi";
import { debugConfig } from "@/utils/env";
import { PropertyWithoutCommuteTimes } from "../providers/providerTypes";

// This function is now a utility for providers that don't get coordinates from their API.
export async function enrichWithGeocoding<
  TProperty extends { address: string; lat: number; lng: number },
>(properties: TProperty[]): Promise<TProperty[]> {
  const geocodedProperties = await Promise.all(
    properties.map(async (p) => {
      if (p.lat !== 0 && p.lng !== 0) return p;
      const coord = await geocodeAddress(p.address);
      if (!coord) return null;
      return { ...p, lat: coord.lat, lng: coord.lng };
    })
  );
  return geocodedProperties.filter(
    (p): p is NonNullable<typeof p> => p !== null
  );
}

/**
 * Enriches a single property with any missing travel time data.
 * Used for lazy-loading travel times on demand (e.g., on hover).
 * @param property - The property to enrich.
 * @param destCoords - The destination coordinates.
 * @returns A promise that resolves to the fully enriched property.
 */
export const lazyEnrichProperty = async (
  property: Property | PropertyWithoutCommuteTimes,
  destCoords: { lat: number; lng: number }
): Promise<Property> => {
  const from = { lat: property.lat, lng: property.lng };

  let modesToFetch: TravelMode[] = [
    "public",
    "bike",
    "car",
    "walk",
  ] as TravelMode[];
  if ("commuteTimes" in property)
    modesToFetch = modesToFetch.filter(
      (mode) => property.commuteTimes[mode] === undefined
    );

  const fetchedTimes = await Promise.all(
    modesToFetch.map((mode) => {
      switch (mode) {
        case "public":
          return debugConfig.queryPublicTransport
            ? getPublicTransportTime(from, destCoords)
            : Promise.resolve(null);
        case "bike":
        case "car":
        case "walk":
          return getRouteTime(from, destCoords, mode);
        default:
          return Promise.resolve(null);
      }
    })
  );

  const newCommuteTimes =
    "commuteTimes" in property ? { ...property.commuteTimes } : {};
  modesToFetch.forEach((mode, index) => {
    newCommuteTimes[mode] = fetchedTimes[index];
  });

  return {
    ...property,
    commuteTimes: newCommuteTimes,
  };
};
