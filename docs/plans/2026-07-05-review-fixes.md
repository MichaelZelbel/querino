# Querino Review-Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all approved findings from the 2026-07-05 product/code review — trust bugs, onboarding gaps, dead code, feature parity, performance, and security — WITHOUT adding any payment/checkout capability.

**Architecture:** Frontend fixes land directly in this repo (React 18 + TS + Vite + shadcn). Edge-function fixes land in `supabase/functions/` and deploy via the Lovable/GitHub sync on push to `main` (same model as Menerio: push = deploy). Each task is one commit; `npm run build` + `npm run lint` must pass before every push.

**Tech Stack:** React 18, TypeScript, Vite 5, TanStack Query v5, React Router v6, Supabase (Postgres/Auth/Edge Functions), shadcn/ui.

## Global Constraints

- **NO CHECKOUT, EVER:** Do not restore Stripe checkout, the customer portal, or add any pricing/purchase page. The `toast.info("...contact support@querino.ai")` stubs in `src/hooks/useStripeCheckout.ts` and `src/hooks/useSubscription.ts` are **intentional** (employment-contract compliance). Premium UX improvements must keep "Contact support" as the only upgrade action.
- Executor must **read every file before editing it** — the review findings carry file:line evidence, but the code is the source of truth.
- Verification gate for every task: `npm run build` && `npm run lint` (lint may have pre-existing warnings; no NEW errors). Push to `main` only after a green build — push deploys to production.
- Keep the Querino MCP server and Menerio backend sync fully working — CLAW cleanup is UI-only.
- Follow existing conventions: sonner `toast`, TanStack Query hooks in `src/hooks/`, shadcn components, no class components.

---

## Phase A — Trust & data-integrity bugs

### Task A1: TeamSettings form never populates (can wipe GitHub config)
**Files:** Modify `src/pages/TeamSettings.tsx` (~lines 58-65, 191)
**Change:** The `useState(() => { if (team) {...} })` initializer runs before `team` loads, so `teamName/githubRepo/githubBranch/githubFolder` stay empty and saving can overwrite configured values with blanks. Replace with `useEffect(() => { if (team) { setTeamName(team.name); setGithubRepo(...); ... } }, [team])`. Remove the `value={teamName || team.name}` masking fallback.
**Verify:** build+lint; open a team settings page live and confirm fields populate.
- [x] Done — commit `fix: populate TeamSettings form when team loads`

### Task A2: Version restore silently discards current content
**Files:** Modify `src/components/versions/VersionHistoryPanel.tsx` (restore handler ~142-202, dialog copy ~368), `src/pages/VersionHistory.tsx` (~137)
**Change:** Before overwriting the live prompt with the selected version, snapshot the CURRENT live content as a new version row (so the dialog's "current changes will be preserved in version history" claim becomes true). Only snapshot when current content differs from the latest stored version. Compute next `version_number` from a fresh query, not stale local state.
**Verify:** build+lint; restore an old version on a test prompt live, confirm a snapshot version of the pre-restore state exists.
- [x] Done — commit `fix: snapshot current content before version restore`

### Task A3: Remove fake "Save as New Version" on Skills & Workflows
**Files:** Modify `src/pages/SkillEdit.tsx` (~266-291, 578-587, delete-dialog ~429), `src/pages/WorkflowEdit.tsx` (~272-291, analogous lines)
**Change:** No `skill_versions`/`workflow_versions` tables exist; the button does a plain save and the Change Notes textarea is silently discarded. Remove the "Save as New Version" button, the change-notes field, and the delete-dialog line promising removal of "all saved versions". Keep the normal Save. (Real versioning = Task G2, optional.)
**Verify:** build+lint; edit pages show a single honest Save.
- [x] Done — commit `fix: remove fake versioning UI from skill/workflow editors`

### Task A4: Unsaved edits lost on in-app navigation
**Files:** Modify `src/hooks/useUnsavedChanges.ts`
**Change:** The hook only wires `beforeunload` (tab close) — React-Router `Link` navigation silently discards edits. Add `useBlocker` from react-router-dom (v6 data-router required — check router type first; if `BrowserRouter` without data router, `useBlocker` is unavailable: then intercept via a confirm dialog on blocked nav using `unstable_useBlocker` equivalent or convert `BrowserRouter` → `createBrowserRouter`. Choose the smallest safe change; converting the router touches all routes, so prefer a `useBlocker`-compatible approach only if the router supports it, else document and add guard to the four editors' Back buttons at minimum).
**Verify:** build+lint; live: dirty an editor, click "Back to Library", confirm a confirmation appears.
- [x] Done — commit `fix: guard in-app navigation against unsaved editor changes`

### Task A5: Moderation bypass on two public-write paths
**Files:** Modify `src/components/prompts/RefinePromptModal.tsx` (~125-138), `src/pages/PromptDetail.tsx` (apply-suggestion ~228-240)
**Change:** Both write public prompt content without the `moderateContent` check used by PromptNew/LibraryPromptEdit. Call `moderateContent(..., "edit_public", "prompt")` (same signature as `LibraryPromptEdit.tsx:316-327`) before persisting when the prompt is public; on block, show the existing `ModerationBlockDialog` pattern.
**Verify:** build+lint.
- [x] Done — commit `fix: run moderation on refine-update and apply-suggestion paths`

### Task A6: Coach apply spams versions and races
**Files:** Modify `src/pages/LibraryPromptEdit.tsx` (~524-555)
**Change:** Every AI-coach apply inserts a `prompt_versions` row without updating the live prompt, and computes `version_number` from possibly-stale local state. Stop inserting versions on coach apply; let the normal Save flow create the version. If a snapshot-per-apply is desired, apply content to the editor state only.
**Verify:** build+lint; live: apply a coach suggestion, confirm no new version row until Save.
- [x] Done — commit `fix: stop per-apply version inserts from AI coach`

### Task A7: Unchecked v1 insert on prompt create
**Files:** Modify `src/pages/PromptNew.tsx` (~206-214)
**Change:** The initial `prompt_versions` v1 insert result is not error-checked; a prompt can exist without its v1. Check the error; on failure, toast a warning (do not roll back the prompt).
**Verify:** build+lint.
- [x] Done — commit `fix: surface v1 version insert failure on prompt create`

## Phase B — New-user experience & navigation

### Task B1: Library empty state for brand-new users
**Files:** Modify `src/pages/Library.tsx`
**Change:** When ALL of myPrompts/mySkills/myWorkflows/myKits/collections are empty (and not loading), render the existing `EmptyState` component (as used in `Dashboard.tsx:291-297`) with "Create your first prompt" (→ `/prompts/new`) and "Explore Discover" (→ `/discover`) actions, instead of a blank page.
**Verify:** build+lint; live with a fresh account or by inspection of gating logic.
- [x] Done — commit `feat: first-run empty state in Library`

### Task B2: Retire the orphaned /dashboard duplicate
**Files:** Modify `src/App.tsx` (route), `src/components/layout/Footer.tsx` (~27), `src/components/CommandPalette.tsx` (~100); Delete `src/pages/Dashboard.tsx`
**Change:** `/dashboard` renders an inferior clone titled "My Library". Replace the route element with `<Navigate to="/library" replace />`, repoint Footer + CommandPalette links to `/library`, delete the page. Grep for remaining `/dashboard` references first (Auth redirects etc.) and repoint them.
**Verify:** build+lint; `/dashboard` redirects live.
- [x] Done — commit `refactor: redirect /dashboard to /library, remove duplicate page`

### Task B3: Delete the dead Lovable route island
**Files:** Modify `src/App.tsx` (routes at ~112-117); Delete `src/pages/SignUp.tsx`, `src/pages/PublicPromptDiscovery.tsx`, `src/pages/PromptCreation.tsx`, `src/pages/PromptRefinement.tsx`, `src/pages/PromptLibrary.tsx`
**Change:** Remove routes `/public-prompt-discovery-copy`, `/free-user-sign-up-initial-exploration`, `/premium-feature-upgrade`, `/prompt-creation-publishing-premium-free-`, `/prompt-refinement-with-ai-tools-premium-`, `/organizing-managing-prompt-library-free-premium-` and the five orphan mock pages (SignUp's form is non-functional). Grep for inbound links to these paths first and remove them too.
**Verify:** build+lint; the old URLs 404 (acceptable — they were never linked publicly).
- [x] Done — commit `chore: remove dead Lovable-generated route island`

### Task B4: Mobile "Get Started" lands on Sign In tab
**Files:** Modify `src/components/layout/Header.tsx` (~465)
**Change:** Point mobile "Get Started" to `/auth?tab=signup` (desktop already does at ~274).
**Verify:** build+lint.
- [x] Done — commit `fix: mobile Get Started opens signup tab`

### Task B5: Strip CLAW dead-ends from the web UI (keep MCP/backend)
**Files:** Modify `src/components/shared/TranslateModal.tsx` (~45), `src/components/reviews/ReviewSection.tsx` (~66), `src/components/settings/MenerioIntegrationSection.tsx` (~21,37,59); grep `claws?` across `src/` for other user-facing 404 links
**Change:** No `/claws/*` routes exist — links 404. Remove `claw` from the translate destination map and the review sign-in redirect; remove the "Claws" toggle from Menerio sync settings UI (leave stored settings/backend untouched so MCP-created claws keep syncing). Do NOT touch `supabase/functions/mcp-server` or claw DB tables.
**Verify:** build+lint; grep confirms no remaining `/claws/` hrefs in `src/`.
- [x] Done — commit `fix: remove claw 404 dead-ends from web UI`

### Task B6: Make tag deep-links actually filter Discover
**Files:** Modify `src/pages/Discover.tsx`, `src/components/landing/PromptsSection.tsx`
**Change:** `PromptDetail` links tags to `/discover?tag=...` but Discover never reads URL params. Read `useSearchParams` for `tag`, `q`, and `type` (tab); seed the active tab and PromptsSection's search/filter state; clicking a tag chip inside Discover updates the URL. Also make Skill/Workflow detail tags clickable to the same URLs (SkillDetail ~250, WorkflowDetail ~265).
**Verify:** build+lint; live: click a tag on a prompt → Discover shows filtered results.
- [x] Done — commit `feat: tag deep-links filter Discover`

### Task B7: 404 page has no navigation
**Files:** Modify `src/pages/NotFound.tsx`
**Change:** Render the standard `Header` (and Footer) around the 404 message so users aren't stranded (verified live: bare page with only "Return to Home").
**Verify:** build+lint; live check any bad URL.
- [x] Done — commit `fix: add site chrome to 404 page`

### Task B8: Fix stale repo docs (CLAUDE.md claims claw pages exist)
**Files:** Modify `CLAUDE.md`
**Change:** Correct the artifact-type section: shipped types are Prompts/Skills/Workflows/Prompt Kits (+ claws = MCP/DB only, no web UI). Remove references to `src/pages/Claw*.tsx` and `src/hooks/useClaws.ts`.
**Verify:** n/a (docs).
- [x] Done — commit `docs: correct artifact-type claims in CLAUDE.md`

## Phase C — Premium UX (no checkout — contact-support CTA only)

### Task C1: Mount the dead premium components; tease instead of hide
**Files:** Modify `src/pages/PromptDetail.tsx` (~590), `src/pages/PromptWizard.tsx` (~151-192), `src/components/premium/UpsellModal.tsx`, `src/components/premium/PremiumGate.tsx`; grep for hand-rolled "Contact support" blocks (`WorkspacePicker.tsx` ~151-171)
**Change:** `UpsellModal`/`PremiumGate`/`PremiumBadge` are exported but never imported. Free users currently don't SEE premium features at all (e.g. "Refine with AI" hidden). Render premium actions in a locked state that opens `UpsellModal`; keep the modal's CTA as "Contact support@querino.ai" (mailto) — NO checkout. Replace hand-rolled gate blocks with `PremiumGate`.
**Verify:** build+lint; live as free user: locked buttons visible, modal opens, only contact-support CTA.
- [x] Done — commit `feat: surface premium features to free users via UpsellModal (contact-support only)`

### Task C2: Library plan footer → informative upsell
**Files:** Modify `src/pages/Library.tsx` (~1086-1099)
**Change:** Replace the bare "Contact support for more information" text with the `UpsellModal` trigger listing premium benefits (same contact-support CTA).
**Verify:** build+lint.
- [x] Done — commit `feat: informative premium panel in Library footer`

### Task C3: Credits transparency
**Files:** Modify `src/components/layout/Header.tsx`, `src/hooks/useAICredits.ts` (read-only reuse), AI action surfaces: `src/components/prompts/RefinePromptModal.tsx`, `src/pages/PromptWizard.tsx`, `src/components/prompts/PromptForm.tsx` metadata button, coach panels
**Change:** (a) Compact credits pill in the header for logged-in users (remaining credits, links to Settings). (b) Show remaining credits inside AI modals before submit. (c) When balance is 0, disable AI buttons with a tooltip + upsell/contact CTA instead of letting the call fail.
**Verify:** build+lint; live: pill renders with correct balance.
- [x] Done — commit `feat: surface AI credit balance in header and AI actions`

### Task C4: Single client-side premium source of truth
**Files:** Modify `src/hooks/useSubscription.ts` (~70-74), consumers of `check-subscription`
**Change:** Premium is derived from three drifting sources (`user_roles` via usePremiumCheck — authoritative; `check-subscription` edge fn; `profiles.plan_type`). Remove the 60-second `setInterval` polling of `check-subscription` (Stripe is disabled; the data can't change minute-to-minute). Route client premium checks through `useUserRole`/`usePremiumCheck` consistently; keep `check-subscription` for on-demand refresh only.
**Verify:** build+lint; network tab shows no 60s polling.
- [x] Done — commit `refactor: single premium source of truth, drop 60s subscription polling`

## Phase D — Feature parity & integration polish

### Task D1: SEO metadata for Skill & Workflow detail pages
**Files:** Modify `src/pages/SkillDetail.tsx` (success return ~216), `src/pages/WorkflowDetail.tsx` (~231)
**Change:** Add the same `SEOHead` + `CreativeWork` JSON-LD block used by `PromptDetail.tsx:343-348` (title, description, canonical, aggregateRating when present) to the success render paths.
**Verify:** build+lint; live: view-source of a skill page shows title/canonical/JSON-LD.
- [x] Done — commit `feat: SEO metadata on skill/workflow detail pages`

### Task D2: Replace full-page reload after Menerio sync
**Files:** Modify `src/pages/SkillDetail.tsx` (~397), `src/pages/WorkflowDetail.tsx` (~420)
**Change:** Replace `window.location.reload()` with the page's refetch function (as PromptDetail does with `onSyncComplete={fetchPrompt}`).
**Verify:** build+lint.
- [x] Done — commit `fix: refetch instead of reload after Menerio sync`

### Task D3: Send-to-LLM + Refine for Skills & Workflows
**Files:** Modify `src/components/prompts/SendToLLMButtons.tsx`, `src/components/prompts/RefinePromptModal.tsx` (generalize props: content/title/type + save callback), `src/pages/SkillDetail.tsx`, `src/pages/WorkflowDetail.tsx`
**Change:** Skills/workflows are plain-text artifacts; give their detail pages the same "Send to ChatGPT/Claude" buttons and (premium, per C1 teasing rules) "Refine with AI". Reuse — do not copy — the components; add an `artifactType` prop where behavior differs (refine edge fn already generic? check `refine-prompt` input contract first; if prompt-specific, scope refine to prompts and ship send-to-LLM only, noting the gap).
**Verify:** build+lint; live: send-to-LLM works from a skill page.
- [x] Done — commit `feat: send-to-LLM (and refine where supported) for skills/workflows`

### Task D4: Version-history parity inside the prompt editor
**Files:** Modify `src/pages/LibraryPromptEdit.tsx` (~1051-1096)
**Change:** Replace the bespoke read-only version drawer with the full `VersionHistoryPanel` (view/compare/restore) already used on PromptDetail.
**Verify:** build+lint; live: restore works from the editor.
- [x] Done — commit `refactor: full VersionHistoryPanel in prompt editor`

### Task D5: Unify team GitHub sync UI + explicit "Sync now"
**Files:** Modify `src/pages/TeamSettings.tsx` (~277-319), `src/pages/Settings.tsx` (~655-767); Read `supabase/functions/github-sync/index.ts` first
**Change:** Two divergent config UIs (TeamSettings lacks token + test connection). Consolidate: TeamSettings gets token field + "Test Connection" + explicit "Sync now" button invoking `github-sync`; Settings' team section links to TeamSettings instead of duplicating. Clarify auto-vs-manual sync in helper text based on what `github-sync`/`github-sync-worker` actually do.
**Verify:** build+lint; live: test connection + sync-now round-trip on a test repo.
- [x] Done — commit `feat: unified team GitHub sync UI with explicit sync action`

### Task D6: Slug-redirect parity (conditional)
**Files:** Read `supabase/migrations/*` for slug-history tables first; modify `src/pages/SkillDetail.tsx`, `WorkflowDetail.tsx`, `PromptKitDetail.tsx` only if backing data exists
**Change:** Prompts follow renamed-slug history (`PromptDetail.tsx:120-139`); other types 404 on old links. If a shared/typed slug-history table exists, replicate the lookup. If none exists, SKIP and record here (DB change not worth it yet).
**Verify:** build+lint.
- [x] SKIPPED — only prompts/kits can rename slugs and both already redirect (see decision record)

## Phase E — Performance & scale

### Task E1: Card-field selects + pagination for the four list hooks
**Files:** Modify `src/hooks/usePrompts.ts`, `useSkills.ts`, `useWorkflows.ts`, `usePromptKits.ts` and their list consumers (`Discover.tsx`, `Library.tsx`, `PromptsSection.tsx`)
**Change:** List hooks currently `select('*')` (full markdown `content`) with no limit — every visit downloads the whole table. (a) Select only card fields (`id, slug, title, description, category, tags, rating_avg, rating_count, author_id, created_at, updated_at, is_public` + profile join); fetch `content` only on detail/edit. (b) Add `.range()` pagination with a "Load more" (TanStack `useInfiniteQuery`) on Discover; Library can keep full fetch of OWN artifacts (bounded) but with card-fields select. Audit consumers for `content` usage first (e.g. copy buttons on cards) and fetch on demand where needed.
**Verify:** build+lint; network tab: discover payload drops from full-content to card fields; load-more works.
- [x] Done — commit `perf: card-field selects + paginated discovery lists`

### Task E2: Extract shared list-hook factory while touching E1
**Files:** Create `src/hooks/useArtifactList.ts`; modify the four list hooks to delegate
**Change:** The four hooks are copy-paste variants. Extract `useArtifactList({ table, cardFields, orderBy })` so pagination/service changes are 1x not 4x. Keep the four exported hook names as thin wrappers (no consumer churn).
**Verify:** build+lint.
- [x] Done — commit `refactor: shared useArtifactList factory`

## Phase F — Security (edge functions; deploy via push like Menerio — verify after first push)

### Task F1: Lock down notify-admin + escape HTML
**Files:** Modify `supabase/functions/notify-admin/index.ts`; grep callers of `notify-admin` across repo (client + other functions) first
**Change:** Function is unauthenticated (`verify_jwt=false`) and interpolates caller-supplied `userEmail/displayName/metadata` unescaped into admin email HTML. (a) HTML-escape every interpolated field. (b) Auth: if callers are client-side, require a valid user JWT (`getCallerUserId`); if server-to-server, require a shared secret header checked against an env secret. Pick based on actual callers found.
**Verify:** build (Deno fn — typecheck via `deno check` if available, else careful review); after deploy, an unauthenticated POST returns 401.
- [x] Done — commit `fix(security): authenticate notify-admin and escape email HTML`

### Task F2: Credit-gate generate-embedding
**Files:** Modify `supabase/functions/generate-embedding/index.ts` (~32-60)
**Change:** Authenticated but ungated — any free user can loop it and burn OpenAI spend. Add the same `assertCredits` gate used by the other AI functions before calling the embeddings API.
**Verify:** deployed function rejects when balance is 0.
- [x] Done — commit `fix(security): credit-gate generate-embedding`

### Task F3: Single admin source of truth in edge functions
**Files:** Modify `supabase/functions/delete-user/index.ts` (~58-66), `supabase/functions/ensure-token-allowance/index.ts` (~428)
**Change:** These gate admin on `profiles.role`; the authoritative source elsewhere is `user_roles` / `is_admin()` RPC. Switch both to the `is_admin` RPC.
**Verify:** deployed: admin actions still work for Michael's admin account.
- [x] Done — commit `fix(security): use is_admin RPC in delete-user and ensure-token-allowance`

### Task F4: Restrict CORS on paid AI endpoints
**Files:** Modify CORS headers in `supabase/functions/_shared/coach.ts` (~28) and the paid AI functions (`prompt-wizard`, `canvas-ai`, `refine-prompt`, `ai-insights`, `suggest-metadata`, `translate-artifact`)
**Change:** Replace `Access-Control-Allow-Origin: *` with an allowlist (`https://querino.ai` + Lovable preview origin + `http://localhost:8080`), via a shared helper. Leave open CORS on genuinely public functions (mcp-server, menerio callbacks, blog-api).
**Verify:** deployed: AI features still work from querino.ai.
- [x] Done — commit `fix(security): origin allowlist on paid AI endpoints`

### Task F5: assertCredits fail-open decision
**Files:** Modify `supabase/functions/_shared/llm.ts` (~133-136)
**Change:** Currently allows all paid AI calls when the credits view errors. Make it fail-closed for callers flagged expensive, but return a clear "temporarily unavailable" message (not "out of credits"). If fail-closed is judged too risky for premium UX, add per-user rate limiting instead — decide at implementation time and record here.
**Verify:** deployed: normal calls unaffected.
- [x] Done — commit `fix(security): fail-closed credits check with clear infra-error message`

## Phase G — Consolidation & larger follow-ups

### Task G1: Consolidate the 4x-duplicated families
**Files:** Create `src/hooks/useArtifactReviews.ts`, `src/hooks/useCopyArtifactToTeam.ts`, `src/hooks/useCloneArtifact.ts`; collapse `use{Prompt,Skill,Workflow,PromptKit}Reviews`, `useCopy*ToTeam`, `useClone*` into config-driven wrappers; generalize `Copy*ToTeamModal` into one modal with `itemType`; merge the four `suggest-*-metadata` edge functions into one parameterized `suggest-metadata` (pattern proven by `_shared/coach.ts`)
**Change:** Measured ~86% identical code; copies already drifted. Keep existing export names as thin wrappers to avoid consumer churn. One family per commit.
**Verify:** build+lint after each family; live smoke: leave a review, copy to team, clone, suggest metadata.
- [x] Done — commits `refactor: config-driven <family> across artifact types` (4 commits: reviews+modal, copy-to-team, clone, suggest-metadata)

### Task G2 (BLOCKED on Lovable queue): Real versioning for skills & workflows

> **Status 2026-07-06:** migration applied (queue unpaused), tables + RPC verified
> live via REST, G2/G3 frontends shipped. ONE OPEN ITEM: the migration stored a
> PLACEHOLDER in the Vault secret `service_role_key`; signup notification emails
> stay off (trigger warns and skips) until the real service-role key is stored in
> Supabase Vault (Dashboard → Project Settings → Vault, or SQL:
> `select vault.update_secret((select id from vault.secrets where name='service_role_key'), '<real key>');`).
**Files:** New migration `supabase/migrations/*_skill_workflow_versions.sql` (tables mirroring `prompt_versions` + RLS); reinstate version UI from Task A3 wired to real tables; reuse `VersionHistoryPanel` generalized by type
**Change:** Only after A3 shipped. Check `npx supabase db push` works against the linked project; if no DB access from this machine, send the migration as a work order to the Lovable agent via MCP.
**Verify:** build+lint; live: save new version on a skill, restore it.
- [x] Done — commit `feat: real version history for skills and workflows`

### Task G3: Team invite links (no email dependency)
**Files:** Read `useTeams.ts` + team tables first; new migration `team_invites` (token, team_id, role, expires_at, created_by + RLS) or reuse existing if present; modify `src/pages/TeamSettings.tsx` (~262-272), `src/hooks/useTeams.ts` (~185), new accept route `/team/join/:token`
**Change:** Replace "share your team UUID" with generated expiring invite links. Email sending stays out (Resend wiring not required for value). Same DB-access caveat as G2.
**Verify:** build+lint; live: generate link in one account, join from another.
- [x] Done — commit `feat: team invite links`

### Task G4: Semantic search + sort/category parity on Discover tabs
**Files:** Modify `src/pages/Discover.tsx` (~51-106), reuse `useSearchPrompts.ts` hybrid pattern for skills/workflows/kits (embeddings already backfillable via admin panel — check `search_*` RPCs exist for other types first; if not, add RPC migrations, same DB caveat)
**Change:** Kits/Skills/Workflows tabs currently get a bare search box vs prompts' sort + category + semantic search. Unify the toolbar and extend hybrid search where RPCs exist; record gaps here if RPCs are missing.
**Verify:** build+lint; live: skill search returns semantic matches.
- [x] Done — commit `feat: search/sort/category parity across Discover tabs`

## Explicitly skipped (decision record)

- **Stripe checkout / customer portal / pricing page** — intentionally disabled (employment-contract compliance). Never restore. Policy now also recorded in CLAUDE.md and in the stub hooks.
- **Task D6 (slug-redirect parity)** — SKIPPED with evidence: only prompts and prompt kits can rename slugs (SlugEditor exists only there) and both already have redirect tables + lookup. Skills/workflows slugs are immutable in the UI, so no redirect gap exists.
- **Task D3 refine scope** — Send-to-LLM shipped for skills/workflows; "Refine with AI" stays prompt-only because RefinePromptModal persists to the prompts table and the refine-prompt system prompt is prompt-engineering-specific. Revisit if demand shows.
- **Notifications settings** — remains "Coming soon" placeholder; harmless.
- **List virtualization** — re-evaluate only if E1 pagination proves insufficient (Discover now pages at 24, other tabs capped at 60).
- **Encrypting stored integration secrets (GitHub PAT, Menerio key)** — needs vault/pgsodium design; backlog.
- **MenerioBulkSync client-side polling** — works; backlog for server-side job status.

## Extra fixes shipped beyond the plan (2026-07-05)

- **prompt_kits.author_id FK** was missing → the Discover "Prompt Kits" tab 400'd in production. Fixed via Lovable migration; verified live.
- **Stale package-lock.json** synced with package.json.
- **notify-admin verified in production**: anonymous POST now returns 401 (also proves push-to-main deploys edge functions).
