import React from 'react';
import { Property, SortBy, FilterCriteria, TravelMode } from '../../types';
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
    onHover: () => void;
}

export const PrimaryMetricDisplay: React.FC<PrimaryMetricDisplayProps> = ({ property, travelModes, sortBy, onHover }) => {
    const getDisplayInfo = () => {
        const iconMap: Record<TravelMode, React.FC<{className?: string}>> = { public: TrainIcon, bike: BikeIcon, car: CarIcon, walk: WalkIcon };

        const getTravelTimeForSort = (sort: SortBy) => {
            switch(sort) {
                case 'travelTimePublic': return { time: property.commuteTimes.public, icon: iconMap.public };
                case 'travelTimeBike': return { time: property.commuteTimes.bike, icon: iconMap.bike };
                case 'travelTimeCar': return { time: property.commuteTimes.car, icon: iconMap.car };
                case 'travelTimeWalk': return { time: property.commuteTimes.walk, icon: iconMap.walk };
                default:
                    const best = getBestTravelTime(property, travelModes);
                    if (!best) return null;
                    const Icon = iconMap[best.mode as TravelMode];
                    return { time: best.time, icon: Icon };
            }
        }
        
        const info = getTravelTimeForSort(sortBy);
        if (!info || info.time === undefined) {
             const best = getBestTravelTime(property, travelModes);
             if (!best) return null;
             const Icon = iconMap[best.mode as TravelMode];
             return { time: best.time, icon: Icon };
        }
        return info;
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
    const Icon = displayInfo.icon;

    return (
        <div className="relative group/metric flex items-center text-sm text-gray-600" onMouseEnter={onHover}>
            <Icon className="h-5 w-5 mr-1.5 text-gray-500" />
            <span className={isBold ? 'font-bold' : ''}>{formatTravelTime(displayInfo.time)}</span>
            <TravelTimePopover property={property} travelModes={travelModes} />
        </div>
    );
};