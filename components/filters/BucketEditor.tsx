import React, { useEffect, useRef } from 'react';
import { FilterBucket } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightLeft } from '@fortawesome/free-solid-svg-icons';

interface BucketEditorProps {
    bucket: FilterBucket;
    onUpdate: (id: string, field: 'price' | 'rooms' | 'size' | 'roommates', subField: 'min' | 'max', value: string) => void;
    onToggleType: (id: string) => void;
    onClose: () => void;
}

export const BucketEditor: React.FC<BucketEditorProps> = ({ bucket, onUpdate, onToggleType, onClose }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const renderPropertyFields = () => (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                <div className="flex items-center gap-2">
                    <input type="number" value={bucket.rooms.min} onChange={e => onUpdate(bucket.id, 'rooms', 'min', e.target.value)} placeholder="Min" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
                    <input type="number" value={bucket.rooms.max} onChange={e => onUpdate(bucket.id, 'rooms', 'max', e.target.value)} placeholder="Max" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size (m²)</label>
                <div className="flex items-center gap-2">
                    <input type="number" value={bucket.size.min} onChange={e => onUpdate(bucket.id, 'size', 'min', e.target.value)} placeholder="Min" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
                    <input type="number" value={bucket.size.max} onChange={e => onUpdate(bucket.id, 'size', 'max', e.target.value)} placeholder="Max" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
                </div>
            </div>
        </>
    );

    const renderSharedFlatFields = () => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roommates</label>
            <div className="flex items-center gap-2">
                <input type="number" value={bucket.roommates.min} onChange={e => onUpdate(bucket.id, 'roommates', 'min', e.target.value)} placeholder="Min" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
                <input type="number" value={bucket.roommates.max} onChange={e => onUpdate(bucket.id, 'roommates', 'max', e.target.value)} placeholder="Max" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
            </div>
        </div>
    );

    return (
        <div ref={editorRef} className="absolute top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border z-50 p-4 space-y-4 animate-fade-in-fast">
            <div
                className="flex justify-between items-center p-2 -m-2 rounded-t-md hover:bg-gray-100 cursor-pointer"
                onClick={() => onToggleType(bucket.id)}
                title="Click to switch bucket type"
            >
                <h4 className="font-bold text-gray-800">{bucket.type === 'property' ? 'Property Filter' : 'Shared Flat Filter'}</h4>
                <FontAwesomeIcon icon={faRightLeft} className="text-gray-400" />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (CHF)</label>
                <div className="flex items-center gap-2">
                    <input type="number" value={bucket.price.min} onChange={e => onUpdate(bucket.id, 'price', 'min', e.target.value)} placeholder="Min" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
                    <input type="number" value={bucket.price.max} onChange={e => onUpdate(bucket.id, 'price', 'max', e.target.value)} placeholder="Max" min="0" className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900" />
                </div>
            </div>

            {bucket.type === 'property' ? renderPropertyFields() : renderSharedFlatFields()}
        </div>
    );
}