import { StoredExcludedProperty, Property } from '../types';

const EXCLUSION_STORAGE_KEY = 'swissPropertyFinderExclusions';

// --- Simple pub/sub mechanism for state changes ---
type Subscriber = (exclusions: StoredExcludedProperty[]) => void;
const subscribers: Set<Subscriber> = new Set();

const notify = (data: StoredExcludedProperty[]) => {
    subscribers.forEach(callback => callback(data));
};
// --- End pub/sub ---

let exclusions: StoredExcludedProperty[] = []; // In-memory state

const loadExclusions = (): StoredExcludedProperty[] => {
    try {
        const stored = localStorage.getItem(EXCLUSION_STORAGE_KEY);
        if (!stored) return [];
        const parsedExclusions = JSON.parse(stored);
        
        // Dates are stored as strings in JSON, so we need to convert them back to Date objects.
        return parsedExclusions.map((prop: any) => ({
            ...prop,
            createdAt: prop.createdAt ? new Date(prop.createdAt) : undefined,
        }));
    } catch (e) {
        console.error("Failed to load exclusions from localStorage", e);
        return [];
    }
};

const saveExclusions = (data: StoredExcludedProperty[]) => {
    try {
        localStorage.setItem(EXCLUSION_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save exclusions to localStorage", e);
    }
};

const addExclusion = (property: Property) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { travelTimeBike, travelTimePublic, travelTimeCar, travelTimeWalk, ...rest } = property;
    const newExclusion: StoredExcludedProperty = { ...rest, excludedAt: new Date().toISOString() };
    
    // Avoid adding duplicates to the exclusion list itself
    const existingIds = new Set(exclusions.map(p => p.id));
    if (existingIds.has(newExclusion.id)) return;
    
    const newExclusions = [newExclusion, ...exclusions]
        .sort((a, b) => new Date(b.excludedAt).getTime() - new Date(a.excludedAt).getTime());
    
    exclusions = newExclusions;
    saveExclusions(exclusions);
    notify(exclusions);
};

const removeExclusion = (propertyId: string) => {
    const newExclusions = exclusions.filter(p => p.id !== propertyId);
    if (newExclusions.length !== exclusions.length) {
        exclusions = newExclusions;
        saveExclusions(exclusions);
        notify(exclusions);
    }
};

const getExclusions = (): StoredExcludedProperty[] => {
    return [...exclusions];
};

const subscribe = (callback: Subscriber): (() => void) => {
    subscribers.add(callback);
    callback(exclusions); // Immediately notify with current state
    return () => subscribers.delete(callback); // Return an unsubscribe function
};

const initialize = () => {
    exclusions = loadExclusions();
};

// Initialize the service on module load
initialize();

export const exclusionService = {
    addExclusion,
    removeExclusion,
    getExclusions,
    subscribe,
};
