import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function isValidSupabaseUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

const looksLikePlaceholder =
    SUPABASE_URL.includes('your_supabase_url_here') ||
    SUPABASE_ANON_KEY.includes('your_supabase_anon_key_here');

export const hasSupabaseConfig =
    isValidSupabaseUrl(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    !looksLikePlaceholder;

if (!hasSupabaseConfig) {
    console.error('Invalid Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.local');
}

// Keep app booting even when env vars are placeholders; auth methods will guard usage.
const clientUrl = hasSupabaseConfig ? SUPABASE_URL : 'http://localhost';
const clientKey = hasSupabaseConfig ? SUPABASE_ANON_KEY : 'invalid-anon-key';

export const supabase = createClient(clientUrl, clientKey);
