# CLAUDE.md

This file provides guidance for Claude Code when working in this repository.

## Project Overview

**Querino** is an open-source SaaS platform for discovering, creating, and sharing AI artifacts: prompts, skills, workflows, prompt kits and collections. It is licensed under AGPL-3.0.

## Non-negotiable security rule

**An edge function never reads an identity from a request body.** It derives the
identity from the JWT with `getCallerUserId` (`supabase/functions/_shared/llm.ts`),
or it is a machine endpoint and requires `X-Internal-Key`
(`supabase/functions/_shared/internalAuth.ts`). There is no third option.

This is written down because the same mistake was made three times and cost the
whole user list: `ensure-token-allowance` handed out every account id to an
unauthenticated POST, let any user mint themselves unlimited AI credits, and
`menerio-link-callback` used whatever `user_id` the body named. If a machine
endpoint also has a human button, use `requireMachineOrAdmin`, not a body flag.

`tests/security/` fails when this is broken. Run `npm test` before shipping an
edge function.

## Non-negotiable product policy

**No checkout, ever.** Querino must not contain a working payment/checkout
flow: no Stripe checkout, no pricing/purchase page, no customer portal.
The "contact support@querino.ai" stubs in `src/hooks/useStripeCheckout.ts`
and `src/hooks/useSubscription.ts` are intentional. Premium is granted
manually. Do not "fix" or restore any self-serve payment path.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite 8, TanStack Router + TanStack Start (file routes in `src/routes/`, built by Nitro)
- **UI**: Tailwind CSS 4, shadcn/ui (Radix UI), Lucide icons, Tiptap editors
- **State**: TanStack Query v5 (server state), React Context (auth, workspace)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions on Deno)
- **AI**: edge functions call the LLM provider directly through `supabase/functions/_shared/llm.ts`
  (OpenRouter, OpenAI or the Lovable gateway; the model per call site is configured in the admin panel).
  The old n8n orchestration is gone: there is no `n8n/` directory and no `N8N_*` secret.
- **Payments**: none (see the product policy above; the Stripe functions are dormant stubs)
- **Package Manager**: bun (bun.lock present) or npm

## Development Commands

```bash
npm run dev        # Start dev server at http://localhost:8080
npm run build      # Production build
npm run lint       # Run ESLint
npm run check      # Migrations, lint ratchet, Deno type ratchet (runs on every push)
npm run test:unit  # Deno unit tests for supabase/functions/_shared
npm test           # Security test suite against the deployed project (tests/security/, see its README)
npm run preview    # Preview production build
```

## Project Structure

```
src/
  routes/          # TanStack Router file routes (one file per URL, they render a page)
  components/      # Feature-based component directories (prompts/, skills/, workflows/, promptKits/, ui/, ...)
  pages/           # Route-level page components (30+ pages)
  hooks/           # Custom React hooks (50+) — data fetching and feature logic
  contexts/        # AuthContext, WorkspaceContext
  types/           # TypeScript type definitions per artifact type
  lib/             # Utilities (utils.ts, markdown.ts, openLLM.ts, router-compat.tsx, ...)
  config/          # Static config (languages, pricing, stripe)
  integrations/    # Supabase client + auto-generated DB types
supabase/
  functions/       # 37 Edge Functions (AI calls, MCP server, GitHub sync, Menerio sync, ...)
  functions/_shared/  # shared modules and their Deno unit tests
  migrations/      # Database migrations
scripts/           # the `npm run check` gates (migrations, lint ratchet, deno-check ratchet)
tests/security/    # live tripwire suite against the deployed project
docs/              # Implementation guides and schema documentation
```

## Architecture

### Data Flow
```
React Frontend → TanStack Query → Supabase Edge Functions → _shared/llm.ts → LLM provider (OpenRouter / OpenAI / Lovable gateway)
```

### Key Patterns
- **Custom hooks** wrap all Supabase queries/mutations (e.g. `usePrompts`, `useSkills`, `useTeams`)
- **TanStack Query** handles all server state with `useQuery` / `useMutation`
- **Path alias**: `@/*` maps to `./src/*`
- **shadcn/ui** components live in `src/components/ui/` — do not edit these directly
- Edge Functions that call an LLM go through `callLovableAI` in `_shared/llm.ts` (the name is historical, it serves every provider): it resolves the
  call site's configured provider/model (`_shared/llm-config.ts`), checks and charges the
  caller's credit allowance (`_shared/allowance.ts`), and records an `llm_usage_events` row

### Artifact Types
The four web-surfaced artifact types follow the same CRUD pattern:
- **Prompts** — `src/pages/Prompt*.tsx`, `src/hooks/usePrompts.ts`
- **Skills** — `src/pages/Skill*.tsx`, `src/hooks/useSkills.ts`
- **Workflows** — `src/pages/Workflow*.tsx`, `src/hooks/useWorkflows.ts`
- **Prompt Kits** — `src/pages/PromptKit*.tsx`, `src/hooks/usePromptKits.ts`

Each has: New / Detail / Edit pages, a card component, and a custom hook.

**CLAWs are gone.** Migration `20260430155205` dropped `public.claws` in April 2026. The six MCP tools that still spoke to it were removed on 2026-09-08, after every one of them was confirmed to answer "Could not find the table 'public.claws'". There is no claws table, no `/claws` route, no hook and no component. Do not reintroduce one without recreating the table first.

## Environment Variables

Frontend (Vite prefix required):
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SITE_ORIGIN          # optional, canonical origin for SEO tags (defaults to https://querino.ai)
```

Supabase Edge Function secrets (set with `npx supabase secrets set`, never committed):
```
OPENROUTER_API_KEY        # LLM calls and embeddings (at least one LLM provider key is required)
OPENAI_API_KEY            # alternative LLM / embedding provider
LOVABLE_API_KEY           # Lovable AI gateway, alternative LLM provider
INTERNAL_JOB_SECRET       # X-Internal-Key shared with pg_cron and other machine callers
RESEND_API_KEY            # transactional mail (notify-admin, delete-my-account)
ADMIN_EMAIL               # recipient of the signup notification
PUBLIC_SITE_URL           # absolute origin used in generated links
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase.

See `.env.example` for reference.

## TypeScript Notes

- Path alias `@/*` → `./src/*` is configured in both `tsconfig.json` and `vite.config.ts`
- Loose type checking: `allowJs: true`, `noImplicitAny: false`, strict null checks not enforced
- The edge functions are strict (`supabase/functions/deno.json`), enforced as a ratchet by `scripts/deno-check.mjs`: the per-function error counts in `scripts/deno-check-baseline.json` may fall, never rise. After lowering one, run `node scripts/deno-check.mjs --update`
- Supabase types are auto-generated — do not edit `src/integrations/supabase/types.ts` manually
- Regenerate types with: `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`

## Supabase Edge Functions

Functions are in `supabase/functions/`. Each is a Deno TypeScript module.

To deploy all functions:
```bash
npx supabase functions deploy
```

To deploy a single function:
```bash
npx supabase functions deploy <function-name>
```

## LLM calls

There is no n8n. Every AI feature is an edge function that calls `callLovableAI` from
`supabase/functions/_shared/llm.ts` (the name is historical; it dispatches to whichever provider the call site is configured for):

- Prompt Wizard, Refinement, Coach, Insights, Translation
- Metadata suggestion (prompts, prompt kits, skills, workflows)
- Skill / Workflow / Prompt-kit Coach and Insights
- Embeddings (`generate-embedding`, `backfill-embeddings`) through `_shared/embeddings.ts`

Which provider and model a call site uses is stored in the `llm_call_configs` table and edited
in the admin panel (`admin-llm-config`); the prompt each call site sends is in
`_shared/prompts/`. The public model catalogue (`llm-models`, refreshed nightly by
`sync-llm-models`) is what the admin panel picks models from.

## Database Migrations

Migrations are in `supabase/migrations/`. Apply with:
```bash
npx supabase db push
```

Do not edit migration files that have already been applied to production.

## Code Conventions

- Functional components only; no class components
- Feature-scoped components in `src/components/<feature>/`
- One hook per data domain in `src/hooks/`
- Use `sonner` (`toast`) for user notifications — imported from `@/components/ui/sonner`
- Form validation uses React Hook Form + Zod
- Dark mode is CSS-class-based via `next-themes`
