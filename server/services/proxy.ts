import { proxyEnabled } from "../../utils/env";

const PROXY_URLS = [
    'https://corsproxy.io/?',
    // 'https://api.allorigins.win/raw?url='
];

let currentProxyIndex = 0;

/**
 * Wraps a URL with a CORS proxy, rotating through a list of available proxies.
 * This distributes the load across different services.
 * @param url The URL to proxy.
 * @returns The proxied URL.
 */
export const proxy = (url: string) => {
    if (!proxyEnabled) {
        return url;
    }
    const proxyUrl = PROXY_URLS[currentProxyIndex];
    
    // Move to the next proxy for the subsequent request (round-robin)
    currentProxyIndex = (currentProxyIndex + 1) % PROXY_URLS.length;
    
    return `${proxyUrl}${encodeURIComponent(url)}`;
    // return `http://localhost:8080/${url}`;
};