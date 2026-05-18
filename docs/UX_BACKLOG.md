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

### 5. 🟩 Empty states need real CTAs, not one-liners · M · ★★★
- **Shipped:** 2026-05-16 — New `src/components/ui/empty-state.tsx` (`EmptyState` with `default` panel + `compact` inline variants, icon bubble, title, description, primary + secondary actions supporting `to` / `href` / `onClick`). Wired into `Dashboard` (no-prompts vs. no-results variants with Create + Discover CTAs), `PromptLibrary` (Create + Discover), `PublicPromptDiscovery` (Clear filters + Browse all), `PromptsSection` landing (Clear filters), `Discover` kits/skills/workflows tabs (search-empty vs. published-empty with Create CTA), `CollectionEdit` (Add item + Open library), and per-section search-empties in `Library` (My Prompts / Skills / Workflows / Prompt Kits) with Clear-search / New-prompt CTAs.
- **Area:** Library / Dashboard / Discover / Collections
- **Problem:** Empty messages are bare text (“No prompts yet.”, “No skills match your search.”, “No items yet. Add some!”). No icon, no primary action, no second-order suggestion (“try Discover”, “import from Markdown”, “run the Kickstart Template”).
- **Acceptance:**
  - A reusable `<EmptyState icon title description primaryAction secondaryAction />` component lives in `src/components/ui/empty-state.tsx`.
  - Used in: `Library.tsx` (per section), `Dashboard.tsx`, `PromptLibrary.tsx`, `CollectionEdit.tsx`, `Discover.tsx`, `PromptsSection.tsx`, `PublicPromptDiscovery.tsx`.
  - Each empty state offers at least one primary action that resolves the emptiness (e.g. “New Prompt” → `/prompts/new`, “Browse Discover” → `/discover`).
  - Search-empty variant differs from no-content-yet variant.
- **Files:** new `src/components/ui/empty-state.tsx`; consumers listed above.

### 6. 🟩 Discover tabs/cards overflow on mobile · M · ★★★
- **Shipped:** 2026-05-16 — Discover tab strip is now horizontally scrollable inside its own container (negative-margin scroll lane at <640px, centered grid ≥640px) with `whitespace-nowrap` triggers; container has `overflow-x-hidden` to guarantee no page-level horizontal scroll. `PublicPromptDiscovery` sort buttons row uses `flex-wrap` with `flex-1` so the three sort buttons stack/share width cleanly at 390px. Card grids already collapse to single column on mobile.
- **Area:** Discover
- **Problem:** At 390px the Discover page horizontally scrolls — the segmented tabs row and the prompt grid both render wider than the viewport, and the cookie banner sits on top of the last visible card.
- **Acceptance:**
  - At 390px the Discover page has no horizontal scroll (verified with `document.documentElement.scrollWidth === clientWidth` via console).
  - Tab strip is horizontally scrollable inside its own container, not the page.
  - Card grid collapses to single column with full-bleed padding ≤16px.
- **Files:** `src/pages/Discover.tsx`, `src/pages/PublicPromptDiscovery.tsx`, related card components.

### 7. 🟩 Mobile nav menu missing aria-label · S · ★★
- **Shipped:** 2026-05-16 — Verified during #3 sweep: header hamburger has `aria-label` toggling between "Open menu" / "Close menu" and `aria-expanded` bound to `mobileMenuOpen` state (`Header.tsx:289-290`).
- **Area:** Header / a11y
- **Files:** `src/components/layout/Header.tsx`

### 8. 🟩 Destructive buttons need blast-radius copy · M · ★★
- **Shipped:** 2026-05-16 — Each destructive `AlertDialog`/`Dialog` body now lists cascade effects in plain language via a bulleted list (versions, comments/reviews, edit suggestions, collection references, GitHub + Menerio sync). `Settings.tsx` delete-account dialog enumerates every removed data class and references GDPR Art. 17. `TeamSettings.tsx` clarifies what survives (authored artifacts) vs. what is destroyed (membership, invites, activity, shared pins). Descriptions use `asChild` with a `div` wrapper so the list renders as valid HTML.
- **Area:** Destructive actions
- **Files:** `src/pages/SkillEdit.tsx`, `WorkflowEdit.tsx`, `PromptKitEdit.tsx`, `LibraryPromptEdit.tsx`, `Settings.tsx` (delete account), `TeamSettings.tsx`.

### 9. 🟩 Saving state is invisible in editors · M · ★★
- **Shipped:** 2026-05-16 — New `useUnsavedChanges<T>` hook (`src/hooks/useUnsavedChanges.ts`) snapshots a baseline on load + after each successful save, exposes `isDirty` / `savedAt` / `markSaved`, binds Cmd/Ctrl+S to the editor's save handler (no-op when clean or already saving), and installs a `beforeunload` guard while dirty. New `SaveStateBadge` (`src/components/editors/SaveStateBadge.tsx`) renders a small chip next to the Save button: "Saving…" (spinner) / "Unsaved changes" (amber) / "Saved · just now" (green, auto-refreshing relative time). Wired into `LibraryPromptEdit`, `SkillEdit`, `WorkflowEdit`, `PromptKitEdit` and `EditProfile`; Save buttons also gained `title="Save (⌘S / Ctrl+S)"`.
- **Area:** Editors (Prompt / Skill / Workflow / PromptKit / Profile)
- **Files:** new `src/hooks/useUnsavedChanges.ts`, new `src/components/editors/SaveStateBadge.tsx`; `LibraryPromptEdit.tsx`, `SkillEdit.tsx`, `WorkflowEdit.tsx`, `PromptKitEdit.tsx`, `EditProfile.tsx`.

### 10. 🟩 Copy-prompt feedback is silent on Discover cards · S · ★★
- **Shipped:** 2026-05-16 — Verified already implemented across all artifact cards: `PromptCard`, `LegacyPromptCard`, `SkillCard`, `WorkflowCard`, `PromptKitCard` each track a `copied` state, swap the button to `variant="success"` with `Check` icon + "Copied" label for 2s, then revert. Toast continues to fire in parallel.
- **Area:** Discover / PromptCard
- **Files:** `src/components/prompts/PromptCard.tsx`, `LegacyPromptCard.tsx`, `src/components/skills/SkillCard.tsx`, `src/components/workflows/WorkflowCard.tsx`, `src/components/promptKits/PromptKitCard.tsx`.

---

## P2 — Polish & Discovery

### 11. 🟩 Command palette omits Settings/Pricing/Docs · S · ★1
- **Shipped:** 2026-05-16 — Navigation group in `CommandPalette` now includes Docs, Blog, Pricing (public), Settings and MCP Tokens (auth-only). MCP Tokens navigates to `/settings#mcp` with a new `id="mcp"` anchor wrapping `McpSetupSection` (`scroll-mt-24`). Existing `requiresAuth` filter keeps auth-gated entries hidden when logged out; partial-match search works via the existing query filter.
- **Area:** Command palette
- **Files:** `src/components/CommandPalette.tsx`, `src/pages/Settings.tsx`

### 12. 🟩 Sticky tab bar on Discover hides under header on scroll · S · ★1
- **Shipped:** 2026-05-16 — Discover tab strip wrapper is now `sticky top-16 z-30` with `bg-background/80 backdrop-blur` and a subtle bottom border, so the segmented tabs remain visible at any scroll depth while sitting flush beneath the `h-16` sticky header. Horizontal scroll container preserved for mobile.
- **Area:** Discover
- **Files:** `src/pages/Discover.tsx`

### 13. 🟩 Library section count headers wrap awkwardly · S · ★1
- **Area:** Library
- **Problem:** Headers like “My Prompts (3 of 12)” mix italic count with bold title, and on small screens push action buttons to next line. Hierarchy is muddy.
- **Acceptance:** Section header uses `h2` + muted count chip, single-line at ≥640px, action button right-aligned and stable.
- **Files:** `src/pages/Library.tsx`, `src/components/library/SectionHeader.tsx`
- **Done (2026-05-18):** Extracted shared `SectionHeader` component that renders the title as an `h2` next to a muted, pill-shaped count chip (`bg-muted text-muted-foreground`, tabular nums). Layout uses `flex-wrap … sm:flex-nowrap` with `justify-between` and a `shrink-0` action slot, so on ≥640px viewports the title + count stay on one line and the “New Collection” button remains right-aligned and stable. Applied across all Library sections (Pinned, Prompts, Skills, Workflows, Prompt Kits, Saved Prompts, Collections).

### 14. 🟩 Sort/filter controls invisible on Library · M · ★★
- **Area:** Library
- **Problem:** Library only has search; no sort (recent / a-z / rating), no type filter, no “only synced/un-synced to Menerio” filter. Users with 60+ artifacts can’t triage.
- **Acceptance:** A controls row above the first section: sort select + type checkboxes + a “synced to Menerio” toggle. State persists in URL query.
- **Files:** `src/pages/Library.tsx`
- **Done (2026-05-18):** New controls row on `/library` next to the search input: shadcn `Select` for sort (Most recent / Oldest / Title A–Z / Title Z–A / Top rated), a multi-select `ToggleGroup` for artifact types (Prompts, Skills, Workflows, Kits, plus Saved + Collections in personal workspace), and — when Menerio is connected — a Menerio sync `Select` (All / Synced / Not synced). All state is persisted in the URL query (`?sort=…&types=…&menerio=…`) via `useSearchParams`, defaults are omitted from the URL, and sections whose type is unchecked are hidden entirely. Sorting + Menerio filter are applied on top of the existing search-debounced lists via new `display*` memos; section counts now reflect the post-filter result. Kits are excluded from Menerio filtering since they don't carry a sync flag.

### 15. ✅ Bulk actions on Library / Collections · L · ★★
- **Area:** Library / Collections
- **Problem:** No checkboxes, no “select all + delete / move to collection / sync to Menerio / publish”. Power users do everything one-by-one.
- **Acceptance:** Multi-select mode with floating action bar (Delete, Add to Collection, Sync to Menerio). Confirmed via AlertDialog.
- **Files:** `Library.tsx`, new `BulkActionBar.tsx`, new `BulkAddToCollectionModal.tsx`
- **Done (2026-05-18):** Added a "Select" toggle to the Library controls row. When enabled, every owned card (Pinned, My Prompts, My Skills, My Workflows, My Prompt Kits) renders with an overlay checkbox; the card body's click target is suppressed so taps toggle selection instead of navigating. A floating `BulkActionBar` (fixed bottom-center, rounded pill, `bg-card/95 backdrop-blur`) shows the selected count plus three actions: **Add to Collection** (opens a new bulk-aware `BulkAddToCollectionModal` that loops the `useAddToCollection` mutation across all selected items, with toasts for added/skipped/failed counts), **Sync to Menerio** (visible only when Menerio is connected; inserts pending rows into `menerio_sync_queue` for prompts/skills/workflows, ignoring kits), and **Delete** (confirmed via `AlertDialog`, runs scoped `supabase.from(table).delete().in("id", ids)` with `author_id` / `team_id` guards per workspace, then refreshes local state + invalidates TanStack queries). Saved Prompts and Collections sections are intentionally not selectable (the user doesn't own those rows). Exiting "Select" mode clears the selection.


---

## P3 — A11y & Mobile

### 16. ✅ `<main>` landmark missing on most routes · S · ★★
- **Area:** A11y
- **Problem:** Routes render content inside generic `<div>`s. Screen-reader "skip to main" has nothing to land on.
- **Acceptance:** A single `<main>` wraps the `<Routes>` outlet (or each page wraps its content once). No nested `<main>` in any single render.
- **Files:** `src/App.tsx` (or per-page layout)
- **Done (2026-05-18):** Audited all routed pages. Most already wrapped their content in `<main>`. Added `<main>` to the three remaining pages: `SignUp.tsx` (both render branches), `CreateFromMenerio.tsx`, and `TeamSettings.tsx` (all four render branches: loading, not-found, no-permission, and primary). Blog admin routes inherit `<main>` from `BlogAdminLayout`. No nested-main risk since pages own their own wrapper rather than `App.tsx`.

### 17. 🟩 Touch targets <40px on header & toolbars · S · ★★
- **Shipped:** 2026-05-18 — Toolbar icon buttons in `PromptKitEditorToolbar` (`ToolbarButton`, text-color trigger, link trigger) and the post-actions trigger in `BlogAdminPosts.tsx` now use `h-10 w-10 sm:h-7 sm:w-7` / `sm:h-8 sm:w-8`, giving ≥40×40 hit area below the `sm` (640px) breakpoint while preserving the dense desktop look. Header icon buttons (command palette is desktop-only `md:flex`; mobile menu uses default `size="icon"` = 40×40) already meet the bar.
- **Area:** Mobile
- **Files:** `src/components/editors/PromptKitEditorToolbar.tsx`, `src/pages/blog/admin/BlogAdminPosts.tsx`.

### 18. 🟩 Focus rings missing on custom buttons · S · ★1
- **Shipped:** 2026-05-18 — Cookie banner "Learn more" `<a>` and every `<Link>`/`<a>` in `Footer.tsx` now carry `rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`, matching the design-system ring token used by shadcn Button. Tab-walking `/`, `/discover`, `/auth` shows visible focus on the brand logo link, all Product/Resources/Legal links, and the cookie banner link. Landing components (`HeroSection`, `FeaturesSection`, `PromptsSection`) already use shadcn `Button`/`Link` wrapped in `Button asChild`, which carries focus-visible by default — no plain `<button>` elements present.
- **Area:** A11y
- **Files:** `src/components/CookieBanner.tsx`, `src/components/layout/Footer.tsx`.

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
