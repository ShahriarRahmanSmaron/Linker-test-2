import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

const SUPABASE_FETCH_TIMEOUT_MS = Number(import.meta.env.VITE_SUPABASE_FETCH_TIMEOUT_MS ?? 15000);

// Prevent "infinite pending" Supabase requests when the network is blocked/unreachable.
// This is especially helpful during login flows where the UI otherwise appears stuck.
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);

  // If a caller provided a signal, propagate its abort into our controller.
  // (We can't reliably merge signals across all browsers without AbortSignal.any.)
  if (init?.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

