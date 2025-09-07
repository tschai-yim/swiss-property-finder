import { StoredExcludedProperty, Property } from '../../types';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';

const DB_PATH = path.join(process.cwd(), 'data', 'exclusions.db');

// --- Simple pub/sub mechanism for state changes (can be kept or replaced with DB listeners) ---

type Subscriber = (exclusions: StoredExcludedProperty[]) => void;
const subscribers: Set<Subscriber> = new Set();

const notify = (data: StoredExcludedProperty[]) => {
    subscribers.forEach(callback => callback(data));
};
// --- End pub/sub ---

export class SQLiteExclusionService {
    private db: Promise<Database>;

    constructor() {
        this.db = this.initializeDatabase();
    }

    private async initializeDatabase(): Promise<Database> {
        const dataDir = path.dirname(DB_PATH);
        await fs.mkdir(dataDir, { recursive: true });

        const db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database,
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS exclusions (
                id TEXT PRIMARY KEY,
                address TEXT,
                lat REAL,
                lng REAL,
                price INTEGER,
                size INTEGER,
                rooms REAL,
                url TEXT,
                provider TEXT,
                imageUrl TEXT,
                excludedAt TEXT
            );
        `);
        return db;
    }

    private async loadExclusions(): Promise<StoredExcludedProperty[]> {
        const db = await this.db;
        const rows = await db.all('SELECT * FROM exclusions ORDER BY excludedAt DESC');
        return rows.map(row => ({
            ...row,
            excludedAt: new Date(row.excludedAt), // Convert back to Date object
        })) as StoredExcludedProperty[];
    }

    public async addExclusion(property: Property): Promise<void> {
        const db = await this.db;
        const { travelTimeBike, travelTimePublic, travelTimeCar, travelTimeWalk, ...rest } = property;
        const newExclusion: StoredExcludedProperty = { ...rest, excludedAt: new Date().toISOString() };

        const primaryUrl = newExclusion.providers.length > 0 ? newExclusion.providers[0].url : null;
        const primaryProvider = newExclusion.providers.length > 0 ? newExclusion.providers[0].name : null;

        await db.run(
            `INSERT OR REPLACE INTO exclusions (id, address, lat, lng, price, size, rooms, url, provider, imageUrl, excludedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            newExclusion.id,
            newExclusion.address,
            newExclusion.lat,
            newExclusion.lng,
            newExclusion.price,
            newExclusion.size,
            newExclusion.rooms,
            primaryUrl,
            primaryProvider,
            newExclusion.imageUrl,
            newExclusion.excludedAt
        );
        const updatedExclusions = await this.loadExclusions();
        notify(updatedExclusions);
    }

    public async removeExclusion(propertyId: string): Promise<void> {
        const db = await this.db;
        await db.run('DELETE FROM exclusions WHERE id = ?', propertyId);
        const updatedExclusions = await this.loadExclusions();
        notify(updatedExclusions);
    }

    public async getExclusions(): Promise<StoredExcludedProperty[]> {
        return this.loadExclusions();
    }

    public subscribe(callback: Subscriber): () => void {
        subscribers.add(callback);
        this.loadExclusions().then(callback); // Immediately notify with current state
        return () => subscribers.delete(callback); // Return an unsubscribe function
    }
}

// Initialize the service on module load
export const exclusionService = new SQLiteExclusionService();