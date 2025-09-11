import { PropertyWithoutCommuteTimes } from '@/server/services/providers/providerTypes';
import { Property, GeneralFilters, FilterCriteria, FilterBucket } from '../types';

const checkRange = (value: number | null | undefined, range: { min: string; max: string }) => {
    const min = parseFloat(range.min);
    const max = parseFloat(range.max);

    // If the property has no value for a field (e.g. size), it only matches if the filter is also empty.
    if (value === null || value === undefined) {
        return isNaN(min) && isNaN(max);
    }

    const minOk = isNaN(min) || value >= min;
    const maxOk = isNaN(max) || value <= max;
    return minOk && maxOk;
};

/**
 * Checks if a property matches any of the defined filter buckets.
 * @param property - The property to check.
 * @param filters - The general filter criteria containing the buckets.
 * @returns True if the property matches at least one bucket, or if no buckets are defined.
 */
export const filterByBuckets = (property: PropertyWithoutCommuteTimes, filters: GeneralFilters): boolean => {
    if (filters.buckets.length === 0) return true; // No buckets means no filtering

    // Return true if the property matches ANY of the buckets
    return filters.buckets.some(bucket => {
        // A property can only match a bucket of its own type.
        if (property.type !== bucket.type) {
            return false;
        }

        const priceOk = checkRange(property.price, bucket.price);
        if (!priceOk) return false;

        if (bucket.type === 'property') {
            const roomsOk = checkRange(property.rooms, bucket.rooms);
            const sizeOk = checkRange(property.size, bucket.size);
            return roomsOk && sizeOk;
        } else { // 'sharedFlat'
            const roommatesOk = checkRange(property.roommates, bucket.roommates);
            return roommatesOk;
        }
    });
};

/**
 * Checks if a property passes advanced client-side filters (keywords, duration, gender).
 * This is used by providers that handle bucket filtering on their own.
 * @param property - The property to check.
 * @param filters - The general filter criteria.
 * @returns True if the property passes the advanced filters.
 */
export const matchesAdvancedFilters = (property: PropertyWithoutCommuteTimes, filters: GeneralFilters): boolean => {
    // Keyword Exclusion
    const textToSearch = `${property.title.toLowerCase()} ${property.description?.toLowerCase() || ''}`;
    const keywords = filters.exclusionKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.some(k => textToSearch.includes(k))) {
        return false;
    }

    // Rental Duration
    if (filters.rentalDuration === 'permanent' && property.rentalDuration === 'temporary') {
        return false;
    }
    if (filters.rentalDuration === 'temporary' && property.rentalDuration !== 'temporary') {
        return false;
    }
    
    // Gender Preference (only applies to shared flats)
    if (property.type === 'sharedFlat') {
        const pref = filters.genderPreference;
        if (pref === 'male' && property.genderPreference === 'female') return false;
        if (pref === 'female' && property.genderPreference === 'male') return false;
    }
    
    return true;
};

/**
 * Checks if a property passes all general client-side filters (keywords, duration, gender, buckets).
 * @param property - The property to check.
 * @param filters - The general filter criteria.
 * @returns True if the property passes all general filters.
 */
export const matchesGeneralFilters = (property: PropertyWithoutCommuteTimes, filters: GeneralFilters): boolean => {
    if (!matchesAdvancedFilters(property, filters)) {
        return false;
    }
    
    // Finally, check buckets
    return filterByBuckets(property as Property, filters);
};


/**
 * Checks if an enriched property passes the travel time filters.
 * @param property - The property, which must have travel time fields populated.
 * @param filters - The full filter criteria.
 * @returns True if the property's travel time is within the allowed maximums for any selected travel mode.
 */
export const matchesTravelFilters = (property: Property, filters: FilterCriteria): boolean => {
    // If no destination is set or no travel modes are selected, travel filters are not applicable.
    if (!filters.destination || filters.travelModes.length === 0) {
        return true;
    }

    // Check if the property's travel time for ANY of the selected modes is within the user's limit.
    return filters.travelModes.some(mode => {
        const maxTime = parseInt(filters.maxTravelTimes[mode], 10);
        if (isNaN(maxTime) || maxTime <= 0) return false;
        
        const propertyTime = property.commuteTimes[mode];
        return propertyTime != null && propertyTime <= maxTime;
    });
};

/**
 * A more specific filter function that checks if a property matches a single bucket,
 * in addition to the advanced filters.
 * @param property The property to check.
 * @param filters The general filters (for advanced criteria).
 * @param bucket The specific bucket to match against.
 * @returns True if the property matches.
 */
export const filterProperty = (property: PropertyWithoutCommuteTimes, filters: GeneralFilters, bucket: FilterBucket): boolean => {
    if (!matchesAdvancedFilters(property, filters)) {
        return false;
    }

    if (property.type !== bucket.type) {
        return false;
    }

    const priceOk = checkRange(property.price, bucket.price);
    if (!priceOk) return false;

    if (bucket.type === 'property') {
        const roomsOk = checkRange(property.rooms, bucket.rooms);
        const sizeOk = checkRange(property.size, bucket.size);
        return roomsOk && sizeOk;
    } else { // 'sharedFlat'
        const roommatesOk = checkRange(property.roommates, bucket.roommates);
        return roommatesOk;
    }
};