import {
  PropertyProvider,
  RequestManager,
  SearchContext,
  PropertyWithoutCommuteTimes,
} from "../providerTypes";
import { fetchComparisApi, mapComparisToProperty } from "./api";
import { FilterBucket } from "../../../../types";
import { SearchCriteria } from "./types";
import { filterProperty } from "../../../../utils/filterUtils";

const createSearchCriteriaFromBucket = (
  bucket: FilterBucket,
  context: SearchContext
): SearchCriteria => {
  const criteria: SearchCriteria = {
    DealType: 10, // Rent
    SearchOrderKey: 3, // Publication date ascending
    SearchType: "LocationStringSearch",
    SearchTrigger: "SearchButtonClick",
    LocationSearchString: context.places.map((p) => p.name).join(", "),
  };

  if (bucket.price.min) criteria.PriceFrom = parseFloat(bucket.price.min);
  if (bucket.price.max) criteria.PriceTo = parseFloat(bucket.price.max);

  if (bucket.type === "property") {
    if (bucket.rooms.min) criteria.RoomsFrom = parseFloat(bucket.rooms.min);
    if (bucket.rooms.max) criteria.RoomsTo = parseFloat(bucket.rooms.max);
    if (bucket.size.min) criteria.LivingSpaceFrom = parseFloat(bucket.size.min);
    if (bucket.size.max) criteria.LivingSpaceTo = parseFloat(bucket.size.max);
    criteria.RootPropertyTypes = [1, 2, 4, 7]; // Apartment, Furnished Apartment, House, Multi-family House
  } else if (bucket.type === "sharedFlat") {
    criteria.RootPropertyTypes = [3]; // Shared Flat
  }

  // Do not make assumptions about rental duration and property types
  // The API will filter by what's specified in the bucket

  return criteria;
};

const fetchPropertiesForBucket = async function* (
  bucket: FilterBucket,
  context: SearchContext,
  requestManager: RequestManager,
  processedAds: Set<number>
): AsyncGenerator<PropertyWithoutCommuteTimes[]> {
  const searchCriteria = createSearchCriteriaFromBucket(bucket, context);

  const apiStream = fetchComparisApi(searchCriteria, requestManager);

  for await (const rawItems of apiStream) {
    // Filter out already processed ads
    const newItems = rawItems.filter((item) => !processedAds.has(item.AdId));
    newItems.forEach((item) => processedAds.add(item.AdId));

    // Map to Property objects and apply client-side filtering
    let properties = newItems
      .map(mapComparisToProperty)
      .filter((p): p is PropertyWithoutCommuteTimes => p !== null)
      .filter((p) => filterProperty(p, context.filters, bucket));
    if (properties.length === 0) continue;

    // Further filter by createdSince if specified
    if (context.createdSince) {
      properties = properties.filter(
        (p) => p.createdAt && new Date(p.createdAt) >= context.createdSince!
      );
      // If none are recent enough, stop fetching more pages for this bucket
      if (properties.length === 0) break;
    }
    yield properties;
  }
};

export const comparisProvider: PropertyProvider = {
  name: "Comparis",
  fetchProperties: async function* (
    context: SearchContext,
    requestManager: RequestManager
  ) {
    const processedAds = new Set<number>();
    for (const bucket of context.filters.buckets) {
      yield* fetchPropertiesForBucket(
        bucket,
        context,
        requestManager,
        processedAds
      );
    }
  },
};
