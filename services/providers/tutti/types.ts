export interface TuttiListingNode {
    listingID: string;
    title: string;
    body: string;
    timestamp: string;
    formattedPrice: string;
    thumbnail: {
        normalRendition: { src: string };
    };
    images: {
        rendition: {
            src: string;
        };
    }[];
    properties: {
        label: string;
        text: string;
    }[];
    address: string;
    postcodeInformation: {
        postcode: string;
        locationName: string;
    };
    coordinates: {
        latitude: number;
        longitude: number;
    } | null;
    seoInformation: {
        deSlug: string;
    };
}

export interface TuttiApiResponse {
    data: {
        searchListingsByQuery: {
            listings: {
                edges: { node: TuttiListingNode }[];
                totalCount: number;
            };
        };
    };
}