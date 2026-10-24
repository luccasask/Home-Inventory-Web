const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key, VITE_INVENTORY_ID: id } = process.env;
if (!url || !key || !id) throw new Error('Configure the three VITE_* repository variables before deploying.');
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) throw new Error('Invalid Supabase URL.');
let publicKey = key.startsWith('sb_publishable_');
if (!publicKey) {
  try { publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch {}
}
if (!publicKey) throw new Error('Only a publishable or legacy anon key can be used in the frontend.');
if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid inventory UUID.');
console.log('Public web configuration validated.');
