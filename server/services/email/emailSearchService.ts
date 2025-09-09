import {
  Property,
  FilterCriteria,
  DebugConfig,
  SearchMetadata,
  TravelMode,
} from "../../../types";
import { streamProperties } from "../search/searchOrchestrator";
import { enrichItemsWithTravelTimes } from "../api/cachedRoutingApi";
import { PropertyWithoutCommuteTimes } from "../providers/providerTypes";

export interface EmailSearchReport {
  properties: Property[];
  metadata: SearchMetadata;
}

/**
 * A non-hook, non-streaming function to aggregate all results from a property search.
 * This is designed for contexts like email generation where the full result set is needed upfront.
 * @param filters The user's complete search criteria.
 * @param debugConfig The application's debug configuration.
 * @param excludedProperties A list of properties to exclude from the search.
 * @param createdSince An optional date to only find properties created after this time.
 * @param onProgress A callback function to report progress messages to the UI.
 * @returns A promise that resolves to an `EmailSearchReport` containing all found properties and metadata.
 */
export const fetchNewPropertiesForEmail = async (
  filters: FilterCriteria,
  debugConfig: DebugConfig,
  excludedProperties: PropertyWithoutCommuteTimes[],
  createdSince: Date,
  onProgress: (message: string) => void
): Promise<EmailSearchReport> => {
  const report: EmailSearchReport = {
    properties: [],
    // @ts-expect-error Will be filled in later. Needs to be typed differently eventually.
    metadata: {},
  };
  let properties: Property[] = [];

  const propertyStream = streamProperties(
    filters,
    debugConfig,
    excludedProperties,
    createdSince
  );

  for await (const event of propertyStream) {
    if (event.type === "progress") {
      onProgress(event.message);
    } else if (event.type === "properties") {
      const propMap = new Map(properties.map((p) => [p.id, p]));

      for (const newProp of event.properties) {
        const componentIds = newProp.id.split("+");
        if (componentIds.length > 1) {
          // This is a merged property. Remove its original components.
          componentIds.forEach((id) => propMap.delete(id));
        }
        // Add or replace the property in the map. This handles new, merged, and enriched properties.
        propMap.set(newProp.id, newProp);
      }
      properties = Array.from(propMap.values());
    } else if (event.type === "metadata") {
      report.metadata = { ...report.metadata, ...event.metadata };
    }
  }

  const ALL_MODES: TravelMode[] = ["public", "bike", "car", "walk"];

  // After finding all matching properties, enrich them with ALL travel modes for the email report.
  if (properties.length > 0 && report.metadata.destinationCoords) {
    onProgress(
      `Enriching ${properties.length} properties with all travel times...`
    );

    const fullyEnrichedProperties = await enrichItemsWithTravelTimes(
      properties,
      report.metadata.destinationCoords as { lat: number; lng: number },
      ALL_MODES,
      !debugConfig.enabled || debugConfig.queryPublicTransport
    );
    report.properties = fullyEnrichedProperties.sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    );
  } else {
    report.properties = properties.sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    );
  }

  return report;
};
