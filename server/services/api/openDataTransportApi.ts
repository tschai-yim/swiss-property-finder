
import { cacheService, LONG_CACHE_TTL_MS } from '../cache';
import { RateLimiter } from '../rateLimiter';
import { ojpApiKey } from '@/utils/env';

const transportApiRateLimiter = new RateLimiter(1); // 1 request per second for OJP 2.0

const OJP_API_URL = 'https://api.opentransportdata.swiss/ojp20';

/**
 * Builds the OJP 2.0 TripRequest XML body for a trip between two coordinates.
 * Optimized for daily commute scenarios with faster walking speed.
 */
const buildOjpTripRequestXml = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    departureTime: Date
): string => {
    const timestamp = departureTime.toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<OJP xmlns="http://www.vdv.de/ojp" xmlns:siri="http://www.siri.org.uk/siri" version="2.0">
    <OJPRequest>
        <siri:ServiceRequest>
            <siri:RequestTimestamp>${timestamp}</siri:RequestTimestamp>
            <siri:RequestorRef>swiss-property-finder_prod</siri:RequestorRef>
            <OJPTripRequest>
                <siri:RequestTimestamp>${timestamp}</siri:RequestTimestamp>
                <Origin>
                    <PlaceRef>
                        <GeoPosition>
                            <siri:Longitude>${from.lng}</siri:Longitude>
                            <siri:Latitude>${from.lat}</siri:Latitude>
                        </GeoPosition>
                    </PlaceRef>
                    <DepArrTime>${timestamp}</DepArrTime>
                    <IndividualTransportOptions>
                        <Mode>walk</Mode>
                        <Speed>130</Speed>
                    </IndividualTransportOptions>
                </Origin>
                <Destination>
                    <PlaceRef>
                        <GeoPosition>
                            <siri:Longitude>${to.lng}</siri:Longitude>
                            <siri:Latitude>${to.lat}</siri:Latitude>
                        </GeoPosition>
                    </PlaceRef>
                    <IndividualTransportOptions>
                        <Mode>walk</Mode>
                        <Speed>130</Speed>
                    </IndividualTransportOptions>
                </Destination>
                <Params>
                    <NumberOfResultsBefore>3</NumberOfResultsBefore>
                    <NumberOfResultsAfter>3</NumberOfResultsAfter>
                    <IncludeIntermediateStops>false</IncludeIntermediateStops>
                    <UseRealtimeData>full</UseRealtimeData>
                </Params>
            </OJPTripRequest>
        </siri:ServiceRequest>
    </OJPRequest>
</OJP>`;
};

/**
 * Parses the OJP 2.0 response XML and extracts trip durations.
 * Returns the shortest duration in minutes, or null if no trips found.
 * 
 * The XML structure is:
 *   <TripResult>
 *     <Trip>
 *       <Id>...</Id>
 *       <Duration>PT1H7M</Duration>  <!-- Total trip duration (what we want) -->
 *       <StartTime>...</StartTime>
 *       <Leg>
 *         <Duration>PT19M</Duration>  <!-- Leg duration (NOT what we want) -->
 *       </Leg>
 *     </Trip>
 *   </TripResult>
 */
const parseOjpResponse = (xmlText: string): number | null => {
    // Match Trip's Duration which appears directly after <Trip><Id>...</Id>
    // This is more specific than matching any Duration to avoid leg durations
    const tripDurationRegex = /<Trip>\s*<Id>[^<]*<\/Id>\s*<Duration>(PT[^<]+)<\/Duration>/g;
    
    let shortestDuration: number | null = null;
    let match;
    
    while ((match = tripDurationRegex.exec(xmlText)) !== null) {
        const durationStr = match[1]; // e.g., "PT6M30S", "PT1H23M", "PT2H"
        const totalMinutes = parseIsoDuration(durationStr);
        
        if (totalMinutes !== null) {
            if (shortestDuration === null || totalMinutes < shortestDuration) {
                shortestDuration = totalMinutes;
            }
        }
    }
    
    return shortestDuration;
};

/**
 * Parses an ISO 8601 duration string (e.g., "PT1H23M30S") into minutes.
 */
const parseIsoDuration = (duration: string): number | null => {
    // Match PT followed by optional hours, minutes, seconds
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) {
        console.warn(`Could not parse ISO duration: ${duration}`);
        return null;
    }
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    // Convert to total minutes (round seconds)
    return hours * 60 + minutes + Math.round(seconds / 60);
};

/**
 * Fetches public transport travel time using OJP 2.0 API.
 * Implements a rate limiter and an exponential backoff retry mechanism for 429 errors.
 * @param from The starting coordinates { lat, lng }.
 * @param to The destination coordinates { lat, lng }.
 * @returns A promise that resolves to the travel time in minutes or null on failure.
 */
export const getPublicTransportTime = async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
): Promise<number | null> => {
    if (!ojpApiKey) {
        console.error("OJP_API_KEY environment variable is not set");
        return null;
    }
    
    const cacheKey = `public-transport-ojp2:${from.lat},${from.lng}-${to.lat},${to.lng}`;
    
    return cacheService.getOrSet(cacheKey, async () => {
        // Get next Monday at 08:00 for realistic commute time
        const getNextMondayMorning = (): Date => {
            const date = new Date();
            date.setHours(8, 0, 0, 0);
            date.setDate(date.getDate() + (8 - date.getDay()) % 7);
            return date;
        };

        const departureTime = getNextMondayMorning();
        const requestBody = buildOjpTripRequestXml(from, to, departureTime);

        const fetchWithBackoff = async (attempt = 1): Promise<Response> => {
            const response = await fetch(OJP_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${ojpApiKey}`,
                },
                body: requestBody,
            });
            
            if (response.status === 429 && attempt <= 3) {
                // Exponential backoff: e.g., 1000ms, 2000ms, 4000ms + jitter
                const jitter = Math.random() * 500;
                const delay = Math.pow(2, attempt - 1) * 1000 + jitter;
                console.warn(`Rate limit hit for OJP 2.0 API. Retrying in ${delay.toFixed(0)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithBackoff(attempt + 1);
            }
            return response;
        };

        try {
            // Schedule the fetch-with-backoff operation through the rate limiter
            const response = await transportApiRateLimiter.schedule(fetchWithBackoff);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`OJP 2.0 API error: ${response.status} ${response.statusText}`, errorText.slice(0, 500));
                return null;
            }

            const xmlText = await response.text();
            const shortestDuration = parseOjpResponse(xmlText);
            
            if (shortestDuration === null) {
                // Check if there's an error in the response
                if (xmlText.includes('<siri:ErrorText>') || xmlText.includes('<ErrorMessage>')) {
                    console.error("OJP 2.0 API returned an error:", xmlText.slice(0, 1000));
                } else {
                    console.log("Public transport time could not be determined from OJP response");
                }
                return null;
            }
            
            return shortestDuration;
        } catch (error) {
            console.error("Failed to fetch public transport time from OJP 2.0:", error);
            return null;
        }
    }, LONG_CACHE_TTL_MS);
};
