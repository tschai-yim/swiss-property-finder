/** Represents a GeoPoint object from the Parse API. */
export interface MeinWGZimmerGeoPoint {
    __type: 'GeoPoint';
    latitude: number;
    longitude: number;
}

/** Represents a Date object from the Parse API. */
export interface MeinWGZimmerDate {
    __type: 'Date';
    iso: string;
}

/** Represents the PrimaryImage object associated with a room listing. */
export interface MeinWGZimmerPrimaryImage {
    /** The unique identifier for the image object itself. */
    objectId: string;
    /** The file ID, which is the crucial part for constructing the public image URL. */
    Fid: string;
    /** A numeric timestamp indicating when the image was last modified. */
    Modified: number;
    createdAt: string;
    updatedAt: string;
    __type: 'Object';
    className: 'RoomImage';
}

/**
 * Represents a single room listing item from the meinwgzimmer.ch API.
 * This interface documents the complete structure based on observed API responses.
 */
export interface MeinWGZimmerResultItem {
    /** The unique identifier for the listing object. */
    objectId: string;
    /** A secondary numeric ID for the room, used in the public detail page URL. */
    RoomNr: number;
    /** The title of the listing. */
    RoomTitle: string;
    /** The monthly rent price in CHF. */
    Price: number;
    /** The street name and number. */
    Street: string;
    /** The postal code. */
    Zip: string;
    /** The city name. */
    City: string;
    /** The latitude coordinate. Redundant with `Location.latitude`. */
    PosLat: number;
    /** The longitude coordinate. Redundant with `Location.longitude`. */
    PosLng: number;
    /** A GeoPoint object containing the latitude and longitude. */
    Location: MeinWGZimmerGeoPoint;
    /** An ISO 8601 timestamp string indicating when the listing was created. */
    createdAt: string;
    /** An ISO 8601 timestamp string indicating when the listing was last updated. */
    updatedAt: string;
    /** Details of the primary image for the listing. Can be `null` if no image is provided. */
    PrimaryImage: MeinWGZimmerPrimaryImage | null;
    /** The size of the individual room in square meters. Can be `null`. */
    RoomSizeSquareMeter: number | null;
    /** The size of the entire flat in square meters. Can be `null`. */
    FlatSizeSquareMeter: number | null;
    /** The total number of roommates in the flat. Can be `null`. */
    FlatSizeRoommates: number | null;
    /** The listing's active status. Should be 'active' for valid listings. */
    Status: 'active' | string;
    /** The date from which the room is available. */
    ValidFrom: MeinWGZimmerDate;
    /** The date until which the offer is valid. Used to filter out short-term rentals. Can be `null`. */
    ValidUntil: MeinWGZimmerDate | null;
    /** The date until which the ad is visible on the platform. */
    VisibleUntil: MeinWGZimmerDate;
    /** The preferred gender of the new tenant ('none', 'female', 'male'). */
    PreferedGender: 'none' | 'female' | 'male';
    /** Indicates if the flat has a balcony. */
    Balcony: 'yes' | 'no' | null;
    /** Indicates if there is garden seating available. */
    GardenSeating: 'yes' | 'no' | null;
    /** Indicates if the flat is wheelchair accessible. */
    WheelChairPossible: 'yes' | 'no' | null;
}

/** Represents the overall structure of the API response. */
export interface MeinWGZimmerResponse {
    results: MeinWGZimmerResultItem[];
}
