import React from 'react';

interface IconProps {
    className?: string;
}

export const BikeIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <i className={`fa-solid fa-bicycle ${className}`}></i>
);

export const TrainIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <i className={`fa-solid fa-train-subway ${className}`}></i>
);

export const CarIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
     <i className={`fa-solid fa-car ${className}`}></i>
);

export const WalkIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <i className={`fa-solid fa-person-walking ${className}`}></i>
);
