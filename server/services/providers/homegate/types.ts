/** Represents the geographic coordinates of a listing. */
export interface HomegateGeoCoordinates {
  accuracy: 'HIGH' | 'MEDIUM' | 'LOW';
  latitude: number;
  longitude: number;
}

/** Represents the address details of a listing. */
export interface HomegateAddress {
  geoCoordinates: HomegateGeoCoordinates;
  locality: string;
  postalCode: string;
  street: string;
}

/** Represents the characteristics of the property. */
export interface HomegateCharacteristics {
  isWheelchairAccessible?: boolean;
  livingSpace?: number;
  numberOfRooms: number;
  floor?: number;
  yearBuilt?: number;
  hasBalcony?: boolean;
}

/** Represents an image or document attachment for a listing. */
export interface HomegateAttachment {
  file: string;
  type: 'IMAGE' | 'DOCUMENT';
  title: string;
  url: string;
}

/** Represents the localized text content for a listing. */
export interface HomegateLocalizedText {
  title: string;
  description: string;
}

/** Represents all localized content for a specific language. */
export interface HomegateLocalizationContent {
  urls: any[]; // The example shows this as empty, type is unknown.
  text: HomegateLocalizedText;
  attachments: HomegateAttachment[];
  isMachineTranslated: boolean;
}

/** Contains all available localizations for a listing. */
export interface HomegateLocalization {
  de: HomegateLocalizationContent;
  en: HomegateLocalizationContent;
  it: HomegateLocalizationContent;
  fr: HomegateLocalizationContent;
  primary: 'de' | 'en' | 'it' | 'fr';
}

/** Metadata for the listing, such as creation date. */
export interface HomegateMeta {
  createdAt: string; // ISO 8601 timestamp
}

/** Represents the monthly rent details. */
export interface HomegateRent {
  area: 'ALL';
  interval: 'MONTH';
  net?: number;
  gross?: number;
  extra?: number;
}

/** Contains price and currency information. */
export interface HomegatePrices {
  rent: HomegateRent;
  currency: 'CHF';
}

/** The core listing object containing all property details. */
export interface HomegateListing {
  address: HomegateAddress;
  categories: string[];
  characteristics: HomegateCharacteristics;
  id: string;
  localization: HomegateLocalization;
  meta: HomegateMeta;
  offerType: 'RENT' | 'SALE';
  platforms: string[];
  prices: HomegatePrices;
}

/** A single result item in the search response. */
export interface HomegateResult {
  listing: HomegateListing;
  id: string;
}

/** The overall structure of the Homegate API search response. */
export interface HomegateApiResponse {
  from: number;
  size: number;
  total: number;
  results: HomegateResult[];
}
