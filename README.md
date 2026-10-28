# Home Inventory Web

React + TypeScript + Vite home inventory browser, based on the three supplied Swedish mobile references. Nunito Sans is bundled locally; icons use Lucide React.

## This version

- Responsive home, location, and nested storage browsing.
- Back, parent, home, and refresh controls.
- Stable hash links and a missing-link state.
- App manifest, standalone display, PNG icons, and Apple touch icon.
- Search across the entire inventory, ranked results, type filters, and list/grid views. List results show their parent path; each query/filter/view retains its scroll position during the app session.
- Visual add/edit form with existing-place selection; database saving and deleting remain disabled.
- Touch/pen swipes: right returns a directly opened search result to its original query and filter; other items go to their parent, editors return to the edited item, and main panels follow menu order. Left moves to the next main panel. Vertical scrolling and form controls retain native interactions.

**Content is private and loaded from Supabase after owner authentication.** Sign in by email once per browser/device, then create a four-digit local screen lock. Sessions persist and refresh automatically; clearing browser data or revoking a session requires email authentication again. Supabase owner RLS protects reads and writes; the PIN is only a local screen lock, not server authorization. Public anonymous reading has been revoked. Existing item IDs and public UUIDs are preserved.

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
- `src/services/supabase.ts`: public-key client configuration with persistent PKCE authentication.
- `src/components/AuthBoundary.tsx`: email login, owner access verification and screen locking.
- `src/services/deviceLock.ts`: per-account salted PBKDF2 PIN hashes and local retry cooldowns.
- `src/services/inventoryRepository.ts`: inventory-scoped reads and owner mutation RPCs.
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

The historical `202610240002_public_web_read.sql` enabled anonymous reading. Private activation removes that policy, revokes anonymous item access, and assigns the inventory's `owner_id` to the explicitly approved Supabase Auth account. Do not rerun that public-read migration or the original Java bootstrap migration. Existing desktop-role policies and hierarchy constraints remain active.

`supabase/rollback_public_web_read.sql` revokes the web reading added by this migration without removing any inventory records. Privileged migrations should be run only from a trusted administrator session, never from the frontend or GitHub Pages build.

`202610270001_owner_web_mutations.sql` adds revisions, narrowly scoped authenticated grants and invoker RPCs. Existing owner RLS remains the authorization boundary. Save checks the draft's revision, serializes inventory changes and supports retry-safe creation with client-generated public UUIDs. Delete checks the root revision and atomically deletes its complete subtree, including associated item-tag links through the existing cascade. Existing constraints forbid cycles, object parents, location-type conversion, and converting a populated container to an object. Privileged SQL and owner assignment are never run from the frontend or Pages build.

Supabase Authentication Site URL must be `https://luccasask.github.io/Home-Inventory-Web/`; any local testing redirect must be explicitly allowlisted. Initial sign-in uses a six- or eight-digit email OTP, entered directly into the browser where the session should be saved. It does not rely on opening links in the original browser. The client still supports existing PKCE callbacks for older links. Set the Magic Link email template to include `{{ .Token }}` rather than `{{ .ConfirmationURL }}`. For example: `<h2>Din inloggningskod</h2><p>{{ .Token }}</p>`. Create/invite the approved owner account administratively; the frontend uses `shouldCreateUser: false` and offers no registration. Configure custom SMTP for reliable email delivery: Supabase's default mailer only supports project-team addresses and two emails per hour across the project. This cannot be raised without custom SMTP or a Send Email hook. Do not disable email confirmation to work around the limit. Never place SMTP credentials or a service-role key in Vite configuration.

Sending and verification are separate forms: an existing code can be verified even during a resend cooldown or sending-rate limit. The code field is cleared when the email changes and after successful verification. Delivery quotas, unauthorized email recipients, missing PKCE verifiers and expired codes have distinct Swedish messages. Neither the email code nor the PIN is logged or persisted by the UI; only Supabase's authenticated session and the local salted PIN hash are retained.

Owner-visible category tags are loaded with their Lucide icon names. A selected category determines the item icon in headers, lists and grids; untagged records retain manual overrides or their type default (MapPin/Package/Box). No arbitrary SVG or remote icon assets are loaded from the database.

`202610280001_category_tags.sql` marks selectable categories using `tags.web_category` and adds a scoped `items.category_tag_id` foreign key. The single-choice category is independent of the legacy `item_tags` detail relationships: those existing relationships remain intact. The invoker `web_save_tagged_item` saves name/type/placement/description/category atomically with the existing revision checks and hierarchy guard. Older clients can still save unrelated fields through the original RPC without clearing the category. Cross-inventory tags and unapproved detail tags are rejected. Tags are owner-readable; anonymous access and tag editing remain denied.

`supabase/category_tags.sql` seeds 23 unique choices, reusing matching legacy tag IDs. The duplicated Förvaring entries were merged at the owner's request into one Package tag. It also performs the authorized one-time classification of existing OBJECT rows; locations and storage retain their default icons until a category is explicitly selected. Metadata, names, placement, public IDs and all legacy tag links are preserved. Keep a local recovery snapshot before applying the seed. BrushCleaning is vendored from official Lucide under its included ISC notice because the pinned package predates that icon.

The app locks on page hiding/reopening and also offers a lock button. Incorrect local PIN attempts have a persistent cooldown after five failures. PIN recovery signs out locally and requires a new email session before resetting the device PIN, including callbacks in a new tab. The session remains managed by Supabase, separate from this screen lock. On unlock, focus or restored connectivity, inventory reads are coalesced and refreshed without replacing active drafts or resetting search scroll positions. No offline item cache is persisted.

## Search

Open the search icon in the bottom navigation. The field and separator are visible at the top immediately; results update while typing. An empty query shows all items, respecting the selected type filter. Results search all loaded items, independently of their parents; opening a result uses the item's existing stable URL.

Ranking prioritizes exact names, name prefixes, partial names, all query words in the name, descriptions, ancestor placement, and finally small spelling mistakes in names. Swedish letters remain distinct. Category names, legacy detail tags, synonyms and hypernyms are not included in search ranking in this version.

The three type buttons select locations, storage, or objects. Select the active filter again to show all types. Type and view controls share one outlined toolbar, and selected icons are filled. One button toggles list/grid. A second button cycles recent → category tag → Swedish A–Ö. Both settings are shared with Home and browsing and saved locally. Recent uses descending database bigint identity (insertion order); tag sorting groups by category name with untagged items last, then sorts names within each group. The active icon changes with each mode. Search matching remains unchanged; the chosen ordering applies to every match. The query and optional type filter are kept in the hash URL (`#/search?q=kastrull&type=OBJECT`) using replacement while typing, so reload and browser Back restore the search without a history entry for every character.

Type filters use navy for locations, teal for storage and yellow for objects. Selected icons are entirely filled; unselected icons retain their Lucide outlines. View selection is distinguished by a subtle neutral tile and the corresponding icon.

## Visual design

The approved lighter design keeps the coral background and cream panels, with 2px card/field borders, 1.75px outline icons and 16–18px corner radii. Headings and titles use the bundled 700 weight, labels 600 and body text 400. Browsing/search toolbars share an 83px white surface with a subtle shadow instead of an orange frame. Add fields use neutral borders and type-colored text/icons; valid Save uses a pale teal surface and teal border. Save still stays disabled and gray until required values are valid.

The white 3px main-menu indicator remains under the active Home, Search or Add icon and slides between them over 200ms. Selected main icons still lift slightly. List/grid, route, hover and bounce behavior remain unchanged. List add tiles show a circle-plus, label and chevron while retaining contextual placement.

## Pull to refresh in installed apps

In standalone/home-screen mode, a single-finger downward drag of at least 150px from the top of browsing/search content moves the whole UI with resistance. Releasing beyond the threshold reloads the page so both inventory data and the current deployed JavaScript are fetched. Short pulls settle back without reloading. The normal browser version retains native behavior. The existing persistent sign-in remains saved; full reload returns to the local PIN lock as usual.

The gesture is disabled in Add/Edit, with dialogs, form controls, an active keyboard, pinch zoom, scrolled-down content, loading and view transitions. Horizontal intent is left to the existing swipe navigation. Navigation, hiding the page or a second finger cancels a pending pull. A dragged card cannot accidentally open on release. Gesture classification and eligibility have automated tests; physical iPhone standalone touch handling still requires device testing.

## Add and edit items

The rightmost bottom-navigation icon and the add tile open `#/add`. Save becomes enabled when name, type and placement are valid. Drafts stay in component memory and are reset when leaving and returning, including quick navigation during a page slide. Drafts are not stored in local storage or the URL. Locking and unlocking preserves an active draft; background refresh retains its original revision to prevent silently overwriting external changes.

Fields are name (up to 120 characters), type (location/storage/object), placement, description (up to 200 words, with a live counter and paste truncation), and one optional category tag. The selected tag's icon appears beside the picker; choosing no tag restores the type/manual default. Leaving without saving discards category changes with the rest of the draft. The placement selector includes existing locations and containers with full paths, plus Mitt hem. Locations can only be placed within locations or at the root; editing excludes self and descendants. Changing placement moves the same item with its identity and contents intact.

The Save button is gray until required fields are valid, then turns teal and submits an owner-authorized database operation. Duplicate submissions are blocked while a request is in progress. Errors retain the draft; successful saves open the saved item's page.

## Edit and delete

The pencil-folder control opens `#/add/<public-id>` with existing values prefilled. The gray trash control opens a confirmation dialog. Cancel, Escape or clicking outside dismisses it without changing data. Radera permanently deletes the item and all descendants in a single database transaction. Save/Delete errors remain visible and do not report success.

Leaving the editor discards its local changes. Returning starts from the original inventory record again; opening normal Add starts empty and hides Delete. Existing storage parents and root-level placement (`Mitt hem`) are preserved. New placement choices exclude the edited location itself and its descendants. Invalid edit links display an unavailable-item state instead of a blank creation form.

## Panel navigation

Main-menu clicks follow the visual order Home → Search → Add. Selecting a panel to the left moves the outgoing page to the right and brings the selected page in from the left; selecting a panel to the right reverses this. Opening items (including search results), parent links, and browser Back/Forward retain their separate direction rules. Transitions remain 200ms without delaying navigation.

Inventory actions, search controls, and Save share the Home toolbar's dimensions and placement: 83px high and full available width on mobile, capped at 520px on desktop.
