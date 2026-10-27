# Home Inventory Web

React + TypeScript + Vite home inventory browser, based on the three supplied Swedish mobile references. Nunito Sans is bundled locally; icons use Lucide React.

## This version

- Responsive home, location, and nested storage browsing.
- Back, parent, home, and refresh controls.
- Stable hash links and a missing-link state.
- App manifest, standalone display, PNG icons, and Apple touch icon.
- Search across the entire inventory, ranked results, type filters, and list/grid views.
- Add, edit, and delete controls are intentionally disabled.

**Content is loaded directly from the existing Supabase PostgreSQL inventory.** The owner explicitly chose no sign-in and public read-only access. Names, descriptions, hierarchy, and contents of this inventory (including future records) are therefore publicly readable through its API. Other inventories, tags, access mappings, and write operations remain inaccessible to anonymous visitors. Refresh reads current database contents. Existing item IDs and public UUIDs are preserved; no inventory records were inserted, changed, or deleted.

## Run

Use Node.js 22.18+ and pnpm 10+. Copy `.env.example` to `.env.local` and set the Supabase project URL, public publishable key, and existing inventory UUID. The local installation is already configured. Environment files are ignored by Git. Never use a service-role key or database password in Vite configuration.

```sh
pnpm install
pnpm dev
```

Open the printed URL, including `/Home-Inventory-Web/`.

```sh
pnpm build
pnpm preview
pnpm test
```

The build runs TypeScript checks before generating `dist/`.

## Structure

- `src/components`: cards, icons, and navigation controls.
- `src/domain`: typed items, hierarchy utilities, and public-ID routes.
- `src/services/supabase.ts`: public-key client configuration; no authentication session.
- `src/services/inventoryRepository.ts`: paginated, inventory-scoped database reads.
- `src/domain/databaseItems.ts`: database mapping, lossless bigint IDs, and hierarchy validation.
- `src/App.tsx`: browsing state and page composition.
- `src/styles.css`: design colors, spacing, typography, and responsive rules.
- `public`: manifest and application icons.

## GitHub Pages

The Vite base is `/Home-Inventory-Web/`. Hash routes work on page refresh and direct entry without server rewrites. The included GitHub Actions workflow validates configuration, tests, builds and deploys pushes to `main`. GitHub Pages is configured to use **GitHub Actions**. View deployment progress in the repository's Actions tab. The site address is https://luccasask.github.io/Home-Inventory-Web/.

Under Settings → Secrets and variables → Actions → Variables, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_INVENTORY_ID` with the same public configuration as `.env.local`. The workflow rejects missing configuration. The publishable key is public by design and is included in the frontend bundle; RLS is the access boundary.

Example local storage route:

```text
http://127.0.0.1:5174/Home-Inventory-Web/#/storage/ca180de5-45f0-3c6b-8f62-ba7365a53d73
```

Manifest paths are relative to the repository base. On iPhone, use Safari → Share → Add to Home Screen when served over HTTPS. No offline support or service worker is included; physical iPhone installation and NFC scans have not been tested.

## Database access

`supabase/migrations/202610240002_public_web_read.sql` was applied to the existing database after the owner approved public, no-sign-in reading. Do not rerun the original Java bootstrap migration. The additive policy allows `anon` to read the existing inventory's item fields only. Existing desktop-role policies and hierarchy constraints remain active. No authentication tables, tag tables, or administrator credentials are used by the frontend.

`supabase/rollback_public_web_read.sql` revokes the web reading added by this migration without removing any inventory records. Privileged migrations should be run only from a trusted administrator session, never from the frontend or GitHub Pages build.

Tags and tag-derived icons are not loaded in this version, as requested. Known manual Lucide icons are supported; missing/unsupported icons use a type-based or box fallback. Data editing remains outside this version's scope.

## Search

Open the search icon in the bottom navigation. Submit with Enter, the mobile keyboard's search action, or the search button. The centered field moves to the top and results appear below it. Results search all loaded items, independently of their parents; opening a result uses the item's existing stable URL.

Ranking prioritizes exact names, name prefixes, partial names, all query words in the name, descriptions, ancestor placement, and finally small spelling mistakes in names. Swedish letters remain distinct. Tags, synonyms, and hypernyms are not searched: the public web role has no access to that data and no new database access is granted.

The three type buttons select locations, storage, or objects. Select the active filter again to show all types. List/grid selection is shared with browsing and saved locally. The query and optional type filter are kept in the hash URL (`#/search?q=kastrull&type=OBJECT`) so reload and browser Back restore the search.
