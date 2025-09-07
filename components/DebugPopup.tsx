import React, { useEffect, useRef } from 'react';
import { DebugConfig } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface DebugPopupProps {
    config: DebugConfig;
    onConfigChange: (newConfig: Partial<DebugConfig>) => void;
    onClose: () => void;
    allProviders: string[];
}

const DebugPopup: React.FC<DebugPopupProps> = ({ config, onConfigChange, onClose, allProviders }) => {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const handleProviderToggle = (providerName: string, isEnabled: boolean) => {
        const currentProviders = config.enabledProviders;
        const newProviders = isEnabled
            ? [...currentProviders, providerName]
            : currentProviders.filter(p => p !== providerName);
        onConfigChange({ enabledProviders: newProviders });
    };

    return (
        <div ref={popupRef} className="absolute top-20 left-4 bg-white rounded-lg shadow-2xl border z-[5000] p-4 w-80 animate-fade-in-fast">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Debug Configuration</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                    <label htmlFor="debug-enabled" className="font-semibold text-gray-700">Enable Debug Mode</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="debug-enabled"
                            checked={config.enabled}
                            onChange={e => onConfigChange({ enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-rose-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                </div>

                {config.enabled && (
                    <div className="space-y-4 border-t pt-4">
                        {/* Request Limit */}
                        <div>
                            <label htmlFor="request-limit" className="block text-sm font-medium text-gray-700 mb-1">Request Limit per Provider</label>
                            <input
                                type="number"
                                id="request-limit"
                                value={config.requestLimit}
                                onChange={e => onConfigChange({ requestLimit: parseInt(e.target.value, 10) || 0 })}
                                min="0"
                                className="w-full p-2 border rounded-md shadow-sm bg-white text-gray-900 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        {/* Enabled Providers */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enabled Providers</label>
                            <div className="space-y-1">
                                {allProviders.map(provider => (
                                    <div key={provider} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`provider-${provider}`}
                                            checked={config.enabledProviders.includes(provider)}
                                            onChange={e => handleProviderToggle(provider, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                                        />
                                        <label htmlFor={`provider-${provider}`} className="ml-2 text-sm text-gray-600">{provider}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Public Transport API Toggle */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="public-transport-api" className="text-sm font-medium text-gray-700">Query Public Transport API</label>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="public-transport-api"
                                    checked={config.queryPublicTransport}
                                    onChange={e => onConfigChange({ queryPublicTransport: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-rose-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugPopup;
