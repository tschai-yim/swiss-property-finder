/**
 * Represents a single property listing from the weegee.ch search API.
 * This is the "stub" object, which may be enriched with details later.
 */
export interface WeegeeListing {
    /** The unique identifier for the listing. Example: "ChDS.zy5n" */
    public_id: string;
    /** The monthly rent price in CHF. Example: 920 */
    price: number;
    /** 
     * A short, plain-text extract from the full description.
     * Example: "Wir suchen ein*w Mitbewohner*in zwischen 20-30, die gerne Hunde mag."
     */
    text_description_extract: string | null;
    /** The city name. Example: "Bern" */
    address_locality: string;
    /** The postal code. Example: "3014" */
    address_postalcode: string;
    /** The street name and number. Can be null. Example: "Winkelriedstrasse 55" */
    address_street: string | null;
    /** The living space of the room in square meters. Can be null. Example: 20 */
    characteristics_livingspace: number | null;
    /** 
     * The URL for the main thumbnail image. Note: Often starts with "//" and needs prefixing with "https://".
     * Example: "//media.weegee.ch/weegee/6RyQ5Judvh.jpeg"
     */
    main_image: string;
    /** 
     * The relative URL path to the listing's detail page. Needs prefixing with the base URL.
     * Example: "/en/wg/winkelriedstrasse-55-3014-bern/ChDS.zy5n"
     */
    detail_url: string;
    /** An array of all image URLs for the listing. This is added after fetching the detail page. */
    pictures?: string[];
    /** A human-readable string indicating when the listing was created. Example: "3 days" */
    created: string;
    /** A machine-readable object indicating when the listing was created. Used for precise date calculation. */
    created_raw: {
        unit: 'minute' | 'hour' | 'day' | 'week' | string;
        value: number;
    };
    /** A human-readable availability start date. Example: "15. Oct 2025" */
    available_from: string | null;
     /** A machine-readable availability start date (YYYY-MM-DD). Example: "2025-10-15" */
    available_from_raw: string | null;
    /** An array of keywords classifying the property (e.g., "balcony", "furnished", "women_only"). */
    classifications: string[];
    /** An array of source platforms for the listing (e.g., "weegee", "flatfox"). */
    platforms: string[];
    /** A de-duplicated array of source platforms. */
    platforms_unique: string[];
    /** A legacy field, always observed as null. */
    description_extract: null;
}

/** Represents the overall structure of the Weegee search API response. */
export interface WeegeeResponse {
    /** The array of property listing stubs. */
    listings: WeegeeListing[];
    /** The total number of pages available for the current search query. */
    num_pages: number;
    /** The total number of listings found for the current search query. */
    num_listings: number;
    /** The name of the location that was searched. Example: "City of Bern" */
    location_name: string;
}

/**
 * Represents the detailed properties of a listing fetched from its detail page JSON.
 * This contains the full set of data available for a property.
 */
export interface WeegeeDetailListingProperties {
    /** The precise latitude coordinate of the property. Example: 46.9637105 */
    address_lat: number;
    /** The city name. Example: "Bern" */
    address_locality: string;
    /** The precise longitude coordinate of the property. Example: 7.457867999999999 */
    address_lon: number;
    /** The postal code. Example: "3014" */
    address_postalcode: string;
    /** The street name and number. Example: "Winkelriedstrasse 55" */
    address_street: string;
    /** The start date of availability. Can be null. */
    available_from: string | null;
    /** The end date of availability for temporary listings. Can be null for permanent rentals. Example: null */
    available_to: string | null;
    /** Flag indicating if the flat has a balcony. */
    balcony: boolean;
    /** The living space of the room in square meters. Example: 20 */
    characteristics_livingspace: number | null;
    /** An array of keywords classifying the property. */
    classifications: string[];
    /** A machine-readable object indicating when the listing was created. This overwrites the string version from the stub. */
    created: {
        unit: 'day' | string;
        value: number;
    };
    /** Flag indicating if the room is furnished. */
    furnished: boolean;
    /** Flag indicating if there is a garden. */
    garden: boolean;
    /** An array of all full-resolution image URLs for the listing. */
    pictures: string[];
    /** An array of source platforms for the listing. */
    platforms: string[];
    /** A de-duplicated array of source platforms. */
    platforms_unique: string[];
    /** The monthly rent price in CHF. Example: 920 */
    price: number;
    /** The unique identifier for the listing. Example: "ChDS.zy5n" */
    public_id: string;
    /** A flag indicating if the rental is temporary/short-term. */
    temporarily: boolean;
    /** The full, HTML-annotated description of the listing. */
    text_description_annotated: string;
    /** A short, plain-text extract from the full description. */
    text_description_extract: string;
    /** A flag indicating if the flatshare is for women only. */
    women_only: boolean;
}

/**
 * Represents a listing object after it has been enriched with data from its detail page.
 * This type combines the initial stub data with the full detail data, resolving any conflicts
 * (e.g., `created` becomes an object instead of a string).
 */
export type EnrichedWeegeeListing = Omit<WeegeeListing, 'created'> & WeegeeDetailListingProperties;


/** Represents the structure of the JSON response from a listing's detail page. */
export interface WeegeeDetailResponse {
    pageProps: {
        listing: WeegeeDetailListingProperties;
    };
}
