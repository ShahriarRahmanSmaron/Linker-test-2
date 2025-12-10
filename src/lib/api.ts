import { supabase } from './supabase';

// Use relative path to leverage Vite proxy, or VITE_API_URL if set
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const api = {
    async request(endpoint: string, options: FetchOptions = {}) {
        // Get Supabase JWT token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired or invalid - sign out from Supabase
            await supabase.auth.signOut();
            // Redirect to appropriate login page based on current URL
            const isAdminRoute = window.location.pathname.startsWith('/admin');
            window.location.href = isAdminRoute ? '/admin-login' : '/login';
        }

        return response;
    },

    get(endpoint: string, options: FetchOptions = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint: string, data: any, options: FetchOptions = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(endpoint: string, data: any, options: FetchOptions = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(endpoint: string, options: FetchOptions = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },
};
