# Home Inventory Web

React + TypeScript + Vite home inventory browser, based on the three supplied Swedish mobile references. Nunito Sans is bundled locally; icons use Lucide React.

## This version

- Responsive home, location, and nested storage browsing.
- Back, parent, home, and refresh controls.
- Stable hash links and a missing-link state.
- App manifest, standalone display, PNG icons, and Apple touch icon.
- Search across the entire inventory, ranked results, type filters, and list/grid views.
- Visual add-item form with existing-place selection; saving, editing, and deleting are disabled.

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

Open the search icon in the bottom navigation. The first nonblank character moves the centered field to the top; results update immediately while typing. Enter, the mobile keyboard's search action, and the search button dismiss the keyboard without being required for searching. Clearing the query returns the field to the center. Results search all loaded items, independently of their parents; opening a result uses the item's existing stable URL.

Ranking prioritizes exact names, name prefixes, partial names, all query words in the name, descriptions, ancestor placement, and finally small spelling mistakes in names. Swedish letters remain distinct. Tags, synonyms, and hypernyms are not searched: the public web role has no access to that data and no new database access is granted.

The three type buttons select locations, storage, or objects. Select the active filter again to show all types. Type and view controls share one outlined toolbar, and selected icons are filled. List/grid selection is shared with browsing and saved locally. The query and optional type filter are kept in the hash URL (`#/search?q=kastrull&type=OBJECT`) using replacement while typing, so reload and browser Back restore the search without a history entry for every character.

## Add-item preview

The rightmost bottom-navigation icon and the add tile open `#/add`. This is a visual form only: the Save button is disabled, form submission is prevented, and no database write service is connected. Drafts stay in component memory and are reset when leaving and returning, including quick navigation during a page slide. Drafts are not stored in local storage or the URL.

Fields are name (up to 120 characters), type (location/storage/object), an existing location, and description (up to 200 words, with a live counter and paste truncation). The location selector includes only existing `LOCATION` records and shows full paths to distinguish matching names. Tags are deferred. The bottom menu marks the current inventory, search, or add section with a light underline.

The Save button is gray until a nonblank name, a valid type, and an existing location are selected; it then turns teal as a visual readiness cue. It remains disabled in this preview and never writes data.

## Edit preview

The pencil-folder control on an item's browsing page opens `#/add/<public-id>` in the same Add panel, with name, type, actual parent placement, and description prefilled. Edit mode adds a gray, disabled delete control below the description. Save and Delete remain disabled; no write privileges, authentication changes, or database mutation calls are introduced.

Leaving the editor discards its local changes. Returning starts from the original inventory record again; opening normal Add starts empty and hides Delete. Existing storage parents and root-level placement (`Mitt hem`) are preserved. New placement choices exclude the edited location itself and its descendants. Invalid edit links display an unavailable-item state instead of a blank creation form.

## Panel navigation

Main-menu clicks follow the visual order Home → Search → Add. Selecting a panel to the left moves the outgoing page to the right and brings the selected page in from the left; selecting a panel to the right reverses this. Opening items (including search results), parent links, and browser Back/Forward retain their separate direction rules. Transitions remain 200ms without delaying navigation.

Inventory actions, search controls, and the disabled Save button share the Home toolbar's dimensions and placement: 83px high and full available width on mobile, capped at 520px on desktop.
