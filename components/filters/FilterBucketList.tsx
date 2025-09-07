

import React from 'react';
import { FilterCriteria, Property } from '../../types';
import { BucketEditor } from './BucketEditor';
import { summarizeBucket } from '../../utils/formatters';
import { AdvancedFilterControl } from './AdvancedFilterControl';
import { ExcludedProperties } from './ExcludedProperties';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faHouse } from '@fortawesome/free-solid-svg-icons';

interface FilterBucketListProps {
    filters: FilterCriteria;
    onFilterChange: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
    onAddBucket: () => void;
    onRemoveBucket: (id: string) => void;
    onUpdateBucket: (id: string, field: 'price' | 'rooms' | 'size' | 'roommates', subField: 'min' | 'max', value: string) => void;
    onToggleBucketType: (id: string) => void;
    editingBucketId: string | null;
    onSetEditingBucketId: (id: string | null) => void;
    excludedProperties: Property[];
    onRestoreProperty: (property: Property) => void;
    destinationCoords: { lat: number, lng: number } | null;
    onFocusPropertyOnMap: (coords: { lat: number, lng: number } | null) => void;
}

export const FilterBucketList: React.FC<FilterBucketListProps> = (props) => {
    const { filters, onAddBucket, onRemoveBucket, editingBucketId, onSetEditingBucketId } = props;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600 mr-2">Filters:</span>
            {filters.buckets.map(bucket => (
                <div key={bucket.id} className="relative">
                    <button 
                        onClick={() => onSetEditingBucketId(bucket.id === editingBucketId ? null : bucket.id)}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-full text-sm font-semibold transition-colors ${editingBucketId === bucket.id ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}
                    >
                        {bucket.type === 'sharedFlat' ? (
                            <FontAwesomeIcon icon={faBed} />
                        ) : (
                            <FontAwesomeIcon icon={faHouse} />
                        )}
                        <span>{summarizeBucket(bucket)}</span>
                        <span onClick={(e) => { e.stopPropagation(); onRemoveBucket(bucket.id); }} className="text-rose-300 hover:text-white">&times;</span>
                    </button>
                    {editingBucketId === bucket.id && (
                        <BucketEditor 
                            bucket={bucket}
                            onUpdate={props.onUpdateBucket}
                            onToggleType={props.onToggleBucketType}
                            onClose={() => onSetEditingBucketId(null)}
                        />
                    )}
                </div>
            ))}
             <button onClick={onAddBucket} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-rose-500 hover:text-white transition-all text-lg font-bold" aria-label="Add filter bucket">
                +
            </button>

            <div className="flex-grow"></div>
            
            <div className="flex items-center gap-2">
                <ExcludedProperties 
                    excludedProperties={props.excludedProperties}
                    onRestoreProperty={props.onRestoreProperty}
                    destinationCoords={props.destinationCoords}
                    onFocusPropertyOnMap={props.onFocusPropertyOnMap}
                />
                <AdvancedFilterControl filters={props.filters} onFilterChange={props.onFilterChange} />
            </div>
        </div>
    );
};