import { Property, PropertyProviderInfo } from '../../types';
import { calculateDistance } from '../geoUtils';

/**
 * A set of heuristics to determine if two property listings are likely duplicates.
 * This version is more lenient to account for minor changes in re-listed properties.
 * @returns True if the properties are considered duplicates.
 */
export const areDuplicates = (p1: Property, p2: Property): boolean => {
    // Both must have valid coordinates to be compared.
    if (!p1.lat || !p1.lng || !p2.lat || !p2.lng) {
        return false;
    }
    
    // Heuristic 1: Must be geographically very close (e.g., within 75 meters).
    const distance = calculateDistance(p1, p2);
    if (distance > 0.075) { // 75 meters
        return false;
    }
    
    // Heuristic 2: Price must be very similar.
    const priceDiff = Math.abs(p1.price - p2.price);
    // Allow up to a 5% difference or 50 CHF, whichever is larger.
    const priceThreshold = Math.max(p1.price * 0.05, 50); 
    if (priceDiff > priceThreshold) {
        return false;
    }
    
    // Heuristic 3: Must have the same number of rooms. This is a strong indicator.
    if (p1.rooms !== p2.rooms) {
        return false;
    }

    // Heuristic 4: If both listings provide a size, it should be similar.
    if (p1.size && p2.size && p1.size > 0 && p2.size > 0) {
        const sizeDiff = Math.abs(p1.size - p2.size);
        if (sizeDiff > 10) { // Allow up to a 10m² difference.
            return false;
        }
    }
    
    // If all checks pass, they are very likely duplicates.
    return true;
};

/**
 * Merges two duplicate property listings into a single, more complete listing.
 * @returns A new, merged `Property` object.
 */
export const mergeTwoProperties = (p1: Property, p2: Property): Property => {
    // Choose the primary property based on which has more images (heuristic for better data).
    const primary = p1.imageUrls.length >= p2.imageUrls.length ? p1 : p2;
    const secondary = primary === p1 ? p2 : p1;

    const mergedProperty = { ...primary };

    // Combine providers, ensuring no duplicates by name.
    const allProviders = [...primary.providers, ...secondary.providers];
    const uniqueProvidersMap = new Map<string, PropertyProviderInfo>();
    allProviders.forEach(provider => {
        if (!uniqueProvidersMap.has(provider.name)) {
            uniqueProvidersMap.set(provider.name, provider);
        }
    });
    
    const finalProviders = Array.from(uniqueProvidersMap.values());

    // Ensure the primary provider is listed first.
    const primaryProviderName = primary.providers[0].name;
    const primaryIndex = finalProviders.findIndex(p => p.name === primaryProviderName);
    if (primaryIndex > 0) {
        const [providerToMove] = finalProviders.splice(primaryIndex, 1);
        finalProviders.unshift(providerToMove);
    }
    
    mergedProperty.providers = finalProviders;

    // Fill in missing information from the secondary property.
    if (!mergedProperty.size && secondary.size) {
        mergedProperty.size = secondary.size;
    }
    if (!mergedProperty.createdAt || (secondary.createdAt && secondary.createdAt < mergedProperty.createdAt)) {
        mergedProperty.createdAt = secondary.createdAt;
    }
    
    // Create a combined, stable ID from all component IDs for React keys.
    const allComponentIds = [...p1.id.split('+'), ...p2.id.split('+')];
    mergedProperty.id = [...new Set(allComponentIds)].sort().join('+');

    return mergedProperty;
};