const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const api = {
    async request(endpoint: string, options: FetchOptions = {}) {
        const token = localStorage.getItem('token');

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
            // Token expired or invalid
            localStorage.removeItem('token');
            // Ideally redirect to login, but we'll let the app handle auth state changes
            window.location.href = '/login';
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
