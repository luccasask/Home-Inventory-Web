import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
export const inventoryId = import.meta.env.VITE_INVENTORY_ID?.trim() ?? '';

function isPublicKey(value: string) {
  if (value.startsWith('sb_publishable_')) return true;
  try {
    const payload = value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).role === 'anon';
  } catch { return false; }
}

export const configurationError = !url || !key || !inventoryId
  ? 'Supabase-anslutningen saknar konfiguration.'
  : !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || !isPublicKey(key)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inventoryId)
    ? 'Supabase-konfigurationen är ogiltig. Använd endast en publik API-nyckel.' : null;

export const supabase = configurationError ? null : createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
