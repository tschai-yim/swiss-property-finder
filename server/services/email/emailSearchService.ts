
import { Property, FilterCriteria, DebugConfig, StoredExcludedProperty, SearchMetadata, TravelMode } from '../../../types';
import { streamProperties } from '../search/searchOrchestrator';
import { enrichItemsWithTravelTimes } from '../api/cachedRoutingApi';

export interface EmailSearchReport {
    properties: Property[];
    metadata: Partial<SearchMetadata>;
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
    excludedProperties: StoredExcludedProperty[],
    createdSince: Date,
    onProgress: (message: string) => void
): Promise<EmailSearchReport> => {
    
    const report: EmailSearchReport = {
        properties: [],
        metadata: {},
    };
    const propertyMap = new Map<string, Property>();

    const propertyStream = streamProperties(
        filters, 
        debugConfig, 
        excludedProperties, 
        createdSince
    );

    for await (const event of propertyStream) {
        if (event.type === 'progress') {
            onProgress(event.message);
        } else if (event.type === 'properties') {
            event.properties.forEach((prop: Property) => propertyMap.set(prop.id, prop));
        } else if (event.type === 'metadata') {
            report.metadata = { ...report.metadata, ...event.metadata };
        }
    }
    
    const collectedProperties = Array.from(propertyMap.values());
    const ALL_MODES: TravelMode[] = ['public', 'bike', 'car', 'walk'];
    
    // After finding all matching properties, enrich them with ALL travel modes for the email report.
    if (collectedProperties.length > 0 && report.metadata.destinationCoords) {
        onProgress(`Enriching ${collectedProperties.length} properties with all travel times...`);
        
        const fullyEnrichedProperties = await enrichItemsWithTravelTimes(
            collectedProperties,
            report.metadata.destinationCoords as { lat: number; lng: number },
            ALL_MODES,
            !debugConfig.enabled || debugConfig.queryPublicTransport
        );
        report.properties = collectedProperties.sort((a,b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    } else {
        report.properties = collectedProperties.sort((a,b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    }
    
    return report;
};
