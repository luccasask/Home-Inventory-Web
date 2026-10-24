# Home browsing verification

Verified locally on 24 October 2026.

- TypeScript project compilation passed.
- Vite production build passed.
- Production build served and exercised in the in-app browser.
- Home → Lägenhet → Kök navigation passed using existing Supabase records.
- Parent, back, home, and database refresh controls passed.
- Nested storage URL survived reload.
- Missing storage URL displayed a recovery link; recovery returned home.
- Search, add, edit, and delete controls remained disabled.
- Browser console: no warnings/errors observed during the tested interactions.
- Visual checks at 430 × 932, 320 × 640, and 1440 × 1000.
- No horizontal overflow observed at 320px or 1440px.
- HTTP readiness check returned 200.
- Git whitespace check passed.

- Live Supabase API returned all 53 existing rows (9 locations, 13 storage containers, 31 objects).
- API serializes bigint item/parent IDs as text, avoiding JavaScript precision loss.
- Anonymous SQL role can read exactly the target inventory's rows.
- Anonymous INSERT, UPDATE, DELETE, and access to tags, assignments, access mappings, and auth.users are blocked by privilege checks.
- Public REST requests to tags, item_tags, inventory_access, and inventories returned HTTP 401.
- Four domain tests passed: bigint safety, identity/parent preservation, partial/cyclic hierarchy rejection, unsupported-type rejection.
- `.env.local` is ignored by Git. Only public project configuration is exposed in the frontend build.

Limits: public read-only access was explicitly requested; no sign-in or data mutations are implemented. No physical NFC scans, iPhone installation, or live GitHub deployment were tested. Existing Java files and inventory contents were not modified. One additive database migration enabled public reading of the selected inventory; a rollback script is included.
