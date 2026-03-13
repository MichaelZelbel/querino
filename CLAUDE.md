# CLAUDE.md

This file provides guidance for Claude Code when working in this repository.

## Project Overview

**Querino** is an open-source SaaS platform for discovering, creating, and sharing AI artifacts — prompts, skills, workflows, and CLAWs (callable capabilities). It is licensed under AGPL-3.0.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite 5.4, React Router v6
- **UI**: Tailwind CSS 3.4, shadcn/ui (Radix UI), Lucide icons
- **State**: TanStack Query v5 (server state), React Context (auth, workspace)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Orchestration**: n8n workflows (Azure Foundry / OpenAI as LLM providers)
- **Payments**: Stripe
- **Package Manager**: bun (bun.lock present) or npm

## Development Commands

```bash
npm run dev        # Start dev server at http://localhost:8080
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Project Structure

```
src/
  components/      # Feature-based component directories (prompts/, skills/, workflows/, claws/, ui/, ...)
  pages/           # Route-level page components (30+ pages)
  hooks/           # Custom React hooks (50+) — data fetching and feature logic
  contexts/        # AuthContext, WorkspaceContext
  types/           # TypeScript type definitions per artifact type
  lib/             # Utilities (utils.ts, markdown.ts, openLLM.ts, ...)
  config/          # Static config (languages, pricing, stripe)
  integrations/    # Supabase client + auto-generated DB types
supabase/
  functions/       # 25+ Edge Functions (AI calls, Stripe, GitHub sync, etc.)
  migrations/      # Database migrations
n8n/               # n8n workflow JSON files (16 workflows)
docs/              # Implementation guides and schema documentation
```

## Architecture

### Data Flow
```
React Frontend → TanStack Query → Supabase Edge Functions → n8n Webhooks → LLM (Azure/OpenAI)
```

### Key Patterns
- **Custom hooks** wrap all Supabase queries/mutations (e.g. `usePrompts`, `useSkills`, `useTeams`)
- **TanStack Query** handles all server state with `useQuery` / `useMutation`
- **Path alias**: `@/*` maps to `./src/*`
- **shadcn/ui** components live in `src/components/ui/` — do not edit these directly
- Edge Functions call n8n via HTTP webhook with `X-API-Key` auth header

### Artifact Types
The four core artifact types follow the same CRUD pattern:
- **Prompts** — `src/pages/Prompt*.tsx`, `src/hooks/usePrompts.ts`
- **Skills** — `src/pages/Skill*.tsx`, `src/hooks/useSkills.ts`
- **Workflows** — `src/pages/Workflow*.tsx`, `src/hooks/useWorkflows.ts`
- **CLAWs** — `src/pages/Claw*.tsx`, `src/hooks/useClaws.ts`

Each has: New / Detail / Edit pages, a card component, and a custom hook.

## Environment Variables

Frontend (Vite prefix required):
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Supabase Edge Function secrets:
```
N8N_BASE_URL          # n8n instance URL
N8N_WEBHOOK_KEY       # X-API-Key for n8n HTTP Header Auth
```

See `.env.example` for reference.

## TypeScript Notes

- Path alias `@/*` → `./src/*` is configured in both `tsconfig.json` and `vite.config.ts`
- Loose type checking: `allowJs: true`, `noImplicitAny: false`, strict null checks not enforced
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

## n8n Workflows

Workflow JSON files are in `n8n/`. See `n8n/README.md` for import instructions.

AI features are routed through n8n:
- Prompt Wizard, Refinement, Coach, Insights
- Metadata suggestion (prompts, skills, workflows, CLAWs)
- Skill/Workflow/Claw Coach and Insights
- Artifact Translation
- Token usage tracking

### Working on n8n Workflows with the User

n8n workflow development is collaborative — Claude works **together with the user** to design, build, deploy, and test workflows directly on the live n8n instance.

**Available tools:**

**n8n-mcp** ([czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp)) — MCP server with 20+ tools for direct n8n instance interaction:

| Category | Tools |
|---|---|
| Discovery | `search_nodes`, `get_node_info`, `get_node_documentation`, `get_node_essentials` |
| Validation | `validate_node_minimal`, `validate_node_operation`, `validate_workflow`, `validate_workflow_connections`, `validate_workflow_expressions` |
| Templates | `search_templates`, `get_template`, `list_node_templates`, `get_templates_for_task` |
| Workflow CRUD | `n8n_list_workflows`, `n8n_get_workflow`, `n8n_create_workflow`, `n8n_update_full_workflow`, `n8n_update_partial_workflow`, `n8n_delete_workflow` |
| Execution | `n8n_trigger_webhook_workflow`, `n8n_list_executions`, `n8n_get_execution`, `n8n_delete_execution` |
| System | `n8n_health_check`, `n8n_diagnostic`, `tools_documentation` |

**n8n-skills** ([czlonkowski/n8n-skills](https://github.com/czlonkowski/n8n-skills)) — Seven Claude Code skills that activate automatically based on context:

| Skill | Activates when... |
|---|---|
| `n8n-mcp-tools-expert` | Using any n8n-mcp tool — highest priority, guides tool selection |
| `n8n-workflow-patterns` | Designing workflow structure; provides 5 proven architectural patterns |
| `n8n-node-configuration` | Configuring node parameters and property dependencies |
| `n8n-expression-syntax` | Writing `{{ }}` expressions, accessing `$json`, `$node`, webhook data |
| `n8n-validation-expert` | Interpreting and fixing validation errors |
| `n8n-code-javascript` | Writing JavaScript in Code nodes (`$input.all()`, `$input.first()`) |
| `n8n-code-python` | Writing Python in Code nodes (use JS for 95% of cases) |

**Process:**
1. Discuss the workflow goal and design with the user before building
2. Check existing workflows with `n8n_list_workflows` / `n8n_get_workflow` for context and conventions
3. Search for relevant nodes and templates (`search_nodes`, `search_templates`, `get_node_essentials`)
4. Build with `n8n_create_workflow` or update with `n8n_update_partial_workflow` (preferred — saves tokens)
5. Validate before activating (`validate_workflow`, `n8n_validate_workflow`)
6. Trigger and inspect executions (`n8n_trigger_webhook_workflow`, `n8n_get_execution`)
7. Iterate until the workflow functions correctly
8. Save the final workflow JSON to `n8n/` in the repository

**Standards:**
- Always start with `tools_documentation` or `get_node_essentials` — not `get_node_info` (too verbose)
- Prefer `n8n_update_partial_workflow` over full replacement (99% success rate, 80–90% token savings)
- Validate before every deploy — use `validate_workflow` then `n8n_validate_workflow` (server-side)
- Prefer updating existing workflows over creating duplicates
- Webhook data in expressions is accessed via `$json.body`, not `$json` directly
- Always confirm with the user before deleting workflows or executions

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
