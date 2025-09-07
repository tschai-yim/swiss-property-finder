import { Property } from '../../../types';
import { areDuplicates, mergeTwoProperties } from './propertyMerger';

/**
 * A data structure for efficiently storing and de-duplicating properties.
 * It uses a spatial grid to quickly find potential duplicates near a new property,
 * and merges them on the fly if they meet the duplication criteria.
 */
export class PropertySet {
    // The source of truth for all unique properties currently in the set.
    private propertiesById: Map<string, Property> = new Map();

    // A spatial grid for efficient duplicate lookups, storing property IDs.
    private grid: Map<string, string[]> = new Map();
    // Cell size in degrees latitude/longitude. ~0.0005 degrees is roughly 55 meters.
    private readonly cellSize = 0.0005;

    /**
     * Calculates the grid cell ID for a given coordinate.
     */
    private getCellId(lat: number, lng: number): string {
        const x = Math.floor(lng / this.cellSize);
        const y = Math.floor(lat / this.cellSize);
        return `${x},${y}`;
    }

    /**
     * Retrieves all unique properties from the cell of the given coordinate and its 8 neighbors.
     */
    private getNearbyProperties(lat: number, lng: number): Property[] {
        const propertyIds = new Set<string>();
        const x = Math.floor(lng / this.cellSize);
        const y = Math.floor(lat / this.cellSize);

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const cellId = `${x + i},${y + j}`;
                const idsInCell = this.grid.get(cellId);
                if (idsInCell) {
                    idsInCell.forEach(id => propertyIds.add(id));
                }
            }
        }
        
        return Array.from(propertyIds)
            .map(id => this.propertiesById.get(id))
            .filter((p): p is Property => p !== undefined);
    }

    /**
     * Finds all properties in the set that are duplicates of the given property.
     */
    private findDuplicatesOf(property: Property): Property[] {
        if (!property.lat || !property.lng) {
            return [];
        }
        const nearby = this.getNearbyProperties(property.lat, property.lng);
        return nearby.filter(existing => existing.id === property.id || areDuplicates(property, existing));
    }

    /**
     * Adds a property to the set, merging it with any duplicates found.
     * This is a robust method that finds all duplicates at once before merging.
     * @param property The new property to add.
     * @returns An object containing the final property (which may be a merged version).
     */
    public add(property: Property): { finalProperty: Property } {
        const duplicates = this.findDuplicatesOf(property);
        
        let finalProperty = property;

        if (duplicates.length > 0) {
            // Remove all found duplicates from the set.
            duplicates.forEach(dup => this.remove(dup));
            
            // Merge the new property with all its duplicates into a single property.
            finalProperty = duplicates.reduce(
                (merged, currentDup) => mergeTwoProperties(merged, currentDup),
                property
            );
        }
        
        // Add the final, possibly merged, property to the set.
        this.addForLookupOnly(finalProperty);
        return { finalProperty };
    }
    
    /**
     * Adds a property to the internal maps and spatial grid without checking for duplicates.
     * This is used to efficiently populate a set for lookup purposes (e.g., an exclusion list).
     * @param property The property to add for lookup.
     */
    public addForLookupOnly(property: Property): void {
        this.propertiesById.set(property.id, property);

        if (property.lat && property.lng) {
            const cellId = this.getCellId(property.lat, property.lng);
            const cell = this.grid.get(cellId) || [];
            if (!cell.includes(property.id)) {
                 cell.push(property.id);
            }
            this.grid.set(cellId, cell);
        }
    }

    /**
     * Checks if a given property is a duplicate of any property already in the set.
     * @param property The property to check.
     * @returns The existing duplicate property if found, otherwise null.
     */
    public findDuplicate(property: Property): Property | null {
        return this.findDuplicatesOf(property)[0] || null;
    }

    /**
     * Removes a property from all internal data structures.
     * @param property The property to remove.
     */
    private remove(property: Property): void {
        this.propertiesById.delete(property.id);

        if (property.lat && property.lng) {
            const cellId = this.getCellId(property.lat, property.lng);
            const cell = this.grid.get(cellId);
            if (cell) {
                const index = cell.indexOf(property.id);
                if (index > -1) {
                    cell.splice(index, 1);
                }
                if (cell.length === 0) {
                    this.grid.delete(cellId);
                }
            }
        }
    }
    
    /**
     * @returns An array of all unique properties currently in the set.
     */
    public getAll(): Property[] {
        return Array.from(this.propertiesById.values());
    }
}