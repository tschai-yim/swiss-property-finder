import { Property, FilterCriteria } from "../types";

export const getBestTravelTime = (
  property: Property,
  modes: FilterCriteria["travelModes"]
): { time: number; mode: string } | null => {
  let bestTime = Infinity;
  let bestMode = "";

  modes.forEach((mode) => {
    const time = property.commuteTimes[mode];
    if (time !== undefined && time !== null && time < bestTime) {
      bestTime = time;
      bestMode = mode;
    }
  });

  if (bestTime === Infinity) return null;
  return { time: Math.round(bestTime), mode: bestMode };
};
