import { Property, City, BoundingBox, GeneralFilters } from '../../types';

export interface RequestManager {
    count: number;
    limit: number;
}

export interface SearchContext {
    filters: GeneralFilters;
    places: City[]; // A list of candidate cities/towns in the reachable area
    overallBoundingBox: BoundingBox | null; // The bounding box of the entire reachable area
    createdSince?: Date;
}

export interface PropertyProvider {
    name: string;
    fetchProperties: (
        context: SearchContext, 
        requestManager: RequestManager
    ) => AsyncGenerator<Property[]>;
}