/**
 * Represents a single room listing from the wgzimmer.ch API.
 * This interface documents the complete structure based on the JSON response.
 */
export interface WgZimmerRoom {
  /** 
   * The unique identifier for the listing.
   * @example "57f0ae01-579e-4138-9e3a-36d41575c7be"
   */
  id: string;

  /** 
   * The full URL to the listing on the wgzimmer.ch website.
   * @example "https://www.wgzimmer.ch/wgzimmer/search/mate/ch/spiez/29-11-2025-14-04-2026-600-spiez.html?origin=wg-app"
   */
  url: string;

  /** Flag indicating if the listing is promoted. */
  promotedListing: boolean;

  /** Flag indicating if the listing benefits from an auto-refresh feature to keep it at the top of search results. */
  autoRefreshListing: boolean;

  /** Flag indicating if the listing is a paid ad. */
  paidListing: boolean;
  
  /** Indicates if ads are disabled for this listing, likely tied to a paid plan. */
  disableAds: boolean;
  
  /** The amount paid for the listing promotion, if any. */
  purchaseTotalAmount: number;

  /** True if the listing is temporarily paused by the user. */
  paused: boolean;
  
  /** True if the listing is archived. */
  archived: boolean;
  
  /** Start date if the listing is paused. */
  pausedStart: string;
  
  /** End date if the listing is paused. */
  pausedStop: string;
  
  /** Number of page views today. */
  statsPageViewToday: number;
  
  /** Number of page views yesterday. */
  statsPageViewYesterday: number;
  
  /** Total number of page views for the listing's lifetime. */
  statsPageViewAllTime: number;
  
  /** Number of likes received today. */
  statsLikesToday: number;
  
  /** Number of likes received yesterday. */
  statsLikesYesterday: number;
  
  /** Total number of likes received. */
  statsLikesAllTime: number;
  
  /** Internal flag, likely indicating if the user is a "founder" of the platform. */
  founder: boolean;
  
  /** Indicates if the listing is from a business account. */
  business: boolean;
  
  /** Specific flag for business accounts. */
  businessIsFreeOfCharge: boolean;
  
  /** Specific flag for business accounts. */
  businessAdIsLocked: boolean;
  
  /** True if the listing is a studio apartment. */
  roomStudio: boolean;
  
  /** True if the listing is restricted to students. */
  roomStudentsOnly: boolean;

  /** 
   * True if the room is for long-term rent. False for temporary/short-term lets.
   */
  permanent: boolean;

  /** 
   * The type of shared living arrangement.
   * @values 'wg', 'generation', 'senior'
   */
  wgtype: 'wg' | 'generation' | 'senior' | string;
  
  /** A special link format for sharing the listing. */
  wglink: string;

  /** 
   * The latitude coordinate as a string.
   * @example "46.4841725"
   */
  gpsLatitude: string;

  /** 
   * The longitude coordinate as a string.
   * @example "7.5621743"
   */
  gpsLongitude: string;

  /** 
   * The neighborhood or area name.
   * @example "Adelboden"
   */
  neighborhood: string;

  /** A short description of nearby points of interest. */
  near: string;
  
  /** First name of the contact person. */
  contactFirstname: string;
  
  /** Street name and number. */
  contactAddress: string;
  
  /** Postal code. */
  contactPostal: string;
  
  /** Internal state/region identifier. */
  state: string;
  
  /** The language of the user who posted the ad, e.g., "de". */
  userLanguage: string;
  
  /** City name. */
  contactCity: string;

  /** 
   * The monthly rent price in CHF.
   * @example 600
   */
  price: number;

  /** 
   * The date from which the room is available.
   * @format "DD.MM.YYYY"
   * @example "29.11.2025"
   */
  fromDate: string;

  /** 
   * The date until which the room is available. Can be an empty string for permanent rentals,
   * or a descriptive string for temporary ones.
   * @format "DD.MM.YYYY" or "" or "Befristet bis Sommer 27"
   */
  till: string;

  /** 
   * The timestamp of when the listing was created.
   * @format ISO 8601 with timezone offset.
   * @example "2025-08-26T14:24:21.477+0200"
   */
  creationDate: string;
  
  /** Timestamp used for sorting, often updated by auto-refresh. */
  sortDate: string;
  
  /** Timestamp of the last modification. */
  modDate: string;

  /** 
   * The ID for the primary image. Can be an empty string if no image is available.
   * Used to construct the full image URL.
   * @example "b77d1349-e58f-43eb-8bb9-cc29463db244"
   */
  thumbnail: string;

  /** The ID for the second image, or an empty string. */
  roomPicture2: string;
  /** The ID for the third image, or an empty string. */
  roomPicture3: string;
  /** The ID for the fourth image, or an empty string. */
  roomPicture4: string;
  /** The ID for the fifth image, or an empty string. */
  roomPicture5: string;
  /** The ID for the sixth image, or an empty string. */
  roomPicture6: string;
  
  /** A short caption for the first image. */
  roomPicture1descr: string;
  /** A short caption for the second image. */
  roomPicture2descr: string;
  /** A short caption for the third image. */
  roomPicture3descr: string;
  /** A short caption for the fourth image. */
  roomPicture4descr: string;
  /** A short caption for the fifth image. */
  roomPicture5descr: string;
  /** A short caption for the sixth image. */
  roomPicture6descr: string;

  /** 
   * The detailed description of the room, apartment, and living situation.
   * Can contain newline characters (`\n`).
   */
  roomDescription: string;
  
  /** A description of the current flatmates ("We are..."). */
  roomWeAre: string;
  
  /** A description of the desired new flatmate ("We are looking for..."). */
  roomWeSearch: string;
}

/** Represents the overall structure of the API response. */
export interface WgZimmerResponse {
  rooms: WgZimmerRoom[];
}
