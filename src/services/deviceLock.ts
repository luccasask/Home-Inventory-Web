// A local screen lock, never a substitute for Supabase authentication/RLS.
export interface PinRecord { salt: string; hash: string; failures: number; blockedUntil: number }
const prefix = 'inventory-device-pin-v1:';
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));
export const pinKey = (user: string) => prefix + user;
export function readPin(user: string): PinRecord | null {
  const raw = localStorage.getItem(pinKey(user));
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (typeof record.salt === 'string' && typeof record.hash === 'string'
      && Number.isFinite(record.failures) && Number.isFinite(record.blockedUntil)) return record;
  } catch { /* A damaged record requires fresh email authentication, not a silent reset. */ }
  throw new Error('Skärmlåset kunde inte läsas. Logga in via mejl igen.');
}
async function hash(pin: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: decode(salt), iterations: 210_000, hash: 'SHA-256' }, key, 256);
  return encode(new Uint8Array(bits));
}
export async function createPin(user: string, pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error('Välj fyra siffror.');
  const salt = encode(crypto.getRandomValues(new Uint8Array(16)));
  const record: PinRecord = { salt, hash: await hash(pin, salt), failures: 0, blockedUntil: 0 };
  localStorage.setItem(pinKey(user), JSON.stringify(record));
}
export async function checkPin(user: string, pin: string, now = Date.now()) {
  const record = readPin(user);
  if (!record) throw new Error('Skärmlåset saknas.');
  if (record.blockedUntil > now) return { ok: false, blockedUntil: record.blockedUntil };
  const actual = await hash(pin, record.salt);
  const ok = actual === record.hash;
  const failures = ok ? 0 : record.failures + 1;
  const blockedUntil = !ok && failures >= 5 ? now + Math.min(900_000, 30_000 * 2 ** (failures - 5)) : 0;
  localStorage.setItem(pinKey(user), JSON.stringify({ ...record, failures, blockedUntil }));
  return { ok, blockedUntil };
}
