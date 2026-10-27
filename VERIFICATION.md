# Home browsing verification

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
