import { Cache } from './cacheInterface';
import { SQLiteCache } from './sqliteCache';
import { RequestLimitError } from '../errors';

export const LONG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SHORT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const cacheService: Cache = new SQLiteCache();

/**
 * A generic memoization function that uses the cache service.
 * @param fn The async function to memoize.
 * @param keyFn A function that generates a unique cache key from the arguments of `fn`.
 * @param ttl The Time To Live for the cache entry.
 * @returns A new function that is a memoized version of `fn`.
 */
export const memoize = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string,
    ttl: number
): T => {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        const cacheKey = keyFn(...args);
        const cached = await cacheService.get<Awaited<ReturnType<T>>>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const result = await fn(...args);
            // Only cache valid results (not null or undefined)
            if (result) {
                await cacheService.set(cacheKey, result, ttl);
            }
            return result;
        } catch (error) {
            // If the request was blocked, don't cache and return the partial results.
            // The error is logged by the function that throws it.
            if (error instanceof RequestLimitError) {
                return error.partialResults as ReturnType<T>;
            }
            // Re-throw other unexpected errors
            throw error;
        }
    }) as T;
};

/**
 * A memoization function for async generators that caches the entire flattened stream.
 * @param fn The async generator function to memoize.
 * @param keyFn A function that generates a unique cache key from the arguments.
 * @param ttl The Time To Live for the cache entry.
 * @returns A new async generator function that is a memoized version of `fn`.
 */
export const memoizeGenerator = <T extends (...args: any[]) => AsyncGenerator<any[], void, undefined>>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string,
    ttl: number
): T => {
    return (async function* (...args: Parameters<T>): AsyncGenerator<any[]> {
        const cacheKey = keyFn(...args);
        const cached = await cacheService.get<any[]>(cacheKey);

        if (cached) {
            if (cached.length > 0) {
                yield cached;
            }
            return;
        }

        const allItems: any[] = [];
        const generator = fn(...args);

        try {
            for await (const chunk of generator) {
                allItems.push(...chunk);
                yield chunk;
            }
            await cacheService.set(cacheKey, allItems, ttl);
        } catch (error) {
            if (error instanceof RequestLimitError) {
                return; // Stop the generator
            }
            throw error; // Re-throw other unexpected errors
        }
    }) as T;
};