import { LocalStorageCache, SHORT_CACHE_TTL_MS, LONG_CACHE_TTL_MS } from './localStorageCache';
import { Cache } from './cacheInterface';

const cacheService: Cache = new LocalStorageCache();

export { cacheService, SHORT_CACHE_TTL_MS, LONG_CACHE_TTL_MS };
