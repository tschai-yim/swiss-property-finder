
import React from 'react';
import { Property, SortBy, FilterCriteria } from '../../types';
import { InfoIcon } from './InfoIcon';
import { TravelTimePopover } from './TravelTimePopover';
import { BikeIcon, TrainIcon, CarIcon, WalkIcon } from '../icons';
import { formatTravelTime } from '../../utils/formatters';
import { getBestTravelTime } from '../../utils/propertyUtils';

interface PrimaryMetricDisplayProps {
    property: Property;
    travelModes: FilterCriteria['travelModes'];
    sortBy: SortBy;
    onEnrich: () => void;
}

export const PrimaryMetricDisplay: React.FC<PrimaryMetricDisplayProps> = ({ property, travelModes, sortBy, onEnrich }) => {
    const getDisplayInfo = () => {
        const iconMap = { public: <TrainIcon />, bike: <BikeIcon />, car: <CarIcon />, walk: <WalkIcon />};

        switch(sortBy) {
            case 'travelTimePublic':
                return { time: property.travelTimePublic, icon: iconMap.public };
            case 'travelTimeBike':
                return { time: property.travelTimeBike, icon: iconMap.bike };
            case 'travelTimeCar':
                return { time: property.travelTimeCar, icon: iconMap.car };
            case 'travelTimeWalk':
                return { time: property.travelTimeWalk, icon: iconMap.walk };
            default: // 'travelTime', 'priceAsc', 'priceDesc', 'distance'
                const best = getBestTravelTime(property, travelModes);
                if (!best) return null;
                return { time: best.time, icon: iconMap[best.mode as keyof typeof iconMap] };
        }
    };

    const displayInfo = getDisplayInfo();

    if (!displayInfo) {
        return (
            <InfoIcon>
                <i className="fa-solid fa-clock h-5 w-5 mr-1.5 text-gray-500"></i>
                -
            </InfoIcon>
        );
    }
    
    const isBold = sortBy.startsWith('travelTime');

    return (
        <div className="relative group/metric flex items-center text-sm text-gray-600" onMouseEnter={onEnrich}>
            {React.cloneElement(displayInfo.icon, { className: "h-5 w-5 mr-1.5 text-gray-500" })}
            <span className={isBold ? 'font-bold' : ''}>{formatTravelTime(displayInfo.time)}</span>
            <TravelTimePopover property={property} travelModes={travelModes} />
        </div>
    );
};