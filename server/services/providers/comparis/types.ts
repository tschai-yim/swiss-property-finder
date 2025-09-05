/**
 * Represents the contact information block within a Comparis listing.
 * This data is primarily used for rendering contact forms on the Comparis website.
 */
export interface ComparisContactInformation {
  HasContactForm: boolean;
  HasMissingAddressContactForm: boolean;
  HasMissingFloorPlanContactForm: boolean;
  ContactSiteId: number | null;
  ContactSiteName: string | null;
  ContactSiteLogoUrl: string | null;
  ContactFormType: number | null;
  DefaultContactMessage: string | null;
  AdvertiserInformation: any | null;
  VendorInformation: any | null;
  VisitationContactInformation: any | null;
  IsVendorContactForm: boolean;
  OnlineApplicationUrl: string | null;
  OnlineApplicationRemarks: string | null;
}

/**
 * Represents a single property listing item from the Comparis API.
 * This interface documents the complete structure based on observed API responses.
 */
export interface ComparisResultItem {
  /** The unique numeric identifier for the advertisement. This is the primary key. */
  AdId: number;
  /** A numeric ID representing the source site (e.g., 245 for Comparis, 201 for ImmoScout24). */
  SiteId: number;
  /** A numeric enum for the ad's status. `0` indicates an active listing. */
  AdStatus: number;
  /** The title of the listing. */
  Title: string;
  /** A human-readable description of the property type (e.g., "Wohnung", "Möblierte Wohnung", "WG-Zimmer", "Tiefgarage"). */
  PropertyTypeText: string;
  /** An array of strings that form the address. Can contain street, postal code, and city. Sometimes the street is omitted. */
  Address: string[];
  /** 
   * An array of short, unformatted strings containing key property details. 
   * Requires parsing to extract values like rooms (`"2.5 Zimmer"`), size (`"65 m²"`), and floor (`"3. Etage"`).
   */
  EssentialInformation: string[];
  /** The display-formatted price string, which may include thousand separators (e.g., "2'450"). Use `PriceValue` for calculations. */
  Price: string;
  /** The currency code (e.g., "CHF"). */
  Currency: string;
  /** A timestamp string (in Swiss local time) indicating when the ad was created or last updated. Format: "YYYY-MM-DDTHH:mm:ss" */
  Date: string;
  /** The URL for the listing's primary thumbnail image. Can be a relative URL that needs prefixing with `https://www.comparis.ch`. */
  ImageUrl: string;
  /** A flag indicating if the listing is a promoted or premium ad. */
  IsPremiumListed: boolean;
  /** A deprecated or unused rating feature; always observed as `null`. */
  ComparisPoints: null;
  /** URL for the partner's logo. */
  PartnerLogoUrl: string | null;
  /** The name of the original source of the listing (e.g., "Comparis", "immoscout24.ch"). */
  PartnerName: string;
  /** A complex object containing detailed information for contact forms. */
  ContactInformation: ComparisContactInformation;
  /** An enum (`UP`, `DOWN`, or `null`) to indicate recent price changes. Always `null` in observed data. */
  PriceDevelopmentDirection: null;
  /** The numerical value of the monthly rent. This is the recommended field to use for price. */
  PriceValue: number;
  /** The numerical value of the living space in square meters (m²). Can be `null`. */
  AreaValue: number | null;
  /** 
   * A numeric enum for the `PropertyTypeText`
   * - 1 for "Wohnung"
   * - 2 for "Möbelierte Wohnung"
   * - 3 for "WG-Zimmer"
   * - 4 for "Haus"
   * - 7 for "Mehrfamilienhaus"
   * - 25 for "Tiefgarage"
   */
  PropertyTypeId: number;
  /** A numeric enum for the offer type (e.g., 10 for "Rent"). */
  DealType: number;
  /** An internal flag for rendering on the Comparis website. */
  UseInternalLinks: boolean;
  /** An internal flag for rendering on the Comparis website. */
  ShowComparisRating: boolean;
  /** An internal or unused flag, always observed as `null`. */
  MemberLogoUrl: null;
  /** An internal flag for rendering on the Comparis website. */
  ShowDefaultPersonalizationSegment: boolean;
  /** Describes what the price represents (e.g., "Mietpreis pro Monat"). */
  PriceTypeText: string;
}
