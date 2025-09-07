import { SQLiteCache } from './sqliteCache';
import { Cache } from './cacheInterface';

export const SHORT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const LONG_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

const cacheService: Cache = new SQLiteCache();

export { cacheService };