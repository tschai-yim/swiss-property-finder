import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBicycle, faTrainSubway, faCar, faPersonWalking } from '@fortawesome/free-solid-svg-icons';

interface IconProps {
    className?: string;
}

export const BikeIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <FontAwesomeIcon icon={faBicycle} className={className} />
);

export const TrainIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <FontAwesomeIcon icon={faTrainSubway} className={className} />
);

export const CarIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <FontAwesomeIcon icon={faCar} className={className} />
);

export const WalkIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <FontAwesomeIcon icon={faPersonWalking} className={className} />
);
