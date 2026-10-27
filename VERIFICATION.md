# Home browsing verification

## Text-led heading balance and trailing descriptions — 27 October 2026

- Descriptions follow the complete content list in both modes again. Grid descriptions retain a 20px gap after the icons.
- Header icons stay directly left of their titles. A flexible visual counterweight brings the text toward the panel center: offset 8.5px on 430px screens and 6.5px on 320px screens, with exact text centering at desktop widths. Existing FitText behavior keeps longer titles readable without clipping.
- Browser checks cover Kök and Köksskåp, Add heading at 320px (24px text), grid DOM order and 20px gap, exact desktop title center at 512px on a 1024px screen, no horizontal overflow or console errors. TypeScript, production build and whitespace checks pass. Navigation and database services are unchanged.

## Scoped search return and UI consistency — 27 October 2026

- Only Search result links carry their source search URL in route state. Right swipe on those records restores that exact query/filter. Ordinary child links do not inherit the origin: right swipe follows the real parent again. Editors and main panels restore their previous swipe destinations; Search → Home uses the existing remembered Home route.
- Updated swipe tests cover search origins, ordinary parents, editors, panels and invalid origins. Two new inventory-label tests cover correct Swedish singular/plural and mixed-type counts. All 35 tests pass.
- Removed the obsolete header space reserved for Refresh; icon/title groups are centered. Standardized mobile header top padding at 24px, text/rule spacing at 12–20px, list/form gaps at 16px, form label gaps at 8px, secondary copy at 14px and field labels at 24px (22px on narrow screens).
- Form fields align with the header rule at x=30px on 430px screens and x=17px on 320px screens. Desktop forms retain a readable maximum width. All action panels remain 83px high (520px wide on desktop).
- Content summaries distinguish places, storage and objects instead of calling all children storage. Fixed singular `1 förvaring`/`1 plats`, neutral empty-content copy, parent-link wording and clearer disabled Save/Delete notes. User-owned record names/descriptions are unchanged.
- Visual/browser review covers Home list/grid, nested content and long breadcrumbs, Search filters/results, Add/Edit fields and scrolling, and the delete dialog at 320 × 640, 430 × 932 and 1024 × 900. No horizontal overflow or console errors. Header group center measured at 215px on 430px viewport; secondary text 14px and list gap 16px confirmed.
- TypeScript, production build and whitespace checks pass. Gesture detection is unchanged; the revised destinations are unit-tested. No database writes were added.

## History-based right swipe and grid descriptions — 27 October 2026

- Right swipe now requests a single history Back on all routes, instead of guessing the parent or neighboring panel. React Router's index guards direct entry, so no prior app entry means no navigation. Left swipe and explicit parent/breadcrumb links keep their existing destinations.
- Search typing and filtering still replace the current URL; Back therefore restores the complete query/filter and results without stepping through individual keystrokes. POP animations derive direction from the history index, not an older route's stored direction flag.
- Grid descriptions now precede the icons with a 20px gap. List descriptions retain their previous position below the cards.
- All 32 tests pass; updated swipe cases cover history Back across every panel, no-history/invalid-index guards, loading/missing records and existing gesture detection. TypeScript, production build and whitespace checks pass.
- Browser checks use the same history Back/Forward operation as the new swipe action: filtered `köksskåp` search → result → Back restores both results, query and filter; Forward slides correctly; hierarchy/breadcrumb visits unwind in actual visit order. Grid/list description order checked, no overflow at 320px and no console errors. Physical touch gestures were not re-exercised by the desktop test interface; gesture detection itself is unchanged.

## Fixed search and shared control feedback — 27 October 2026

- Search field/rule are now visible at the top from first entry, with a permanently visible magnifier, `...` placeholder and default `sök efter föremål.` hint. Blank clicks anywhere in the search panel (including its padding) focus the input; links, buttons, filters and result cards retain their own behavior.
- Removed blue outlines from Add fields and confirmation buttons; fields retain a subtle orange focus glow and keyboard-focused confirmation buttons darken slightly.
- A single app-level handler supplies the existing bounce to every enabled button/link, including bottom navigation, breadcrumbs, modal controls and both Add-tile layouts. Disabled controls are excluded. Control wrappers animate, preserving icon hover/selected lifts; navigation remains immediate. Keyboard activation receives feedback too.
- Buttons/links suppress context menus, native link dragging, selection and WebKit touch callouts. Inputs retain their normal editing interactions. Physical iPhone long-press behavior remains a device check.
- Browser checks: initial field top 32px/rule opacity 1/magnifier width 36px, blank/padding focus, live search and result navigation, filter pointer/keyboard bounce, Add-grid bounce and contextual placement, no link menu on right-clicking Add-list tile, normal popup cancellation, computed outline none for Add input/Avbryt, fit at 320 × 640 with no overflow or console errors.
- All 32 existing tests, TypeScript, production build and whitespace checks pass. Database write/delete operations remain disabled.

## Delete confirmation preview — 27 October 2026

- The editor's trash control opens a native modal dialog matching the reference: pale backdrop, red border/warning icon, red Radera and teal Avbryt. Radera is disabled and no deletion callback or data write exists.
- Avbryt, backdrop clicks and Escape dismiss it. Native modal behavior isolates the background; pointer events do not initiate page swipes. Initial focus goes to Avbryt and closing restores the trash control.
- Browser checks cover all three dismissal methods, repeated reopening, draft preservation, disabled Radera, no console errors and fit at 430 × 932 and 320 × 640 (272px-wide dialog, no internal horizontal overflow). TypeScript, production build and whitespace checks pass.

## Type colors, object cards and search text — 27 October 2026

- Add/edit type selector colors its border, text and both icons navy for LOCATION, teal for STORAGE and amber for OBJECT. Other form fields retain their existing colors.
- OBJECT cards omit the chevron; LOCATION/STORAGE retain it in list view. The complete card remains the same Link with the same immediate navigation and gesture handlers.
- Entered search text now uses the placeholder's 400 weight and size, with navy color.
- Browser checks confirm all three type colors, correct arrow presence/absence in Kök's list, successful Kastrull-card navigation, live search and computed search font parity (32px/400), no console errors. TypeScript, production build and whitespace checks pass.

## Contextual Add, search focus and Home return — 27 October 2026

- Browse Add tiles carry the current record's public ID in the add URL. The local draft selects that location/storage, including its full path; Mitt hem selects root. Main-menu Add remains blank. Editing still takes its placement from the edited record.
- The Add context offers only existing locations plus its actual contextual storage, not unrelated containers. Three added tests cover new-context fields, root placement, edit precedence and unavailable storage; all 32 tests pass.
- Empty search moves to the top and reveals its orange rule on input focus. Results remain hidden until a nonempty query; the field stays raised during that visit. Returning to an empty Search starts in its lower position again.
- Home remembers the last valid browsing route during the current app session. From Search/Add it returns there; while browsing, another Home press goes to root. Search's right swipe uses the same remembered destination; item-parent and editor-return swipes remain unchanged.
- Browser checks: list Add from Kök, grid Add from Köksskåp, empty main-menu Add, discarded draft on leaving, Home return from Add/Search followed by root reset, root Add, empty-search focus (form top 419→32px, rule opacity 0→1, no results), no console errors.
- TypeScript, production build and whitespace checks pass. Saving/deleting remain disabled; no database services changed.

## House outline and panel corners — 27 October 2026

- Removed custom fill/door-stroke overrides from the bottom-menu House icon, preserving its standard Lucide outline.
- The rounded inventory panel now clips child backgrounds to its own border radius, removing the square white protrusion along the top corners.
- Visual check at 430px confirms the smooth upper edge; computed House fill is none with both paths cream. At 320 × 640, Add form still scrolls (scrollTop 291), no horizontal overflow or console errors. TypeScript, production build and whitespace checks pass.

## Clickable hierarchy and selected icons — 27 October 2026

- Item headers now expose a labelled breadcrumb navigation with Mitt hem and every ancestor linked to its actual route. Current item is marked aria-current; ancestor links use the existing backward slide.
- Selected Package/Box search filters have a solid navy fill without inverted interior strokes. Filter URL updates and toggling remain unchanged.
- The selected main-menu SVG rises 6px, with a 200ms transform transition; link hit areas and sliding underline stay fixed. Reduced motion disables this transition.
- Browser checks: Kastrull → Lägenhet, breadcrumb → Mitt hem, Kastrull → Kök, search filter changes and live results, filled Package appearance, active/inactive icon transforms, no overflow at 320px and no console errors.
- All 29 existing tests, TypeScript, production build and whitespace checks pass. Database and swipe logic are unchanged.

## Navigation indicator and search polish — 27 October 2026

- Removed the header refresh control and its styles; automatic initial loading and error retry remain intact.
- One persistent bottom-menu indicator slides between the three equal menu columns in 200ms. Item routes select Home; edit routes select Add. Reduced-motion preference disables the slide.
- Empty search field sits 22px below the white panel's midpoint at 320 × 640 and 430 × 932, and 16.5px below at 1024 × 900. Placeholder uses bundled Nunito Sans 400; entered query text retains its existing weight. Results still move the field to the top.
- Browser checks: live results, grid/list switching, opening a result, opening the prefilled editor, panel changes, indicator alignment at all three widths, no horizontal overflow or console errors.
- All 29 existing tests, TypeScript, production build and whitespace checks pass. Swipe logic and database services are unchanged.

## Touch swipe navigation — 27 October 2026

- All 29 domain tests pass; TypeScript and production build pass. Ten gesture tests cover panel order, actual parents independent of history, editor return routes, distance thresholds, diagonal/vertical rejection, cancellation, pointer identity and click suppression intent.
- A clear horizontal touch/pen gesture navigates on release using the existing page slides. Mouse dragging is excluded. Horizontal drags suppress the subsequent card click; inputs, selects, buttons and editable controls are excluded. Vertical scrolling and pinch zoom remain native.
- Browser regression checks: live search, opening a result, opening its prefilled editor, disabled Save/Delete, no horizontal overflow, no console errors. Computed touch action is pan-y pinch-zoom.
- Physical touch behavior and gesture feel still need an iPhone/device check; the desktop browser test interface does not provide touch input.
- No database or authentication changes.

## Edit visual preview — 27 October 2026

- Nineteen domain tests pass, including prefilled draft values, source immutability, string IDs, actual storage parents, root placement, cycle-safe placement choices, and edit-panel navigation.
- Browser checks: pencil control opens the current item; all four fields match the source; Save and Delete remain disabled; changing a draft and leaving does not change the source; reopening restores original values.
- Normal Add remains blank with no delete control. Root-level locations retain Mitt hem; objects inside storage retain that storage. Direct edit reload and unavailable-item recovery were checked.
- Narrow-screen check at 320 × 640 has no horizontal overflow. The editor remains part of the Add menu section.
- Database and authentication services are unchanged; the user explicitly chose the visual preview only.

## Main-panel direction and toolbar sizing — 27 October 2026

- Thirteen tests pass, including all six main-panel directions and regressions for search-result, parent, and browser-history navigation.
- Browser check confirms Add → Search exits right and enters left; Search → Add reverses this. Search-result links still open forward and parent links backward.
- All three action panels have identical bounds: 402 × 83 at 430px, 298 × 83 at 320px, and 520 × 83 at 1024px. Vertical position also matches at each viewport.
- Save remains disabled. The preview notice is in the form, so it no longer changes the action-panel height.
- Save readiness: empty fields, whitespace-only names, and missing locations stay gray; complete name/type/location selections turn teal; clearing a required field restores gray. Saving remains disabled in every state.

## Add-item visual preview — 27 October 2026

- Add form opens from bottom navigation and the browse add tile. Save is disabled and form submission is prevented; no database write service was added.
- Verified name, type icon/selection, existing-location-only choices with full paths, and multiline description.
- Pasting 205 words retains 200 and displays the correct counter; standalone list bullets do not count as words.
- Leaving and returning immediately clears name, type, place, and description, including while the previous page is still sliding out.
- Active-menu underline follows inventory, search, and add sections. Search still returns live results.
- Responsive checks at 430 × 932, 320 × 640, and 1024 × 900: no horizontal overflow; short screens scroll the fields while the Save panel remains visible.

## Search addition — 27 October 2026

- Live-search revision: results appear from the first character without submit; verified multiword typing and clearing during a grid/list transition. Removed the initial result-reveal delay. Unified the toolbar frame and inverted selected type icons.

- Nine domain tests pass, including ranking, cross-parent results, type filters, spelling mistakes, Swedish letters, and empty queries.
- Browser checks cover centered search, submit, ranked results, all three filters, list/grid switching, empty states, clear, opening a result, browser Back, and URL reload persistence.
- Responsive checks at 430 × 932, 320 × 640, and desktop; no horizontal overflow.
- Existing navigation and copy behavior retained. Search uses existing read-only inventory data; database privileges are unchanged.
- Real iPhone keyboard behavior remains a device check.

## Original browsing verification

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
