import { useState, useEffect, useCallback } from 'react';
import { FilterCriteria, FilterBucket } from '../types';

const FILTER_STORAGE_KEY = 'swissPropertyFinderFilters';
const UI_STATE_STORAGE_KEY = 'swissPropertyFinderUiState';

const createBucket = (): FilterBucket => ({ 
    id: crypto.randomUUID(), 
    type: 'property',
    price: { min: '', max: '' },
    rooms: { min: '', max: '' },
    size: { min: '', max: '' },
    roommates: { min: '', max: '' },
});

const initialFilters: FilterCriteria = {
    buckets: [
        {
            id: crypto.randomUUID(),
            type: 'sharedFlat',
            price: { min: '', max: '1000' },
            rooms: { min: '', max: '' },
            size: { min: '', max: '' },
            roommates: { min: '', max: '', },
        },
        {
            id: crypto.randomUUID(),
            type: 'property',
            price: { min: '', max: '1000' },
            rooms: { min: '1', max: '' },
            size: { min: '', max: '' },
            roommates: { min: '', max: '', },
        },
        {
            id: crypto.randomUUID(),
            type: 'property',
            price: { min: '', max: '1800' },
            rooms: { min: '3', max: '' },
            size: { min: '', max: '', },
            roommates: { min: '', max: '', },
        },
        {
            id: crypto.randomUUID(),
            type: 'property',
            price: { min: '', max: '2700' },
            rooms: { min: '4', max: '' },
            size: { min: '', max: '', },
            roommates: { min: '', max: '', },
        },
    ],
    destination: 'ETH Hauptgebäude (HG), Rämistrasse 101, 8092 Zurich, Switzerland', 
    maxTravelTimes: {
        public: '35',
        bike: '25',
        car: '30',
        walk: '25',
    }, 
    travelModes: ['public', 'bike'],
    exclusionKeywords: 'Tauschwohnung, Wochenaufenthalt',
    genderPreference: 'male',
    rentalDuration: 'permanent',
};

const loadFiltersFromStorage = (): FilterCriteria | null => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(FILTER_STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        // Migration for old filters
        if (parsed.excludeTausch !== undefined) {
            parsed.exclusionKeywords = parsed.excludeTausch ? 'Tauschwohnung' : '';
            delete parsed.excludeTausch;
        }
        if (!parsed.genderPreference) parsed.genderPreference = 'any';
        if (!parsed.rentalDuration) parsed.rentalDuration = 'permanent';
        if (parsed.buckets && parsed.buckets.length > 0) {
            parsed.buckets.forEach((b: any) => {
                if (!b.type) b.type = 'property';
                if (!b.roommates) b.roommates = { min: '', max: '', };
            });
        }
        
        return { ...initialFilters, ...parsed };
    } catch (e) {
        console.error("Failed to load filters from localStorage", e);
        return null;
    }
};

const saveFiltersToStorage = (filters: FilterCriteria) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
        console.error("Failed to save filters to localStorage", e);
    }
};

export const useFilters = () => {
    const [filters, setFilters] = useState<FilterCriteria>(() => loadFiltersFromStorage() || initialFilters);
    const [editingBucketId, setEditingBucketId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem(UI_STATE_STORAGE_KEY);
            return stored ? (JSON.parse(stored).editingBucketId ?? null) : null;
        } catch (e) {
            console.error("Failed to load UI state from localStorage", e);
            return null;
        }
    });
    
    // Persist filters to localStorage whenever they change
    useEffect(() => {
        const handler = setTimeout(() => saveFiltersToStorage(filters), 500);
        return () => clearTimeout(handler);
    }, [filters]);

    // Persist UI state (like which filter is open) to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify({ editingBucketId }));
        } catch (e) {
            console.error("Failed to save UI state to localStorage", e);
        }
    }, [editingBucketId]);

    const handleFilterChange = useCallback(<K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleAddBucket = useCallback(() => {
        const newBucket = createBucket();
        setFilters(prev => ({
            ...prev,
            buckets: [...prev.buckets, newBucket]
        }));
        setEditingBucketId(newBucket.id);
    }, []);

    const handleRemoveBucket = useCallback((id: string) => {
         setFilters(prev => ({
            ...prev,
            buckets: prev.buckets.filter(bucket => bucket.id !== id)
        }));
        if (editingBucketId === id) {
            setEditingBucketId(null);
        }
    }, [editingBucketId]);

    const handleUpdateBucket = useCallback((id: string, field: 'price' | 'rooms' | 'size' | 'roommates', subField: 'min' | 'max', value: string) => {
        setFilters(prev => ({
            ...prev,
            buckets: prev.buckets.map(bucket => 
                bucket.id === id 
                    ? { ...bucket, [field]: { ...bucket[field], [subField]: value } } 
                    : bucket
            )
        }));
    }, []);

    const handleToggleBucketType = useCallback((id: string) => {
        setFilters(prev => ({
            ...prev,
            buckets: prev.buckets.map(bucket =>
                bucket.id === id
                    ? { ...bucket, type: bucket.type === 'property' ? 'sharedFlat' : 'property' }
                    : bucket
            )
        }));
    }, []);


    const handleSetEditingBucketId = useCallback((id: string | null) => {
        setEditingBucketId(id);
    }, []);

    return {
        filters,
        editingBucketId,
        handleFilterChange,
        handleAddBucket,
        handleRemoveBucket,
        handleUpdateBucket,
        handleToggleBucketType,
        handleSetEditingBucketId,
    };
};
