import { RateLimiter } from '../rateLimiter';

// Shared rate limiter for all Geoapify API calls.
const geoapifyRateLimiter = new RateLimiter(100); // 5 requests per second

/**
 * A rate-limited fetch function specifically for Geoapify APIs.
 * @param url The Geoapify API URL to fetch.
 * @returns A Promise that resolves to the fetch Response.
 */
export const fetchGeoapify = (url: string | URL | Request): Promise<Response> => {
    return geoapifyRateLimiter.schedule(() => fetch(url));
};
