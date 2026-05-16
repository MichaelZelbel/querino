# UX Backlog

Living backlog of UX improvements. Order = rough priority.

Status legend: 🟥 Todo · 🟧 In Progress · 🟩 Done · ⬜ Idea/Optional

Each item: **Effort** (S/M/L), **Impact** (★1–3), **Area**, **Acceptance criteria**.

---

## P0 — Quick Wins (now)

### 1. 🟩 Replace native confirm in CommentItem · S · ★★★  
- **Shipped:** 2026-05-16 — Replaced `window.confirm` with shadcn `AlertDialog`; destructive "Delete comment" action with cancel/close safeguards.
- **Area:** Comments
- **Problem:** Deleting a comment uses `window.confirm('Delete this comment?')` — looks like a 1998 browser dialog, can be blocked, ignores the design system, and gives no blast-radius context.
- **Acceptance:**
  - `window.confirm` removed from `src/components/comments/CommentItem.tsx`.
  - Replaced with shadcn `AlertDialog` styled like other destructive flows (red confirm button labelled “Delete comment”).
  - Cancel + close (Esc) leave the comment intact; only the explicit confirm deletes.
- **Files:** `src/components/comments/CommentItem.tsx`

### 2. 🟩 Cookie banner overlaps page content · S · ★★★
- **Shipped:** 2026-05-16 — Banner measures its own height via `ResizeObserver` and applies matching `padding-bottom` to `document.body`, so fixed banner never occludes content; padding is cleared on dismiss.
- **Area:** Global / Cookie consent
- **Problem:** `CookieBanner` is `fixed bottom-0` with no body padding. On every public page (Home, Discover, Auth, mobile especially) it covers the primary CTA / form fields until accepted or declined.
- **Acceptance:**
  - While the banner is visible, page content is not occluded — either the banner has a backdrop-aware spacer or `body` gets a bottom padding equal to the banner height.
  - Verified on `/`, `/discover`, `/auth`, `/library` at 390px and 1366px in both themes via screenshot.
  - No layout shift after the banner closes.
- **Files:** `src/components/CookieBanner.tsx`, possibly `src/App.tsx`

### 3. 🟩 Add aria-label to icon-only buttons · S · ★★★
- **Shipped:** 2026-05-16 — Added `aria-label` (plus `aria-pressed` / `aria-expanded` where stateful) to ~25 icon-only `Button` instances across header, library, editors, version panels, coach panels, slug editors, blog admin tables, moderation panel and team settings. Shadcn `ui/sidebar` primitive already exposes an accessible name and was left untouched. `BlogAdminLayout` uses `asChild` and its anchor child carries the label.
- **Area:** Accessibility (global)
- **Problem:** Multiple `<Button size="icon">` instances render an icon with no accessible name. Screen readers announce “button”. Examples: `BlogAdminPosts.tsx:175`, `BlogAdminLayout.tsx:71`, `PromptLibrary.tsx:140,232`, `ModerationPanel.tsx:286`, `VersionDetailView.tsx:31`, `VersionCompareView.tsx:182`, `PromptKitSlugEditor.tsx:94/97/117`, `PromptKitEditorToolbar.tsx:159`, destructive icon buttons in `SkillEdit.tsx:405`, `WorkflowEdit.tsx:412`, `PromptKitEdit.tsx:348`.
- **Acceptance:**
  - Every `Button` with `size="icon"` in `src/` has either an `aria-label` or visible text inside.
  - `title=` is allowed but never the only label.
  - Re-grep `rg '<Button[^>]*size="icon"' src/ -g '*.tsx'` and confirm zero hits without `aria-label` or text child.
- **Files:** see grep above

### 4. 🟩 Auth-redirect Library shows full Auth page · M · ★★
- **Shipped:** 2026-05-16 — Auth page now reads `?redirect=` and renders a primary-tinted `Alert` above the card (“Sign in to access your library / dashboard / settings / …”) with a friendly label resolved from the target path. URL stays as `/auth?redirect=…` while logged out; post-login redirect uses the existing `authRedirect` mechanism. Added the same `?redirect=/dashboard` guard to `Dashboard.tsx` (Library and Settings already had it).
- **Area:** Auth / routing
- **Problem:** `/library` (and other gated pages) silently render the Auth page in place of the requested route, with no “you need to sign in to view your library” context. After login, the user lands wherever the redirect logic decides — no explicit affordance.
- **Acceptance:**
  - Visiting a gated route while logged out shows a slim banner above the auth form: “Sign in to access your library” with the original target name.
  - After successful auth the user is taken to the originally requested path (uses existing `authRedirect` mechanism).
  - URL stays as the gated path (or `/auth?next=/library`), not silently replaced.
- **Files:** `src/pages/Auth.tsx`, `src/lib/authRedirect.ts`, gated pages (`Library.tsx`, `Settings.tsx`, `Dashboard.tsx`)

---

## P1 — High Impact (next wave)

### 5. 🟥 Empty states need real CTAs, not one-liners · M · ★★★
- **Area:** Library / Dashboard / Discover / Collections
- **Problem:** Empty messages are bare text (“No prompts yet.”, “No skills match your search.”, “No items yet. Add some!”). No icon, no primary action, no second-order suggestion (“try Discover”, “import from Markdown”, “run the Kickstart Template”).
- **Acceptance:**
  - A reusable `<EmptyState icon title description primaryAction secondaryAction />` component lives in `src/components/ui/empty-state.tsx`.
  - Used in: `Library.tsx` (per section), `Dashboard.tsx`, `PromptLibrary.tsx`, `CollectionEdit.tsx`, `Discover.tsx`, `PromptsSection.tsx`, `PublicPromptDiscovery.tsx`.
  - Each empty state offers at least one primary action that resolves the emptiness (e.g. “New Prompt” → `/prompts/new`, “Browse Discover” → `/discover`).
  - Search-empty variant differs from no-content-yet variant.
- **Files:** new `src/components/ui/empty-state.tsx`; consumers listed above.

### 6. 🟥 Discover tabs/cards overflow on mobile · M · ★★★
- **Area:** Discover
- **Problem:** At 390px the Discover page horizontally scrolls — the segmented tabs row and the prompt grid both render wider than the viewport, and the cookie banner sits on top of the last visible card.
- **Acceptance:**
  - At 390px the Discover page has no horizontal scroll (verified with `document.documentElement.scrollWidth === clientWidth` via console).
  - Tab strip is horizontally scrollable inside its own container, not the page.
  - Card grid collapses to single column with full-bleed padding ≤16px.
- **Files:** `src/pages/Discover.tsx`, `src/pages/PublicPromptDiscovery.tsx`, related card components.

### 7. 🟥 Mobile nav menu missing aria-label · S · ★★
- **Area:** Header / a11y
- **Problem:** The hamburger button in the header at <640px is icon-only with no accessible name (visible at 390px screenshot).
- **Acceptance:** `aria-label="Open menu"` (and `aria-expanded` toggles with state) on the header trigger; same for any close button inside the sheet.
- **Files:** `src/components/layout/Header.tsx`

### 8. 🟥 Destructive buttons need blast-radius copy · M · ★★
- **Area:** Destructive actions
- **Problem:** Existing `AlertDialog` confirms (artifact deletes, account deletion, team leave) read “Are you sure?” without showing what cascades — number of versions, sync queue entries, comments, suggestions.
- **Acceptance:**
  - For each destructive `AlertDialog` (`SkillEdit`, `WorkflowEdit`, `PromptKitEdit`, `LibraryPromptEdit`, `delete-my-account` flow, team leave/disband), the dialog body lists the side-effects in plain language (“Deletes 12 versions, 3 comments, removes from 2 collections, unsyncs from Menerio.”).
  - Counts are fetched (or already in component state) before opening the dialog; if unknown, the body says “All related comments, versions and reviews will also be deleted.”
- **Files:** `src/pages/SkillEdit.tsx`, `WorkflowEdit.tsx`, `PromptKitEdit.tsx`, `LibraryPromptEdit.tsx`, `Settings.tsx` (delete account), `TeamSettings.tsx`.

### 9. 🟥 Saving state is invisible in editors · M · ★★
- **Area:** Editors (Prompt / Skill / Workflow / PromptKit / Profile)
- **Problem:** The project standardised on manual save (per memory: no autosave). But there is no consistent “unsaved changes” indicator, no Cmd/Ctrl+S, no `beforeunload` guard. A user editing a prompt for 10 minutes can navigate away and lose everything.
- **Acceptance:**
  - All edit pages show a small chip near the Save button: “Unsaved changes” / “Saved · just now”.
  - Cmd/Ctrl+S triggers Save and is announced via `title` on the Save button.
  - When form is dirty, navigating away (router or `beforeunload`) prompts confirmation.
  - Reuse `AutosaveIndicator` styling but rename/repurpose for manual-save context, or create `SaveStateBadge`.
- **Files:** `LibraryPromptEdit.tsx`, `SkillEdit.tsx`, `WorkflowEdit.tsx`, `PromptKitEdit.tsx`, `EditProfile.tsx`, `components/editors/AutosaveIndicator.tsx`.

### 10. 🟥 Copy-prompt feedback is silent on Discover cards · S · ★★
- **Area:** Discover / PromptCard
- **Problem:** Each Discover card has a “Copy” button. A toast may fire, but the button itself does not switch to a “Copied ✓” state, so on noisy pages users tap twice unsure if it worked.
- **Acceptance:**
  - Clicking Copy on a `PromptCard` swaps the button content to `Check` icon + “Copied” for 1.5s, then reverts.
  - Toast continues to fire as today (no regression).
- **Files:** `src/components/prompts/PromptCard.tsx` (and any sibling card that exposes Copy).

---

## P2 — Polish & Discovery

### 11. 🟥 Command palette omits Settings/Pricing/Docs · S · ★1
- **Area:** Command palette
- **Problem:** `CommandPalette` lists Dashboard / Discover / Activity but not Settings, Docs, Blog, Pricing, MCP setup — high-traffic destinations.
- **Acceptance:** Navigation group includes Settings, Docs, Blog, Pricing (only when not auth-gated), MCP Tokens (auth-only). Search by partial match works for each.
- **Files:** `src/components/CommandPalette.tsx`

### 12. 🟥 Sticky tab bar on Discover hides under header on scroll · S · ★1
- **Area:** Discover
- **Problem:** On long Discover pages, switching artifact tab requires scrolling back up. Tabs aren’t sticky.
- **Acceptance:** Tabs row is `sticky top-[header-height]` with subtle backdrop-blur; visible at all scroll depths on `/discover`.
- **Files:** `src/pages/Discover.tsx`, possibly tabs component

### 13. 🟥 Library section count headers wrap awkwardly · S · ★1
- **Area:** Library
- **Problem:** Headers like “My Prompts (3 of 12)” mix italic count with bold title, and on small screens push action buttons to next line. Hierarchy is muddy.
- **Acceptance:** Section header uses `h2` + muted count chip, single-line at ≥640px, action button right-aligned and stable.
- **Files:** `src/pages/Library.tsx`

### 14. 🟥 Sort/filter controls invisible on Library · M · ★★
- **Area:** Library
- **Problem:** Library only has search; no sort (recent / a-z / rating), no type filter, no “only synced/un-synced to Menerio” filter. Users with 60+ artifacts can’t triage.
- **Acceptance:** A controls row above the first section: sort select + type checkboxes + a “synced to Menerio” toggle. State persists in URL query.
- **Files:** `src/pages/Library.tsx`

### 15. 🟥 Bulk actions on Library / Collections · L · ★★
- **Area:** Library / Collections
- **Problem:** No checkboxes, no “select all + delete / move to collection / sync to Menerio / publish”. Power users do everything one-by-one.
- **Acceptance:** Multi-select mode with floating action bar (Delete, Add to Collection, Sync to Menerio). Confirmed via AlertDialog.
- **Files:** `Library.tsx`, `Collections.tsx`, new `BulkActionBar.tsx`

---

## P3 — A11y & Mobile

### 16. 🟥 `<main>` landmark missing on most routes · S · ★★
- **Area:** A11y
- **Problem:** Routes render content inside generic `<div>`s. Screen-reader “skip to main” has nothing to land on.
- **Acceptance:** A single `<main>` wraps the `<Routes>` outlet (or each page wraps its content once). No nested `<main>` in any single render.
- **Files:** `src/App.tsx` (or per-page layout)

### 17. 🟥 Touch targets <40px on header & toolbars · S · ★★
- **Area:** Mobile
- **Problem:** `Button size="icon"` defaults to 40×40 but several toolbar buttons override to `h-7 w-7` / `h-8 w-8` (`PromptKitEditorToolbar.tsx:159`, `BlogAdminPosts.tsx:175`).
- **Acceptance:** All interactive icon buttons rendered at <640px have at least 40×40 hit area (use `min-h-10 min-w-10` wrapper if visual size must stay smaller).
- **Files:** see grep above.

### 18. 🟥 Focus rings missing on custom buttons · S · ★1
- **Area:** A11y
- **Problem:** Cookie banner `<a>` and some plain `<button>`s in landing components rely on browser default outlines that get suppressed in dark theme.
- **Acceptance:** Every interactive element has visible `focus-visible:ring` matching design system tokens; verified by Tab-walking `/`, `/discover`, `/auth`.
- **Files:** `CookieBanner.tsx`, landing components

### 19. ⬜ Trust badge: synced-from-Menerio banner on imported artifacts · M · ★★
- **Area:** Cross-feature trust
- **Problem:** Artifacts originating from Menerio look identical to native ones. No “Synced from Menerio — duplicate to edit” banner.
- **Acceptance:** When viewing an artifact whose source is Menerio, a subtle alert at the top of the detail page explains origin and offers “Duplicate to edit”. Edit button disabled with tooltip if user shouldn’t edit.
- **Files:** `PromptDetail.tsx`, `SkillDetail.tsx`, `WorkflowDetail.tsx`, `PromptKitDetail.tsx`

### 20. ⬜ Low-credit warning banner · S · ★★
- **Area:** AI Credits
- **Problem:** Users only learn they’re out of credits when an AI action fails. No proactive warning at, say, <10% remaining.
- **Acceptance:** Global `CreditsDisplay` shows a warning state below threshold; first AI-gated action shows an inline upsell instead of a generic error.
- **Files:** `components/settings/CreditsDisplay.tsx`, `hooks/useAICreditsGate.ts`

---

## Workflow

1. Pick top 🟥 → set 🟧 → implement.
2. Tick acceptance criteria.
3. Set 🟩 with date + short note on what shipped.
4. New findings get appended as ⬜ at the bottom and re-prioritized later.
