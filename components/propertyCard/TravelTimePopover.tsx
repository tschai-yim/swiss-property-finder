
import React from 'react';
import { Property, FilterCriteria } from '../../types';
import { BikeIcon, TrainIcon, CarIcon, WalkIcon } from '../icons';
import { formatTravelTime } from '../../utils/formatters';
import { getBestTravelTime } from '../../utils/propertyUtils';

interface TravelTimePopoverProps {
    property: Property;
    travelModes: FilterCriteria['travelModes'];
}

export const TravelTimePopover: React.FC<TravelTimePopoverProps> = ({ property, travelModes }) => {
    const allModes: Array<'public' | 'bike' | 'car' | 'walk'> = ['public', 'bike', 'car', 'walk'];
    const bestTimeInfo = getBestTravelTime(property, travelModes);

    const travelTimeMap = {
        public: { time: property.travelTimePublic, icon: <TrainIcon />, name: "Transit" },
        bike: { time: property.travelTimeBike, icon: <BikeIcon />, name: "Bike" },
        car: { time: property.travelTimeCar, icon: <CarIcon />, name: "Car" },
        walk: { time: property.travelTimeWalk, icon: <WalkIcon />, name: "Walk" },
    };

    const containerClasses = "absolute bottom-full mb-2 w-max p-2 bg-white border rounded-lg shadow-xl opacity-0 group-hover/metric:opacity-100 transition-opacity duration-200 pointer-events-none z-20 left-1/2 -translate-x-1/2";
    const arrow = <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white"></div>;

    return (
        <div className={containerClasses}>
            <ul className="space-y-1">
                {allModes.map(mode => {
                    const { icon, time, name } = travelTimeMap[mode];
                    const isBest = bestTimeInfo?.mode === mode;
                    return (
                        <li key={mode} className={`flex items-center justify-between text-xs ${isBest ? 'text-rose-500' : 'text-gray-700'}`}>
                             <div className="flex items-center">
                                {React.cloneElement(icon, { className: "h-4 w-4 mr-1.5" })}
                                <span className="w-12">{name}</span>
                            </div>
                            <span className={`ml-2 text-right ${isBest ? 'font-bold' : 'font-semibold'}`}>
                                {time === undefined ? (
                                    <span className="inline-block align-middle bg-gray-200 rounded w-12 h-3 animate-pulse"></span>
                                ) : (
                                    formatTravelTime(time)
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
            {arrow}
        </div>
    );
};
