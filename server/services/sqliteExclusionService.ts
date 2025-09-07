import { Property } from "../../types";
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs/promises";

const DB_PATH = path.join(process.cwd(), "data", "exclusions.db");

// --- Simple pub/sub mechanism for state changes (can be kept or replaced with DB listeners) ---

type Subscriber = (exclusions: Property[]) => void;
const subscribers: Set<Subscriber> = new Set();

const notify = (data: Property[]) => {
  subscribers.forEach((callback) => callback(data));
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
                excludedAt TEXT,
                propertyData TEXT
            );
        `);
    return db;
  }

  private async loadExclusions(): Promise<Property[]> {
    const db = await this.db;
    const rows = await db.all(
      "SELECT * FROM exclusions ORDER BY excludedAt DESC"
    );
    return rows.map((row) => {
      const property = JSON.parse(row.propertyData);
      return property;
    });
  }

  public async addExclusion(property: Property): Promise<void> {
    const db = await this.db;
    const {
      travelTimeBike,
      travelTimePublic,
      travelTimeCar,
      travelTimeWalk,
      ...rest
    } = property;

    await db.run(
      `INSERT OR REPLACE INTO exclusions (id, excludedAt, propertyData)
                VALUES (?, ?, ?)`,
      property.id,
      new Date().toISOString(),
      JSON.stringify(rest)
    );
    const updatedExclusions = await this.loadExclusions();
    notify(updatedExclusions);
  }

  public async removeExclusion(propertyId: string): Promise<void> {
    const db = await this.db;
    await db.run("DELETE FROM exclusions WHERE id = ?", propertyId);
    const updatedExclusions = await this.loadExclusions();
    notify(updatedExclusions);
  }

  public async getExclusions(): Promise<Property[]> {
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
