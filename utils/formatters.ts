import { FilterBucket } from '../types';

export const formatMapPrice = (price: number, useFullNumberFormat: boolean): string => {
    if (useFullNumberFormat) {
        return price.toLocaleString('en-US');
    }

    if (price < 1000) {
        return price.toLocaleString('en-US');
    }

    const priceInK = price / 1000;
    
    if (priceInK < 10) {
        // e.g., 1.2k, 9.9k, 2.0k
        return `${priceInK.toFixed(1)}k`;
    }
    
    // e.g., 10k, 125k
    return `${Math.round(priceInK)}k`;
};

export const formatTravelTime = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined) return '-';

    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours} hr`;
    }
    return `${hours} hr ${remainingMinutes} min`;
};

export const formatDistance = (km: number | null | undefined): string => {
    if (km === null || km === undefined) return '-';
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
};

export const summarizeBucket = (bucket: FilterBucket): string => {
    const parts: string[] = [];
    
    // Price is common to both
    if(bucket.price.min && bucket.price.max) parts.push(`${bucket.price.min}-${bucket.price.max} CHF`);
    else if(bucket.price.min) parts.push(`≥${bucket.price.min} CHF`);
    else if(bucket.price.max) parts.push(`≤${bucket.price.max} CHF`);

    if (bucket.type === 'property') {
        if(bucket.rooms.min && bucket.rooms.max) parts.push(`${bucket.rooms.min}-${bucket.rooms.max} rms`);
        else if(bucket.rooms.min) parts.push(`≥${bucket.rooms.min} rms`);
        else if(bucket.rooms.max) parts.push(`≤${bucket.rooms.max} rms`);

        if(bucket.size.min && bucket.size.max) parts.push(`${bucket.size.min}-${bucket.size.max} m²`);
        else if(bucket.size.min) parts.push(`≥${bucket.size.min} m²`);
        else if(bucket.size.max) parts.push(`≤${bucket.size.max} m²`);
    } else { // 'sharedFlat'
        if(bucket.roommates.min && bucket.roommates.max) parts.push(`${bucket.roommates.min}-${bucket.roommates.max} mates`);
        else if(bucket.roommates.min) parts.push(`≥${bucket.roommates.min} mates`);
        else if(bucket.roommates.max) parts.push(`≤${bucket.roommates.max} mates`);
    }

    if (parts.length === 0) {
        return bucket.type === 'property' ? "Any Property" : "Any Shared Flat";
    }
    return parts.slice(0, 2).join(', ');
};

export const formatRelativeTime = (date: Date | undefined): string => {
    if (!date || isNaN(date.getTime())) {
        return '-';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'in the future';

    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays <= 30) return `${diffDays}d`;
    
    const diffMonths = Math.round(diffDays / 30.44); // Average days in month
    if (diffMonths <= 12) return `${diffMonths}mo`;

    return `${Math.round(diffDays / 365.25)}y`;
};