import { useState, useEffect, useCallback } from 'react';
import { FilterCriteria, FilterBucket } from '../types';
import { trpc } from '../utils/trpc';

const createBucket = (): FilterBucket => ({ 
    id: crypto.randomUUID(), 
    type: 'property',
    price: { min: '', max: '' },
    rooms: { min: '', max: '' },
    size: { min: '', max: '' },
    roommates: { min: '', max: '' },
});

const emptyFilters: FilterCriteria = {
    buckets: [],
    destination: '', 
    maxTravelTimes: {
        public: '30',
        bike: '30',
        car: '30',
        walk: '30',
    }, 
    travelModes: [],
    exclusionKeywords: '',
    genderPreference: 'any',
    rentalDuration: 'permanent',
};


export const useFilters = (initialFilters: FilterCriteria | null | undefined) => {
    const [filters, setFilters] = useState<FilterCriteria>(initialFilters || emptyFilters);
    const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
    const [isPristine, setIsPristine] = useState(true);
    
    useEffect(() => {
        if (initialFilters) {
            setFilters(initialFilters);
            setIsPristine(true);
        }
    }, [initialFilters]);

    const saveMutation = trpc.savedSearch.save.useMutation({
        onSuccess: () => {
            setIsPristine(true);
        }
    });

    const handleFilterChange = useCallback(<K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setIsPristine(false);
    }, []);

    const handleAddBucket = useCallback(() => {
        const newBucket = createBucket();
        setFilters(prev => ({
            ...prev,
            buckets: [...prev.buckets, newBucket]
        }));
        setEditingBucketId(newBucket.id);
        setIsPristine(false);
    }, []);

    const handleRemoveBucket = useCallback((id: string) => {
         setFilters(prev => ({
            ...prev,
            buckets: prev.buckets.filter(bucket => bucket.id !== id)
        }));
        if (editingBucketId === id) {
            setEditingBucketId(null);
        }
        setIsPristine(false);
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
        setIsPristine(false);
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
        setIsPristine(false);
    }, []);


    const handleSetEditingBucketId = useCallback((id: string | null) => {
        setEditingBucketId(id);
    }, []);

    const saveFiltersToServer = useCallback(() => {
        saveMutation.mutate(filters);
    }, [filters, saveMutation]);

    const resetSaveStatus = useCallback(() => {
        saveMutation.reset();
        setIsPristine(false);
    }, [saveMutation]);

    return {
        filters,
        setFilters,
        editingBucketId,
        handleFilterChange,
        handleAddBucket,
        handleRemoveBucket,
        handleUpdateBucket,
        handleToggleBucketType,
        handleSetEditingBucketId,
        saveFiltersToServer,
        isSaving: saveMutation.isPending,
        isSaved: saveMutation.isSuccess,
        isPristine,
        resetSaveStatus,
    };
};
