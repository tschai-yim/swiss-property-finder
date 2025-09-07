import React, { useState, useCallback, useMemo } from 'react';
import { FilterCriteria, DebugConfig, StoredExcludedProperty, SearchMetadata } from '../../types';
import { trpc } from '../../utils/trpc';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelopeOpenText, faDesktop, faMobileScreenButton } from '@fortawesome/free-solid-svg-icons';

interface EmailPrototypePopupProps {
    onClose: () => void;
    filters: FilterCriteria;
    debugConfig: DebugConfig;
    excludedProperties: StoredExcludedProperty[];
}

type DisplayState = 'initial' | 'loading' | 'preview' | 'error';

export const EmailPrototypePopup: React.FC<EmailPrototypePopupProps> = ({ onClose, filters, debugConfig, excludedProperties }) => {
    const [daysCutoff, setDaysCutoff] = useState(3);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [emailHtml, setEmailHtml] = useState<string>('');
    const [displayState, setDisplayState] = useState<DisplayState>('initial');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const fetchNewProperties = trpc.email.fetchNewProperties.useMutation();
    const renderEmailTemplate = trpc.email.renderEmailTemplate.useMutation();

    const handleSearch = useCallback(async () => {
        setDisplayState('loading');
        setEmailHtml('');
        
        try {
            const report = await fetchNewProperties.mutateAsync({
                filters, 
                debugConfig, 
                excludedProperties, 
                daysCutoff,
            });

            const html = await renderEmailTemplate.mutateAsync({
                properties: report.properties,
                metadata: { ...report.metadata, filteredResults: report.metadata.filteredResults ?? 0 } as SearchMetadata,
                daysCutoff,
            });
            
            setEmailHtml(html);
            setDisplayState('preview');

        } catch (e) {
            console.error("Email prototype search failed:", e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            setLoadingMessage(`An error occurred: ${errorMessage}`);
            const errorHtml = `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:2rem;}</style></head><body><h1>Error</h1><p>Could not generate email prototype.</p><pre>${errorMessage}</pre></body></html>`;
            setEmailHtml(errorHtml);
            setDisplayState('error');
        }
    }, [daysCutoff, filters, debugConfig, excludedProperties, fetchNewProperties, renderEmailTemplate]);

    const isLoading = useMemo(() => displayState === 'loading', [displayState]);

    const renderContent = () => {
        switch (displayState) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-4 bg-white/50 border-2 border-dashed border-gray-300 rounded-md">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                        <p className="font-semibold">{loadingMessage}</p>
                    </div>
                );
            case 'preview':
            case 'error':
                return (
                    <div className="w-full h-full bg-white shadow-lg rounded-md overflow-hidden">
                        <iframe
                            srcDoc={emailHtml}
                            title="Email Preview"
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                        />
                    </div>
                );
            case 'initial':
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4 bg-white/50 border-2 border-dashed border-gray-300 rounded-md">
                        <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-5xl mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-700">Ready to Generate Email</h3>
                        <p className="mt-1">Adjust the settings above and click "Generate" to preview the notification.</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[5000] flex items-center justify-center p-4 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="p-4 border-b flex items-start sm:items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Email Notification Prototype</h2>
                        <p className="text-sm text-gray-500">Preview new listings found since your last visit.</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                         <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => setViewMode('desktop')}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            ><FontAwesomeIcon icon={faDesktop} className="mr-1.5" />Desktop</button>
                            <button
                                onClick={() => setViewMode('mobile')}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            ><FontAwesomeIcon icon={faMobileScreenButton} className="mr-1.5" />Mobile</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="days-cutoff" className="text-sm font-medium text-gray-700">New in last</label>
                            <input
                                type="number"
                                id="days-cutoff"
                                value={daysCutoff}
                                onChange={e => setDaysCutoff(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                                min="1"
                                className="w-16 p-2 border rounded-md shadow-sm text-gray-900"
                            />
                            <span className="text-sm text-gray-700">days</span>
                            <button 
                                onClick={handleSearch} 
                                disabled={isLoading}
                                className="ml-2 bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors disabled:bg-gray-300 flex items-center"
                            >
                                {isLoading ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Searching...</>
                                ) : "Generate"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-2 sm:p-6 bg-gray-200">
                    <div className={`mx-auto transition-all duration-300 w-full h-full ${viewMode === 'desktop' ? 'max-w-6xl' : 'max-w-sm'}`}>
                        {renderContent()}
                    </div>
                </div>

                <div className="p-3 border-t text-right bg-white rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailPrototypePopup;