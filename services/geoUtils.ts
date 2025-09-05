import { BoundingBox } from '../types';

/**
 * Checks if a geographical point is inside a polygon.
 * Uses the ray-casting algorithm.
 * @param point The point to check, with lat and lng.
 * @param polygon An array of [lng, lat] coordinates defining the polygon.
 * @returns True if the point is inside the polygon, false otherwise.
 */
export const isPointInPolygon = (point: { lat: number; lng: number }, polygon: number[][]): boolean => {
    const { lat, lng } = point;
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [lngi, lati] = polygon[i];
        const [lngj, latj] = polygon[j];

        const intersect = ((lati > lat) !== (latj > lat))
            && (lng < (lngj - lngi) * (lat - lati) / (latj - lati) + lngi);

        if (intersect) {
            isInside = !isInside;
        }
    }

    return isInside;
};

/**
 * Calculates the bounding box of a single polygon.
 * @param polygon An array of [lng, lat] coordinates.
 * @returns A BoundingBox object.
 */
export const getPolygonBoundingBox = (polygon: number[][]): BoundingBox => {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

    for (const [lng, lat] of polygon) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }

    return { minLng, maxLng, minLat, maxLat };
};

/**
 * Merges multiple bounding boxes into a single one that encompasses all of them.
 * @param bboxes An array of BoundingBox objects.
 * @returns A single, merged BoundingBox object.
 */
export const mergeBoundingBoxes = (bboxes: BoundingBox[]): BoundingBox => {
    return bboxes.reduce((acc, box) => ({
        minLng: Math.min(acc.minLng, box.minLng),
        maxLng: Math.max(acc.maxLng, box.maxLng),
        minLat: Math.min(acc.minLat, box.minLat),
        maxLat: Math.max(acc.maxLat, box.maxLat),
    }), { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity });
};

/**
 * Expands a bounding box by a given padding in kilometers.
 * @param bbox The BoundingBox to pad.
 * @param paddingKm The padding to add in kilometers.
 * @returns A new, larger BoundingBox object.
 */
export const padBoundingBox = (bbox: BoundingBox, paddingKm: number): BoundingBox => {
    if (paddingKm <= 0) return bbox;

    // Rough conversion: 1 degree latitude is ~111km. 1 degree longitude is ~111km * cos(latitude).
    const latPadding = paddingKm / 111.0;
    
    // Calculate longitude padding based on the average latitude of the box to be more accurate.
    const avgLatRad = ((bbox.minLat + bbox.maxLat) / 2) * (Math.PI / 180);
    const lngPadding = paddingKm / (111.0 * Math.cos(avgLatRad));

    return {
        minLng: bbox.minLng - lngPadding,
        maxLng: bbox.maxLng + lngPadding,
        minLat: bbox.minLat - latPadding,
        maxLat: bbox.maxLat + latPadding,
    };
};

/**
 * Checks if a geographical point is inside a bounding box.
 * @param point The point to check, with lat and lng.
 * @param bbox The BoundingBox to check against.
 * @returns True if the point is inside the box, false otherwise.
 */
export const isPointInBoundingBox = (point: { lat: number; lng: number }, bbox: BoundingBox): boolean => {
    return (
        point.lng >= bbox.minLng &&
        point.lng <= bbox.maxLng &&
        point.lat >= bbox.minLat &&
        point.lat <= bbox.maxLat
    );
};

/**
 * Checks if two bounding boxes intersect.
 * @param boxA The first BoundingBox.
 * @param boxB The second BoundingBox.
 * @returns True if the boxes intersect, false otherwise.
 */
export const doBoundingBoxesIntersect = (boxA: BoundingBox, boxB: BoundingBox): boolean => {
    return (
        boxA.minLng <= boxB.maxLng &&
        boxA.maxLng >= boxB.minLng &&
        boxA.minLat <= boxB.maxLat &&
        boxA.maxLat >= boxB.minLat
    );
};

/**
 * Approximates if a polygon intersects with a bounding box.
 * This is not a perfect geometric intersection but is a very good and fast approximation.
 * It checks for:
 * 1. Intersection of their respective bounding boxes.
 * 2. If any corner of the bbox is inside the polygon.
 * 3. If any vertex of the polygon is inside the bbox.
 * @param polygon An array of [lng, lat] coordinates.
 * @param bbox The BoundingBox to check for intersection.
 * @returns True if an intersection is likely, false otherwise.
 */
export const doesPolygonIntersectBoundingBox = (polygon: number[][], bbox: BoundingBox): boolean => {
    // 1. Quick check for bounding box intersection.
    const polygonBbox = getPolygonBoundingBox(polygon);
    if (!doBoundingBoxesIntersect(polygonBbox, bbox)) {
        return false;
    }

    // 2. Check if any corner of the bbox is inside the polygon.
    const bboxCorners = [
        { lng: bbox.minLng, lat: bbox.minLat },
        { lng: bbox.minLng, lat: bbox.maxLat },
        { lng: bbox.maxLng, lat: bbox.maxLat },
        { lng: bbox.maxLng, lat: bbox.minLat },
    ];
    for (const corner of bboxCorners) {
        if (isPointInPolygon(corner, polygon)) {
            return true;
        }
    }

    // 3. Check if any vertex of the polygon is inside the bbox.
    for (const [lng, lat] of polygon) {
        if (isPointInBoundingBox({ lat, lng }, bbox)) {
            return true;
        }
    }
    
    // 4. If none of the above, they do not intersect in a way we can easily detect.
    // This is a reasonable approximation that avoids expensive edge-intersection checks.
    return false;
};

/**
 * Calculates the great-circle distance between two points on the Earth using the Haversine formula.
 * @param p1 Point 1 { lat, lng }.
 * @param p2 Point 2 { lat, lng }.
 * @returns The distance in kilometers.
 */
export const calculateDistance = (p1: { lat: number, lng: number }, p2: { lat: number, lng: number }): number => {
    if (!p1 || !p2) return Infinity;

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
    const lat1Rad = p1.lat * (Math.PI / 180);
    const lat2Rad = p2.lat * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
};