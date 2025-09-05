import React from 'react';
import { Property, SearchMetadata } from '../../../types';
import { EmailPropertyCard } from './EmailPropertyCard';

interface NewPropertyAlertEmailProps {
    properties: Property[];
    metadata: Partial<SearchMetadata>;
    daysCutoff: number;
}

export const NewPropertyAlertEmail: React.FC<NewPropertyAlertEmailProps> = ({ properties, metadata, daysCutoff }) => {
    const hasProperties = properties && properties.length > 0;
    // A search is considered "run" if we have destination coordinates, which are a prerequisite for a useful email.
    const hasSearched = metadata.destinationCoords !== undefined;

    const initialText = "Click 'Generate' in the popup controls to see new properties.";
    const noResultsText = "No new properties found for this period.";
    const resultsText = `We found ${properties.length} new properties that match your search criteria from the last ${daysCutoff} day(s).`;
    
    let bodyText = initialText;
    if (hasSearched) {
        bodyText = hasProperties ? resultsText : noResultsText;
    }

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>New Property Alert</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                <style>{`
                    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
                    .line-clamp-2 {
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        max-height: 3.5rem; /* Fallback for 2 lines of text-lg */
                    }
                `}</style>
            </head>
            <body className="bg-gray-100">
                <div className="mx-auto" style={{ maxWidth: '800px', width: '100%' }}>
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">New Property Alert!</h1>
                        <p className="text-gray-600 mb-6">
                           {bodyText}
                        </p>
                        
                        {hasProperties && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {properties.map(prop => <EmailPropertyCard
                                    key={prop.id}
                                    property={prop}
                                    destinationCoords={metadata.destinationCoords || null}
                                />)}
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
};