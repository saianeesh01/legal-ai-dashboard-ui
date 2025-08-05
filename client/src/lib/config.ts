// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to build API URLs
export function buildApiUrl(endpoint: string): string {
    // If endpoint already starts with http, return as is
    if (endpoint.startsWith('http')) {
        return endpoint;
    }

    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Build full URL
    return `${API_BASE_URL}/${cleanEndpoint}`;
} 