import { Cache } from './cacheInterface';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs/promises'; // For creating the data directory

const DB_PATH = path.join(process.cwd(), 'data', 'cache.db');

export class SQLiteCache implements Cache {
    private db: Promise<Database>;

    constructor() {
        this.db = this.initializeDatabase();
    }

    private async initializeDatabase(): Promise<Database> {
        // Ensure the data directory exists
        const dataDir = path.dirname(DB_PATH);
        await fs.mkdir(dataDir, { recursive: true });

        const db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database,
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                expiry INTEGER
            );
        `);
        return db;
    }

    public async get<T>(key: string): Promise<T | null> {
        const db = await this.db;
        const row = await db.get('SELECT value, expiry FROM cache WHERE key = ?', key);

        if (!row) {
            return null;
        }

        const now = Date.now();
        if (now > row.expiry) {
            await db.run('DELETE FROM cache WHERE key = ?', key);
            return null;
        }

        try {
            return JSON.parse(row.value) as T;
        } catch (error) {
            console.error(`Error parsing cached value for key ${key}:`, error);
            await db.run('DELETE FROM cache WHERE key = ?', key); // Remove corrupted item
            return null;
        }
    }

    public async set<T>(key: string, value: T, ttl: number): Promise<void> {
        const db = await this.db;
        const expiry = Date.now() + ttl;
        const stringValue = JSON.stringify(value);

        await db.run(
            'INSERT OR REPLACE INTO cache (key, value, expiry) VALUES (?, ?, ?)',
            key,
            stringValue,
            expiry
        );
    }

    public async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const freshValue = await fetcher();
        if (freshValue !== null && freshValue !== undefined && (!Array.isArray(freshValue) || freshValue.length > 0)) {
            await this.set<T>(key, freshValue, ttl);
        }
        return freshValue;
    }

    public async cleanup(): Promise<void> {
        const db = await this.db;
        await db.run('DELETE FROM cache WHERE expiry < ?', Date.now());
    }
}