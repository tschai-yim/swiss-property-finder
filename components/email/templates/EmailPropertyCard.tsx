import React from 'react';
import { Property } from '../../../types';
import { formatTravelTime, formatRelativeTime, formatDistance } from '../../../utils/formatters';
import { calculateDistance } from '../../../services/geoUtils';

interface EmailPropertyCardProps {
    property: Property;
    destinationCoords: { lat: number; lng: number } | null;
}

const InfoIcon: React.FC<{ iconClass: string; children: React.ReactNode }> = ({ iconClass, children }) => (
    <div className="flex items-center text-sm text-gray-600">
        <span className="inline-flex justify-center items-center w-5 h-5 mr-1.5">
            <i className={`${iconClass} text-gray-500 text-base`}></i>
        </span>
        {children}
    </div>
);

const HorizontalTravelTimes: React.FC<{ property: Property }> = ({ property }) => {
    const travelTimeMap = [
        { mode: 'public', time: property.travelTimePublic, iconClass: 'fa-solid fa-train-subway' },
        { mode: 'bike', time: property.travelTimeBike, iconClass: 'fa-solid fa-bicycle' },
        { mode: 'car', time: property.travelTimeCar, iconClass: 'fa-solid fa-car' },
        { mode: 'walk', time: property.travelTimeWalk, iconClass: 'fa-solid fa-person-walking' },
    ];

    return (
        <div className="flex flex-wrap justify-around items-center text-xs text-gray-700 mt-3 pt-3 border-t border-gray-200">
            {travelTimeMap.map(({ mode, time, iconClass }) => (
                 <div key={mode} className="flex items-center mx-2 my-1">
                    <span className="inline-flex justify-center items-center w-5 h-5 mr-1">
                        <i className={`${iconClass} text-gray-500 text-sm`}></i>
                    </span>
                    <span className="font-semibold">{formatTravelTime(time)}</span>
                </div>
            ))}
        </div>
    );
};

export const EmailPropertyCard: React.FC<EmailPropertyCardProps> = ({ property, destinationCoords }) => {
    if (!property.providers || property.providers.length === 0) return null;

    const googleMapsUrl = destinationCoords
        ? `https://www.google.com/maps/dir/?api=1&origin=${property.lat},${property.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=transit`
        : null;
    
    const distance = destinationCoords ? calculateDistance({ lat: property.lat, lng: property.lng }, destinationCoords) : null;

    return (
        <div className="bg-white rounded-xl shadow-md flex flex-col ring-1 ring-gray-200 overflow-hidden">
            {property.imageUrl ? (
                <a href={property.providers[0].url} target="_blank" rel="noopener noreferrer">
                    <img className="h-48 w-full object-cover" src={property.imageUrl} alt={property.title} />
                </a>
            ) : (
                <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                    <i className="fa-solid fa-image text-gray-400 text-5xl"></i>
                </div>
            )}
            <div className="p-3 flex flex-col flex-grow">
                <div>
                    <p className="text-sm font-semibold text-rose-500">CHF {property.price.toLocaleString()}/month</p>
                    <a href={property.providers[0].url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-gray-900 hover:underline block line-clamp-2 text-ellipsis" title={property.title}>
                        {property.title}
                    </a>
                    <p className="text-sm text-gray-500 truncate">{property.address}</p>
                </div>
                
                <div className="mt-auto pt-3">
                     <div className="flex justify-around items-center">
                        {property.type === 'sharedFlat' ? (
                            <InfoIcon iconClass="fa-solid fa-users">
                                {property.roommates != null ? `${property.roommates} flatmates` : '-'}
                            </InfoIcon>
                        ) : (
                            <InfoIcon iconClass="fa-solid fa-door-open">{property.rooms} rooms</InfoIcon>
                        )}
                        <InfoIcon iconClass="fa-solid fa-ruler-combined">{property.size ? `${property.size} m²` : '-'}</InfoIcon>
                         <InfoIcon iconClass="fa-solid fa-calendar-plus">{formatRelativeTime(property.createdAt)}</InfoIcon>
                        {distance !== null && (
                            <InfoIcon iconClass="fa-solid fa-location-arrow">{formatDistance(distance)}</InfoIcon>
                        )}
                    </div>
                    {destinationCoords && <HorizontalTravelTimes property={property} />}
                </div>

                 <div className="mt-3 flex flex-wrap gap-2">
                    {property.providers.map(provider => (
                         <a
                            key={provider.name}
                            href={provider.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-grow text-center bg-rose-500 text-white font-bold py-2 px-2 rounded-lg hover:bg-rose-600 text-sm flex items-center justify-center"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square mr-1.5"></i>
                            <span className="truncate">{provider.name}</span>
                        </a>
                    ))}
                    {googleMapsUrl && (
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-grow text-center bg-gray-600 text-white font-bold py-2 px-2 rounded-lg hover:bg-gray-700 text-sm flex items-center justify-center"
                        >
                            <i className="fa-solid fa-route mr-1.5"></i>
                            <span>Route</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};