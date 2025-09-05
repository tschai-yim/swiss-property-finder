
import React, { forwardRef } from 'react';
import { TravelMode } from '../../types';

interface TravelModeControlProps {
    mode: TravelMode;
    icon: React.ReactNode;
    name: string;
    isChecked: boolean;
    isEditing: boolean;
    value: string;
    onCheckChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSetEditing: (mode: TravelMode | null) => void;
    onHover: (mode: TravelMode | null) => void;
    canHighlight: boolean;
}

export const TravelModeControl = forwardRef<HTMLDivElement, TravelModeControlProps>(
    ({ mode, icon, name, isChecked, isEditing, value, onCheckChange, onTimeChange, onSetEditing, onHover, canHighlight }, ref) => {

        const handleContainerClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isChecked && !isEditing) {
                onSetEditing(mode);
            }
        };

        const handleInputBlur = () => {
            onSetEditing(null);
        };

        return (
            <div
                ref={ref}
                title={name}
                className={`flex items-center p-1.5 rounded-lg transition-all duration-200 ${isChecked ? 'bg-white shadow-sm ring-1 ring-rose-200' : 'bg-transparent'} ${isChecked && !isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                onMouseEnter={() => { if (canHighlight) onHover(mode); }}
                onMouseLeave={() => onHover(null)}
                onClick={handleContainerClick}
            >
                <label className={`flex items-center gap-1 cursor-pointer ${isChecked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-400'}`} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" value={mode} checked={isChecked} onChange={onCheckChange} className="sr-only" />
                    {icon}
                </label>
                {isChecked && (
                    <div className="ml-1 flex-shrink-0 w-12 text-sm">
                        {isEditing ? (
                            <input
                                type="number"
                                value={value}
                                onChange={onTimeChange}
                                onClick={e => e.stopPropagation()}
                                onBlur={handleInputBlur}
                                placeholder="Time"
                                step={5}
                                min="0"
                                className="p-1 w-10 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-rose-500 text-gray-900 bg-transparent text-sm text-center"
                                autoFocus
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full px-1 text-sm">
                                <span className="font-semibold text-gray-800">{value}</span>
                                <span className="text-gray-500 ml-1">min</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    });
