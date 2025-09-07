import React from 'react';
import { Property, SortBy, FilterCriteria } from '../../types';
import { InfoIcon } from './InfoIcon';
import { TravelTimePopover } from './TravelTimePopover';
import { BikeIcon, TrainIcon, CarIcon, WalkIcon } from '../icons';
import { formatTravelTime } from '../../utils/formatters';
import { getBestTravelTime } from '../../utils/propertyUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

interface PrimaryMetricDisplayProps {
    property: Property;
    travelModes: FilterCriteria['travelModes'];
    sortBy: SortBy;
}

export const PrimaryMetricDisplay: React.FC<PrimaryMetricDisplayProps> = ({ property, travelModes, sortBy }) => {
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
                <FontAwesomeIcon icon={faClock} className="h-5 w-5 mr-1.5 text-gray-500" />
                -
            </InfoIcon>
        );
    }
    
    const isBold = sortBy.startsWith('travelTime');

    return (
        <div className="relative group/metric flex items-center text-sm text-gray-600">
            {React.cloneElement(displayInfo.icon, { className: "h-5 w-5 mr-1.5 text-gray-500" })}
            <span className={isBold ? 'font-bold' : ''}>{formatTravelTime(displayInfo.time)}</span>
            <TravelTimePopover property={property} travelModes={travelModes} />
        </div>
    );
};