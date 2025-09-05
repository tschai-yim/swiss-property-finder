import React from 'react';
import { Property, FilterCriteria, SortBy } from '../types';
import { BikeIcon, TrainIcon, CarIcon, WalkIcon } from './icons';
import { formatTravelTime, formatDistance } from '../utils/formatters';
import { getBestTravelTime } from '../utils/propertyUtils';
import { calculateDistance } from '../utils/geoUtils';

interface PropertyCardProps {
    property: Property;
    isSelected: boolean;
    travelModes: FilterCriteria['travelModes'];
    sortBy: SortBy;
    destinationCoords: { lat: number; lng: number } | null;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
    onEnrich: (id: string) => void;
}

const InfoIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center text-sm text-gray-600">{children}</div>
);

// Component for the popover display, shown on hover
const TravelTimePopover: React.FC<{ property: Property; travelModes: FilterCriteria['travelModes'] }> = ({ property, travelModes }) => {
    const allModes: Array<'public' | 'bike' | 'car' | 'walk'> = ['public', 'bike', 'car', 'walk'];
    const bestTimeInfo = getBestTravelTime(property, travelModes);

    const travelTimeMap = {
        public: { time: property.travelTimePublic, icon: <TrainIcon />, name: "Transit" },
        bike: { time: property.travelTimeBike, icon: <BikeIcon />, name: "Bike" },
        car: { time: property.travelTimeCar, icon: <CarIcon />, name: "Car" },
        walk: { time: property.travelTimeWalk, icon: <WalkIcon />, name: "Walk" },
    };

    const containerClasses = "absolute bottom-full mb-2 w-max p-2 bg-white border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 left-1/2 -translate-x-1/2";
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

const PrimaryMetricDisplay: React.FC<{
    property: Property,
    travelModes: FilterCriteria['travelModes'],
    sortBy: SortBy,
    onEnrich: () => void
}> = ({ property, travelModes, sortBy, onEnrich }) => {
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
    
    return (
        <div className="relative group flex items-center text-sm text-gray-600" onMouseEnter={onEnrich}>
            {React.cloneElement(displayInfo.icon, { className: "h-5 w-5 mr-1.5 text-gray-500" })}
            <span className="font-bold">{formatTravelTime(displayInfo.time)}</span>
            <TravelTimePopover property={property} travelModes={travelModes} />
        </div>
    );
};

const DistanceDisplay: React.FC<{
    propertyCoords: { lat: number; lng: number };
    destinationCoords: { lat: number; lng: number };
}> = ({ propertyCoords, destinationCoords }) => {
    const distance = calculateDistance(propertyCoords, destinationCoords);
    return (
        <InfoIcon>
            <i className="fa-solid fa-location-arrow h-5 w-5 mr-1.5 text-gray-500"></i>
            <span className="font-bold">{formatDistance(distance)}</span>
        </InfoIcon>
    );
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, isSelected, travelModes, sortBy, destinationCoords, onSelect, onHover, onEnrich }) => {
    
    let googleMapsUrl: string | null = null;
    if (destinationCoords) {
        googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${property.lat},${property.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=transit`;
    }

    // Fix: The property type doesn't have a singular provider or detailUrl.
    // We should use the first provider from the providers array as the primary one.
    const primaryProvider = property.providers?.[0];

    return (
        <div
            id={`property-${property.id}`}
            className={`bg-white rounded-xl shadow-md cursor-pointer transition-all duration-300 flex flex-col ${isSelected ? 'ring-2 ring-rose-500' : 'ring-1 ring-gray-200'} hover:shadow-xl hover:-translate-y-1`}
            onClick={() => onSelect(property.id)}
            onMouseEnter={() => onHover(property.id)}
            onMouseLeave={() => onHover(null)}
        >
            <img className="h-48 w-full object-cover rounded-t-xl" src={property.imageUrl} alt={property.title} />
            <div className="p-3 flex flex-col flex-grow">
                {/* Top content: Price, Title, Address */}
                <div>
                    <p className="text-sm font-semibold text-rose-500">CHF {property.price.toLocaleString()}/month</p>
                    <h3 className="mt-1 text-lg font-bold text-gray-900 truncate">{property.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{property.address}</p>
                </div>
                
                {/* Bottom content: Details and Link (pushed to bottom) */}
                <div className="mt-auto pt-3">
                    <div className="flex justify-around items-center">
                        <InfoIcon>
                            <i className="fa-solid fa-door-open h-5 w-5 mr-1.5 text-gray-500"></i>
                            {property.rooms} rooms
                        </InfoIcon>
                        <InfoIcon>
                            <i className="fa-solid fa-ruler-combined h-5 w-5 mr-1.5 text-gray-500"></i>
                            {property.size && property.size > 0 ? `${property.size} m²` : '-'}
                        </InfoIcon>
                        <PrimaryMetricDisplay
                            property={property}
                            travelModes={travelModes}
                            sortBy={sortBy}
                            onEnrich={() => onEnrich(property.id)}
                        />
                         {sortBy === 'distance' && destinationCoords && (
                            <DistanceDisplay
                                propertyCoords={{ lat: property.lat, lng: property.lng }}
                                destinationCoords={destinationCoords}
                            />
                        )}
                    </div>
                </div>

                {googleMapsUrl ? (
                    <div className={`mt-3 grid ${primaryProvider ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                        {primaryProvider && (
                            <a
                                href={primaryProvider.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block w-full text-center bg-rose-500 text-white font-bold py-2 px-2 rounded-lg hover:bg-rose-600 transition-colors text-sm flex items-center justify-center"
                            >
                                <i className="fa-solid fa-arrow-up-right-from-square mr-1.5"></i>
                                <span>{primaryProvider.name}</span>
                            </a>
                        )}
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="block w-full text-center bg-rose-500 text-white font-bold py-2 px-2 rounded-lg hover:bg-rose-600 transition-colors text-sm flex items-center justify-center"
                        >
                            <i className="fa-solid fa-route mr-1.5"></i>
                            <span>Route</span>
                        </a>
                    </div>
                ) : primaryProvider ? (
                    <a
                        href={primaryProvider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 block w-full text-center bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors"
                    >
                        View on {primaryProvider.name}
                    </a>
                ) : null}
            </div>
        </div>
    );
};

export default PropertyCard;