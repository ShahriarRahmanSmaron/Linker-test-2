import { supabase } from './supabase';

// Use relative path to leverage Vite proxy, or VITE_API_URL if set
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Singleton refresh lock to prevent concurrent token refreshes.
 * This is critical because Supabase's "detect compromised refresh tokens" feature
 * will revoke ALL tokens if it sees the same refresh token used multiple times.
 */
let refreshPromise: Promise<string | null> | null = null;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL_MS = 15000; // Don't refresh more than once per 15 seconds

/**
 * Get a valid access token, refreshing if needed.
 * Uses a singleton lock to prevent concurrent refreshes that would trigger
 * Supabase's replay attack detection.
 */
async function getValidToken(): Promise<string | null> {
    // First try getSession - Supabase client should auto-refresh if token is expired
    let { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('[API] Error getting session:', error);
        return null;
    }
    
    if (!session) {
        // No session at all
        return null;
    }
    
    // Check if the token is about to expire (within 60 seconds)
    const tokenPayload = parseJwt(session.access_token);
    const expiresAt = tokenPayload?.exp ? tokenPayload.exp * 1000 : 0;
    const now = Date.now();
    const bufferMs = 60 * 1000; // 60 second buffer
    
    if (expiresAt && expiresAt - now < bufferMs) {
        // Token is about to expire - need to refresh
        // But first check if we recently refreshed (to avoid triggering replay detection)
        if (now - lastRefreshTime < MIN_REFRESH_INTERVAL_MS) {
            console.log('[API] Skipping refresh - too soon since last refresh');
            return session.access_token;
        }
        
        // If another refresh is already in progress, wait for it
        if (refreshPromise) {
            console.log('[API] Waiting for existing refresh...');
            return refreshPromise;
        }
        
        // Start a new refresh
        console.log('[API] Token expiring soon, refreshing...');
        refreshPromise = doRefresh(session.access_token);
        
        try {
            return await refreshPromise;
        } finally {
            refreshPromise = null;
        }
    }
    
    return session.access_token;
}

/**
 * Perform the actual token refresh
 */
async function doRefresh(fallbackToken: string): Promise<string> {
    try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
            console.error('[API] Error refreshing session:', refreshError);
            return fallbackToken;
        }
        
        if (refreshData.session) {
            console.log('[API] Token refreshed successfully');
            lastRefreshTime = Date.now();
            return refreshData.session.access_token;
        }
        
        return fallbackToken;
    } catch (e) {
        console.error('[API] Unexpected error during refresh:', e);
        return fallbackToken;
    }
}

/**
 * Parse JWT token to get payload (for expiration check)
 */
function parseJwt(token: string): { exp?: number } | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('[API] Error parsing JWT:', e);
        return null;
    }
}

export const api = {
    async request(endpoint: string, options: FetchOptions = {}, isRetry = false, providedToken?: string) {
        const requestStart = performance.now();
        // Use provided token if available (e.g., from fresh login), otherwise get from session
        const token = providedToken || await getValidToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        // Add a hard timeout to avoid hanging forever on network/proxy issues
        const controller = new AbortController();
        const timeoutMs = 15000;
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

        let response: Response;
        try {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal,
            });
        } finally {
            window.clearTimeout(timeoutId);
        }

        const requestMs = Math.round(performance.now() - requestStart);
        if (endpoint.startsWith('/auth/')) {
            console.log(`[API] ${options.method || 'GET'} ${endpoint} -> ${response.status} (${requestMs}ms)`);
        }

        if (response.status === 401 && !isRetry) {
            // Token might have expired between check and request
            // Check if we can safely refresh (not too soon after last refresh)
            const now = Date.now();
            if (now - lastRefreshTime < MIN_REFRESH_INTERVAL_MS) {
                // Too soon - the token was just refreshed, this is a real auth failure
                console.error('[API] Got 401 right after refresh - session is invalid');
                await supabase.auth.signOut();
                const isAdminRoute = window.location.pathname.startsWith('/admin');
                window.location.href = isAdminRoute ? '/admin-login' : '/login';
                return response;
            }
            
            // Try to refresh the session and retry once
            console.log('[API] Got 401, attempting token refresh...');
            
            // Use the singleton refresh to avoid triggering replay detection
            if (refreshPromise) {
                console.log('[API] Waiting for existing refresh...');
                await refreshPromise;
            } else {
                refreshPromise = (async () => {
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshError || !refreshData.session) {
                        return null;
                    }
                    lastRefreshTime = Date.now();
                    return refreshData.session.access_token;
                })();
                
                try {
                    const newToken = await refreshPromise;
                    if (!newToken) {
                        console.error('[API] Token refresh failed, signing out');
                        await supabase.auth.signOut();
                        const isAdminRoute = window.location.pathname.startsWith('/admin');
                        window.location.href = isAdminRoute ? '/admin-login' : '/login';
                        return response;
                    }
                } finally {
                    refreshPromise = null;
                }
            }
            
            // Retry the request with the new token
            console.log('[API] Token refreshed, retrying request...');
            return this.request(endpoint, options, true);
        }
        
        if (response.status === 401 && isRetry) {
            // Even retry failed - sign out
            console.error('[API] Retry with refreshed token also failed, signing out');
            await supabase.auth.signOut();
            const isAdminRoute = window.location.pathname.startsWith('/admin');
            window.location.href = isAdminRoute ? '/admin-login' : '/login';
        }

        return response;
    },

    get(endpoint: string, options: FetchOptions = {}, token?: string) {
        return this.request(endpoint, { ...options, method: 'GET' }, false, token);
    },

    post(endpoint: string, data: any, options: FetchOptions = {}, token?: string) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        }, false, token);
    },

    put(endpoint: string, data: any, options: FetchOptions = {}, token?: string) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        }, false, token);
    },

    delete(endpoint: string, options: FetchOptions = {}, token?: string) {
        return this.request(endpoint, { ...options, method: 'DELETE' }, false, token);
    },
};
