import React, { useState } from 'react';
import { Property, FilterCriteria, SortBy } from '../../types';
import { InfoIcon } from './InfoIcon';
import { PrimaryMetricDisplay } from './PrimaryMetricDisplay';
import { DistanceDisplay } from './DistanceDisplay';
import { ActionButtons } from './ActionButtons';
import { formatRelativeTime } from '../../utils/formatters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faChevronLeft, faChevronRight, faImage, faTrashCanArrowUp, faBan, faUsers, faDoorOpen, faRulerCombined } from '@fortawesome/free-solid-svg-icons';
import { PropertyWithoutCommuteTimes } from '@/server/services/providers/providerTypes';

interface PropertyCardProps {
    property: Property | PropertyWithoutCommuteTimes;
    isSelected: boolean;
    travelModes: FilterCriteria['travelModes'];
    sortBy: SortBy;
    destinationCoords: { lat: number; lng: number } | null;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
    onEnrich: (id: string) => void;
    onExclude?: (property: PropertyWithoutCommuteTimes) => void;
    onRestore?: (property: PropertyWithoutCommuteTimes) => void;
    onFocus?: (property: PropertyWithoutCommuteTimes) => void;
    isExcludedView?: boolean;
}

const CreationDateDisplay: React.FC<{ createdAt: Date | undefined, sortBy: SortBy }> = ({ createdAt, sortBy }) => (
    <InfoIcon>
        <FontAwesomeIcon icon={faCalendarPlus} className="h-5 w-5 mr-1.5 text-gray-500" />
        <span className={sortBy === 'latest' ? 'font-bold' : ''}>{formatRelativeTime(createdAt)}</span>
    </InfoIcon>
);


const PropertyCard: React.FC<PropertyCardProps> = ({ property, isSelected, travelModes, sortBy, destinationCoords, onSelect, onHover, onEnrich, onExclude, onRestore, onFocus, isExcludedView = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const imageUrls = property.imageUrls ?? [];
    const hasImages = imageUrls.length > 0;
    const hasMultipleImages = imageUrls.length > 1;

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
    };
    
    return (
        <div
            id={`property-${property.id}`}
            className={`relative bg-white rounded-xl shadow-md transition-all duration-300 flex flex-col group/card ${isExcludedView ? 'cursor-pointer' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'} ${isSelected ? 'ring-2 ring-rose-500' : 'ring-1 ring-gray-200'}`}
            onClick={() => (isExcludedView && onFocus) ? onFocus(property) : onSelect(property.id)}
            onMouseEnter={() => onHover(property.id)}
            onMouseLeave={() => onHover(null)}
        >
            {hasImages ? (
                <div className="relative group/image-gallery h-48 w-full rounded-t-xl overflow-hidden">
                    <img className="h-full w-full object-cover" src={imageUrls[currentImageIndex]} alt={property.title} />
                    {hasMultipleImages && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute top-1/2 left-2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full h-8 w-8 flex items-center justify-center opacity-0 group-hover/image-gallery:opacity-100 transition-opacity hover:bg-opacity-75 focus:outline-none"
                                aria-label="Previous image"
                            >
                               <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute top-1/2 right-2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full h-8 w-8 flex items-center justify-center opacity-0 group-hover/image-gallery:opacity-100 transition-opacity hover:bg-opacity-75 focus:outline-none"
                                aria-label="Next image"
                            >
                               <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                                {imageUrls.slice(0, 5).map((_, index) => ( // Show max 5 dots
                                    <div key={index} className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/60'}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="h-48 w-full rounded-t-xl bg-gray-200 flex items-center justify-center">
                    <FontAwesomeIcon icon={faImage} className="text-gray-400 text-5xl" />
                </div>
            )}
            <div className="p-3 flex flex-col flex-grow">
                {/* Top content: Price, Title, Address */}
                <div>
                     <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-rose-500">CHF {property.price.toLocaleString()}/month</p>
                        {isExcludedView && onRestore ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRestore(property); }}
                                title="Restore this listing to search results"
                                className="text-gray-400 hover:text-green-600 transition-colors opacity-0 group-hover/card:opacity-100 focus:opacity-100"
                                aria-label="Restore listing"
                            >
                                <FontAwesomeIcon icon={faTrashCanArrowUp} />
                            </button>
                        ) : !isExcludedView && onExclude ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onExclude(property); }}
                                title="Exclude this listing from all future searches"
                                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100 focus:opacity-100"
                                aria-label="Exclude listing"
                            >
                                <FontAwesomeIcon icon={faBan} />
                            </button>
                        ) : null}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-gray-900 truncate" title={property.title}>{property.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{property.address}</p>
                </div>
                
                {/* Bottom content: Details and Link (pushed to bottom) */}
                <div className="mt-auto pt-3">
                    <div className="flex justify-around items-center">
                        {property.type === 'sharedFlat' ? (
                            <InfoIcon>
                                <FontAwesomeIcon icon={faUsers} className="h-5 w-5 mr-1.5 text-gray-500" />
                                {property.roommates != null ? `${property.roommates} flatmates` : '-'}
                            </InfoIcon>
                        ) : (
                             <InfoIcon>
                                <FontAwesomeIcon icon={faDoorOpen} className="h-5 w-5 mr-1.5 text-gray-500" />
                                {property.rooms} rooms
                            </InfoIcon>
                        )}
                        <InfoIcon>
                            <FontAwesomeIcon icon={faRulerCombined} className="h-5 w-5 mr-1.5 text-gray-500" />
                            {property.size && property.size > 0 ? `${property.size} m²` : '-'}
                        </InfoIcon>

                        {!('commuteTimes' in property) ? (
                            <DistanceDisplay
                                propertyCoords={{ lat: property.lat, lng: property.lng }}
                                destinationCoords={destinationCoords}
                                sortBy={sortBy}
                            />
                        ) : (
                            <PrimaryMetricDisplay
                                property={property}
                                travelModes={travelModes}
                                sortBy={sortBy}
                                onHover={() => onEnrich(property.id)}
                            />
                        )}
                         
                         {(sortBy === 'distance' && !isExcludedView) && destinationCoords ? (
                            <DistanceDisplay
                                propertyCoords={{ lat: property.lat, lng: property.lng }}
                                destinationCoords={destinationCoords}
                                sortBy={sortBy}
                            />
                        ) : (
                            <CreationDateDisplay createdAt={property.createdAt ? new Date(property.createdAt) : undefined} sortBy={sortBy} />
                        )}
                    </div>
                </div>

                <ActionButtons 
                    providers={property.providers}
                    propertyCoords={{ lat: property.lat, lng: property.lng }}
                    destinationCoords={destinationCoords}
                />
            </div>
        </div>
    );
};

export default PropertyCard;