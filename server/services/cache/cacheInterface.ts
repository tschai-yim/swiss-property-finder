
export interface Cache {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl: number): Promise<void>;
    getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T>;
    cleanup(): Promise<void>;
}
