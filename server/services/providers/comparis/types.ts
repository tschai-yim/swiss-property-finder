/**
 * Represents the search criteria for a property search.
 * This is part of the request object sent to the Comparis API.
 */
export interface SearchCriteria {
    /**
     * Maximum age of the ad in days.
     * @example 5
     */
    AdAgeMax?: number;
    /**
     * Availability date.
     * @example "01.09.2025 00:00:00"
     */
    AvailableFrom?: string;
    /**
     * Type of deal.
     * 10: Rent
     * 20: Buy
     * @example 10
     */
    DealType: 10 | 20;
    /**
     * Floor search type.
     * 1: Ground Floor
     * 2: Upper Floor
     * 3: Attic
     * @example 2
     */
    FloorSearchType?: 1 | 2 | 3;
    /** @example true */
    HasBalcony?: boolean;
    /** @example true */
    HasDishwasher?: boolean;
    /** @example true */
    HasFireplace?: boolean;
    /** @example true */
    HasLift?: boolean;
    /** @example true */
    HasParking?: boolean;
    /**
     * Minimum living space in square meters.
     * @example 50
     */
    LivingSpaceFrom?: number;
    /**
     * Maximum living space in square meters.
     * @example 300
     */
    LivingSpaceTo?: number;
    /**
     * Search by location name. Can have multiple locations separated by commas.
     * @example "Zürich"
     */
    LocationSearchString?: string;
    /** @example true */
    MinergieCertified?: boolean;
    /** @example true */
    PetsAllowed?: boolean;
    /**
     * Minimum price.
     * @example 500
     */
    PriceFrom?: number;
    /**
     * Maximum price.
     * @example 7000
     */
    PriceTo?: number;
    /**
     * Search radius in whole kilometers (max 20).
     * @example 1
     */
    Radius?: number;
    /**
     * Minimum number of rooms.
     * @example 1.0
     */
    RoomsFrom?: number;
    /**
     * Maximum number of rooms.
     * @example 9.0
     */
    RoomsTo?: number;
    /**
     * Root property types.
     * 1: Apartment
     * 2: Furnished Apartment
     * 3: Shared Flat
     * 4: House
     * 7: Multi-family House
     * 25: Underground Parking
     * @example [3]
     */
    RootPropertyTypes?: (1 | 2 | 3 | 4 | 7 | 25)[];
    /**
     * Sort order. Based on user-provided examples.
     * 1: Price ascending
     * 3: Publication date ascending
     * 4: Move-in date ascending
     * @example 3
     */
    SearchOrderKey?: 1 | 3 | 4;
    /**
     * Trigger for the search.
     * @example "SearchButtonClick"
     */
    SearchTrigger?: 'SearchButtonClick' | 'MapSearch' | 'Paging';
    /**
     * Type of search.
     * 'LocationStringSearch': Search by location name.
     * 'CurrentLocationSearch': Search by coordinates.
     * @example "CurrentLocationSearch"
     */
    SearchType: 'LocationStringSearch' | 'CurrentLocationSearch';
    /** @example true */
    WheelchairAccessible?: boolean;
    /**
     * Center coordinates for the search.
     * @example { "Latitude": 47.3312485, "Longitude": 8.2076733 }
     */
    Center?: {
        Latitude: number;
        Longitude: number;
    };
}

export const MAX_RADIUS_KM = 20;

/**
 * Request object for the `resultlist` endpoint.
 */
export interface ResultListRequest {
    /**
     * The page number to fetch.
     * @example 0
     */
    Page: number;
    SearchCriteria: SearchCriteria;
    Header: {
        /**
         * Language for the response.
         * @example "en"
         */
        Language: 'en' | 'de' | 'fr' | 'it';
        /**
         * Locale for the response.
         * @example "en-GB"
         */
        Locale: string;
    };
}

/**
 * Represents a single ad in the result list.
 */
export interface ResultAd {
    /**
     * Unique identifier for the ad.
     * @example 35711246
     */
    AdId: number;
    /**
     * Main property type ID.
     * 1: Apartment
     * 2: Furnished Apartment
     * 3: Shared Flat
     * 4: House
     * 7: Multi-family House
     * 25: Underground Parking
     * @example 1
     */
    RootPropertyTypeID: number;
    /**
     * Main property type as text.
     * @example "Apartment"
     */
    RootPropertyTypeText: string;
    /**
     * URL for the thumbnail image.
     * @example "https://assets.comparis.ch/image/upload/s--I4JbqOch--/c_fit,f_auto,h_1080,q_auto,w_1080/v1/immobilien/Images/DataCollect/7e5f58d9-1fc7-a70c-df4e-df39e2e4d1a0.jpg"
     */
    ThumbnailImageUrl: string;
    /**
     * Array of image URLs.
     */
    ImageUrls: string[];
    /**
     * Type of deal.
     * 10: Rent
     * @example 10
     */
    DealTypeID: number;
    /**
     * Currency identifier.
     * @example "CHF"
     */
    CurrencyID: string;
    /**
     * Street name and number.
     * @example "Lägernstrasse 22"
     */
    Street: string | null;
    /**
     * City name.
     * @example "Zürich"
     */
    City: string;
    /**
     * Postal code.
     * @example "8037"
     */
    Zip: string;
    /**
     * Price value.
     * @example 1500
     */
    PriceValue: number;
    /**
     * Formatted price text.
     * @example "CHF 1,500"
     */
    PriceValueText: string;
    /**
     * Type of price.
     * 5: Rent per month
     * @example 5
     */
    PriceType: number;
    /**
     * Text representation of the price type.
     * @example "Rent per month"
     */
    PriceTypeText: string;
    /**
     * Number of rooms.
     * @example 1.0
     */
    Rooms: number;
    /**
     * Formatted room text.
     * @example "1 room"
     */
    RoomsText: string;
    /**
     * Area in square meters.
     * @example 26
     */
    Area: number;
    /**
     * Formatted area text.
     * @example "26 m²"
     */
    AreaText: string;
    /**
     * Geographic coordinates of the property.
     */
    GeoCoordinates: {
        /** @example 47.3942474 */
        Latitude: number;
        /** @example 8.5317412 */
        Longitude: number;
    };
    /**
     * Indicates if the address is precise.
     * @example true
     */
    IsAddressDistinct: boolean;
    /**
     * The floor number. Can be null.
     * @example 1
     */
    Floor?: number | null;
    /**
     * Formatted floor text.
     * @example "Floor 1"
     */
    FloorText?: string;
    /**
     * The title of the ad.
     * @example "Urbaner Lifestyle für Singles"
     */
    ContactAdTitle: string;
    /**
     * The date of the last relevant change.
     * @example "11.09.2025 11:35:06"
     */
    LastRelevantChangeDate: string;
    /**
     * A text describing how long the ad has been online.
     * @example "48 minutes online"
     */
    LastRelevantChangeDateText: string;
    /**
     * Name of the partner site where the ad is listed.
     * @example "Properstar"
     */
    ContactAdSiteName: string;
    /**
     * URL of the partner's logo.
     * @example "https://assets.comparis.ch/image/upload/s--k1QUEeSU--/f_auto,q_auto/v1/immobilien/Images/Static/logo_contact_color_site_254.jpg"
     */
    PartnerLogoUrl: string;
    /**
     * Indicates if the ad has a contact form.
     * @example true
     */
    HasContactForm: boolean;
    /**
     * Type of advertiser contact.
     * @example 1
     */
    ContactAdvertiserType: number;
    /**
     * Indicates if one-click contact is supported.
     * @example true
     */
    OneClickContactSupported: boolean;
    /**
     * Status of the ad.
     * @example 0
     */
    AdStatus: number;
    /**
     * URL to the ad on Comparis.
     * @example "https://en.comparis.ch/immobilien/marktplatz/details/show/35711246"
     */
    ComparisUrl: string;
}

/**
 * Response from the `resultlist` endpoint.
 */
export interface ResultListResponse {
    ResultCount: number;
    CurrentPage: number;
    TotalPages: number;
    Ads: ResultAd[];
    AdIdList: number[];
    Header: {
        StatusCode: number;
        DebugMessage: string;
        StatusMessage: string | null;
    };
}

/**
 * Request object for the `details` endpoint.
 */
export interface DetailsRequest {
    AdId: number;
    Header: {
        Language: 'en' | 'de' | 'fr' | 'it';
        Locale: string;
    };
}

/**
 * Represents the detailed information of a property ad. Based on `details.json`.
 */
export interface AdDetails extends Omit<ResultAd, 'ThumbnailImageUrl'> {
    /**
     * Plain text description of the property.
     */
    Description: string;
    /**
     * HTML description of the property.
     */
    DescriptionHtml: string;
    /**
     * Living space in square meters.
     * @example 26
     */
    LivingSpace: number;
    /**
     * Year the property was constructed.
     * @example 1949
     */
    YearOfConstruction: number;
    /**
     * Date of the last change to the ad.
     * @example "11.09.2025 11:44:12"
     */
    ChangeDate: string;
    /**
     * Availability date text. Can be null.
     * @example null
     */
    Availability: string | null;
    /**
     * Comma-separated list of features.
     * @example ""
     */
    Features: string;
    /**
     * Location-specific factors.
     */
    LocationFactors: {
        /**
         * Altitude in meters.
         * @example 440.0
         */
        Height: number;
        /**
         * Average sunshine hours in summer.
         * @example 14
         */
        SunshineHoursSummer: number;
        /**
         * Average sunshine hours in winter.
         * @example 7
         */
        SunshineHoursWinter: number;
    };
    /**
     * URL for the contact form.
     * @example "https://en.comparis.ch/immobilien/contactform/showembedded?embedded=true&id=35711246&source=DetailFormSend&mobileplatformtype=2&nativeTrackingPoint=contactform/"
     */
    ContactFormUrl: string;
    /**
     * URL for Google Street View.
     * @example "https://maps.google.com/maps?q=&layer=c&cbll=47.3942474000,8.5317412000"
     */
    StreetViewUrl: string;
    /**
     * Detailed contact information.
     */
    ContactInformation: {
        FormInformation: {
            Heading: string;
            ContactSiteId: number;
            ContactSiteName: string;
            DefaultContactMessage: string;
        };
        AdvertiserContactInformation: {
            Heading: string;
            Name: string;
            Street: string;
            ZipAndCity: string;
            Phone: string | null;
            MobilePhone: string | null;
            Email: string | null;
        };
        VisitationContactInformation: any | null;
        SourceLinkInformation: {
            Heading: string;
            SourceLinks: {
                Title: string;
                Url: string;
                RedirectClickTrackingUrl: string;
                TargetBrowser: string;
            }[];
        };
    };
    // Other properties from details.json that might be useful
    ExtraCosts: number | null;
    Stories: number | null;
    UsefulArea: number | null;
    BuildingArea: number | null;
    CeilingHeight: number | null;
    IsUnderBuildingLaws: boolean | null;
    Volume: number | null;
}

/**
 * Response from the `details` endpoint.
 */
export interface DetailsResponse {
    Ad: AdDetails;
    Header: {
        StatusCode: number;
        DebugMessage: string;
        StatusMessage: string | null;
    };
}
