import { Property, FilterCriteria } from '../types';

export const getBestTravelTime = (property: Property, modes: FilterCriteria['travelModes']): { time: number; mode: string } | null => {
    let bestTime = Infinity;
    let bestMode = '';
    
    const timeMap = {
        public: property.travelTimePublic,
        bike: property.travelTimeBike,
        car: property.travelTimeCar,
        walk: property.travelTimeWalk,
    };

    modes.forEach(mode => {
        const time = timeMap[mode];
        if (time !== undefined && time !== null && time < bestTime) {
            bestTime = time;
            bestMode = mode;
        }
    });

    if (bestTime === Infinity) return null;
    return { time: Math.round(bestTime), mode: bestMode };
};
