
import { Cache } from './cacheInterface';

export const SHORT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const LONG_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export class LocalStorageCache implements Cache {
    private readonly prefix = 'spfa-cache:'; // Swiss Property Finder AI cache prefix

    public get<T>(key: string): Promise<T | null> {
        const prefixedKey = this.prefix + key;
        try {
            const itemStr = localStorage.getItem(prefixedKey);
            if (!itemStr) {
                return Promise.resolve(null);
            }
            const item = JSON.parse(itemStr);
            const now = Date.now();
            if (now > item.expiry) {
                localStorage.removeItem(prefixedKey);
                return Promise.resolve(null);
            }
            return Promise.resolve(item.value as T);
        } catch (error) {
            console.error("Cache read error:", error);
            try {
                localStorage.removeItem(prefixedKey);
            } catch (removeError) {
                console.error("Failed to remove corrupted cache item:", removeError);
            }
            return Promise.resolve(null);
        }
    }

    public set<T>(key: string, value: T, ttl: number): Promise<void> {
        const prefixedKey = this.prefix + key;
        try {
            const now = Date.now();
            const item = {
                value,
                expiry: now + ttl,
            };
            localStorage.setItem(prefixedKey, JSON.stringify(item));
        } catch (error) {
            // If we're over quota, run a cleanup and log the issue.
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
                console.warn('LocalStorage quota exceeded. Running cleanup...');
                this.cleanup();
            } else {
                console.error("Cache write error:", error);
            }
        }
        return Promise.resolve();
    }

    public async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }
        const freshValue = await fetcher();
        // Avoid caching null/undefined or empty arrays to save space.
        if (freshValue !== null && freshValue !== undefined && (!Array.isArray(freshValue) || freshValue.length > 0)) {
            await this.set<T>(key, freshValue, ttl);
        }
        return freshValue;
    }

    public cleanup(): Promise<void> {
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    try {
                        const itemStr = localStorage.getItem(key);
                        if (itemStr) {
                            const item = JSON.parse(itemStr);
                            if (item.expiry && Date.now() > item.expiry) {
                                keysToRemove.push(key);
                            }
                        } else {
                            // Key exists but has no value, remove it.
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        // Corrupted item, remove it.
                        console.warn(`Removing corrupted cache item: ${key}`);
                        keysToRemove.push(key);
                    }
                }
            }

            if (keysToRemove.length > 0) {
                 keysToRemove.forEach(key => localStorage.removeItem(key));
                 console.log(`Cache cleanup: Removed ${keysToRemove.length} expired items.`);
            }
        } catch (error) {
            console.error("Cache cleanup failed:", error);
        }
        return Promise.resolve();
    }
}
