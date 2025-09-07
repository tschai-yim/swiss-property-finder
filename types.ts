export interface PropertyProviderInfo {
    name: string;
    url: string;
}

export interface Property {
  id: string;
  providers: PropertyProviderInfo[];
  title: string;
  description?: string; // New: For keyword searches
  price: number;
  rooms: number;
  size: number | null;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string;
  imageUrls: string[];
  travelTimeBike?: number | null;
  travelTimePublic?: number | null;
  travelTimeCar?: number | null;
  travelTimeWalk?: number | null;
  createdAt?: string;

  // New: Fields for advanced filtering
  type: 'property' | 'sharedFlat';
  roommates?: number | null;
  rentalDuration?: 'permanent' | 'temporary';
  genderPreference?: 'any' | 'male' | 'female';
}

export interface FilterBucket {
  id: string;
  type: 'property' | 'sharedFlat'; // New
  price: { min: string; max: string };
  rooms: { min: string; max: string }; // For 'property' type
  size: { min: string; max: string };  // For 'property' type
  roommates: { min: string; max: string }; // For 'sharedFlat' type
}

export type FilterType = 'price' | 'rooms' | 'size' | 'commute';

export type TravelMode = 'public' | 'bike' | 'car' | 'walk';

// New: Define general filters separately
export interface GeneralFilters {
  buckets: FilterBucket[];
  exclusionKeywords: string;
  genderPreference: 'any' | 'male' | 'female';
  rentalDuration: 'permanent' | 'temporary';
}

// New: Define travel-specific filters separately
export interface TravelFilters {
  destination: string;
  maxTravelTimes: { [key in TravelMode]: string };
  travelModes: TravelMode[];
}

// Updated: The main filter object used by the UI combines both
export interface FilterCriteria extends GeneralFilters, TravelFilters {}


export interface IsochroneData {
  mode: TravelMode;
  polygon: number[][];
}

export interface SearchMetadata {
  filteredResults: number;
  destinationCoords: { lat: number; lng: number } | null;
  searchLocations: string[];
  isochrones?: IsochroneData[];
}

export type SortBy = 
  | 'latest'
  | 'travelTime' 
  | 'priceAsc' 
  | 'priceDesc' 
  | 'distance'
  | 'travelTimePublic'
  | 'travelTimeBike'
  | 'travelTimeCar'
  | 'travelTimeWalk';

export interface BoundingBox {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
}

export interface City {
    name: string;
    bbox: BoundingBox;
}

export interface DebugConfig {
  enabled: boolean;
  requestLimit: number;
  enabledProviders: string[];
  queryPublicTransport: boolean;
}

export type SearchEvent =
  | { type: 'progress'; message: string }
  | { type: 'properties'; properties: Property[] }
  | { type: 'metadata'; metadata: Partial<SearchMetadata> };

