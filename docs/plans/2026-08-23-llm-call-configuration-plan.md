# Admin-configurable LLM calls: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Querino administrator change the provider, model and system prompt of any of the app's 17 LLM call sites from the admin page, with no deploy.

**Architecture:** One table keyed on `(call_site, tier)`. A resolution layer that walks tier row, then `default` row, then the code default, and returns the first enabled match. The existing chokepoint `callLovableAI` gains that resolution plus provider dispatch, so 15 of the 17 call sites need no code change. Two call sites that bypass the chokepoint get rewired. An admin-only edge function reads, seeds and test-runs configs; a lazy-loaded panel in a new tabbed admin page edits them.

**Tech Stack:** Supabase (Postgres, RLS, Deno edge functions), React 18 + TypeScript, shadcn/ui, TanStack Query, Playwright for live security tests, `deno test` for unit tests.

**Spec:** `docs/plans/2026-08-23-llm-call-configuration-design.md`

## Global Constraints

- **An edge function never reads an identity from a request body.** It derives identity from the JWT with `getCallerUserId`, or it is a machine endpoint requiring `X-Internal-Key` via `_shared/internalAuth.ts`. If a machine endpoint also has a human button, use `requireMachineOrAdmin`. (Repo CLAUDE.md, non-negotiable.)
- **Every new table in `public` has row-level security enabled with explicit policies.** `scripts/check-migrations.mjs` fails the build otherwise.
- **Every new `SECURITY DEFINER` function sets `search_path`.** Same checker.
- **Every new view states `security_invoker` explicitly.** Same checker. This plan creates no views.
- Migration filenames: `supabase/migrations/YYYYMMDDHHMMSS_a_sentence_in_snake_case.sql`.
- The `updated_at` trigger function in this repo is `public.update_updated_at_column`. `handle_updated_at` does not exist here.
- Edge function TypeScript is strict (`supabase/functions/deno.json`: `strict`, `noImplicitAny`, `strictNullChecks`, `noFallthroughCasesInSwitch`, `noImplicitOverride`). `scripts/deno-check.mjs` ratchets error counts per function and fails if any function gains one.
- Providers, exactly these five: `lovable`, `openrouter`, `openai`, `anthropic`, `gemini`. No Mistral.
- Tiers, exactly these three: `default`, `free`, `premium`.
- `DEFAULT_MODEL` is `google/gemini-3-flash-preview` and stays the seeded model for all 17 rows.
- `npm run check` (migrations, lint ratchet, Deno types) must pass before every commit.

## Deployment reality

Querino reaches production through Lovable: push to `main`, then ask the Lovable agent to apply the migration and deploy the functions. The Playwright suite in `tests/security/` runs against the **live** project, so the two tests in Task 10 cannot pass until Task 1's migration is applied there. Every other task is verified locally by `deno test` and `npm run check`. Task 10 states the deploy step explicitly rather than pretending the tests run offline.

## File structure

**Created:**

| File | Responsibility |
| --- | --- |
| `supabase/migrations/<ts>_llm_calls_get_a_configuration.sql` | Table, RLS, trigger, 17 seed rows |
| `supabase/functions/_shared/llm-config.ts` | Config types, the tier fallback chain, prompt interpolation, role-to-tier mapping, the 30s cache |
| `supabase/functions/_shared/llm-config_test.ts` | Unit tests for the above |
| `supabase/functions/_shared/llm-providers.ts` | The five transports, normalised to one result shape |
| `supabase/functions/_shared/llm-providers_test.ts` | Unit tests for the above |
| `supabase/functions/_shared/llm_test.ts` | Unit tests for system-message replacement |
| `supabase/functions/admin-llm-config/index.ts` | Admin-only list / sync_defaults / test |
| `supabase/functions/_shared/llm-registry.ts` | The 17 call sites' metadata and the provider preset catalogue |
| `src/components/admin/UsersPanel.tsx` | The users table, moved out of `Admin.tsx` unchanged |
| `src/components/admin/LLMConfigPanel.tsx` | The config table and edit dialog |
| `tests/security/18-llm-config-is-admin-only.spec.ts` | Live RLS and 403 assertions |
| `tests/security/19-a-call-site-uses-its-configured-model.spec.ts` | Live end-to-end assertion |

**Modified:**

| File | Change |
| --- | --- |
| `supabase/functions/_shared/llm.ts` | `callLovableAI` resolves config and dispatches by provider |
| `supabase/functions/canvas-ai/index.ts` | Routed through `callLovableAI` |
| `supabase/functions/ai-moderate-content/index.ts` | Uses `resolveConfig` and a transport, keeps no credit gate |
| `src/pages/Admin.tsx` | Becomes a tab shell |
| `package.json` | Adds `test:unit` |

**A deliberate improvement over Menerio's version.** Menerio's `resolveConfig` does its own query and its own chain in one function, which cannot be unit tested without a database. Here the I/O and the logic are separated: `loadConfigRows` fetches every tier row for a call site in **one** query (at most three rows), and `pickConfig` is a pure function that chooses among them. All chain behaviour is then testable offline.

---

### Task 1: The table

**Files:**
- Create: `supabase/migrations/<ts>_llm_calls_get_a_configuration.sql` (use a real timestamp, later than `20260823120000`)

**Interfaces:**
- Consumes: nothing
- Produces: table `public.llm_call_configs`, primary key `(call_site, tier)`, 17 rows at tier `default`

- [ ] **Step 1: Write the migration**

Create the file with this exact content, replacing `<ts>` in the filename with a timestamp after `20260823120000` (for example `20260823130000`):

```sql
-- Every AI call in Querino hardcoded its model and its system prompt, so
-- changing either one was a deploy. This makes them a row.
--
-- A missing row, or a row with enabled = false, means "use the code default".
-- The feature is therefore inert until an administrator touches it, and turning
-- a row off is always a safe way back.
--
-- `tier` is here on day one even though per-tier configuration is not built and
-- may never be. It is the one part of that feature that is expensive to add
-- later: it is in the primary key. With the column present, switching tiering on
-- is a control in the panel and nothing else.

CREATE TABLE public.llm_call_configs (
  call_site     TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'default',
  description   TEXT,
  provider      TEXT NOT NULL DEFAULT 'lovable',
  model         TEXT NOT NULL,
  system_prompt TEXT,
  temperature   NUMERIC,
  max_tokens    INTEGER,
  extra_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  updated_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (call_site, tier),
  CONSTRAINT llm_call_configs_provider_chk
    CHECK (provider IN ('lovable','openrouter','openai','anthropic','gemini')),
  CONSTRAINT llm_call_configs_tier_chk
    CHECK (tier IN ('default','free','premium'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.llm_call_configs TO authenticated;
GRANT ALL ON public.llm_call_configs TO service_role;

ALTER TABLE public.llm_call_configs ENABLE ROW LEVEL SECURITY;

-- Admins only, both ways. No policy for anon: the anon key ships in the browser
-- bundle, and a system prompt is not something to hand out with it.
CREATE POLICY "Admins can read llm_call_configs"
  ON public.llm_call_configs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can write llm_call_configs"
  ON public.llm_call_configs
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_llm_call_configs_updated_at
BEFORE UPDATE ON public.llm_call_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- All 17 seed at tier 'default' with exactly what the code does today, and a
-- NULL system_prompt meaning "use the code default", so applying this changes
-- no behaviour at all.
INSERT INTO public.llm_call_configs (call_site, description, provider, model, system_prompt, enabled)
VALUES
  ('prompt-coach',               'Chat coach that helps a user write a prompt.',                  'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('prompt-kit-coach',           'Chat coach that helps a user write a prompt kit.',              'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('skill-coach',                'Chat coach that helps a user write a skill.',                   'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('workflow-coach',             'Chat coach that helps a user write a workflow.',                'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-metadata',           'Suggests title, description and tags for a prompt.',            'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-promptkit-metadata', 'Suggests title, description and tags for a prompt kit.',        'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-skill-metadata',     'Suggests title, description and tags for a skill.',             'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-workflow-metadata',  'Suggests title, description and tags for a workflow.',          'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-prompt',         'Generates the AI insights shown on a prompt page.',             'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-skill',          'Generates the AI insights shown on a skill page.',              'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-workflow',       'Generates the AI insights shown on a workflow page.',           'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-prompt_kit',     'Generates the AI insights shown on a prompt kit page.',         'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('prompt-wizard',              'The guided wizard that builds a prompt from answers.',          'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('prompt-refinement',          'Refines an existing prompt on request.',                        'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('translate-artifact',         'Translates an artifact into another language.',                 'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('canvas-ai',                  'The canvas assistant that edits an artifact in place.',         'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-moderate-content',        'Classifies queued user content against the content policies.',  'lovable', 'google/gemini-3-flash-preview', NULL, true)
ON CONFLICT (call_site, tier) DO NOTHING;
```

- [ ] **Step 2: Run the migration checker and confirm it passes**

Run: `node scripts/check-migrations.mjs`
Expected: exits 0. If it reports the new table has no RLS, the `ENABLE ROW LEVEL SECURITY` line was lost; re-add it.

- [ ] **Step 3: Confirm the seed count is 17**

Run: `grep -c "^  ('" supabase/migrations/*_llm_calls_get_a_configuration.sql`
Expected: `17`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "LLM calls get a configuration table

Seventeen call sites, all seeded with exactly what the code does today and a
NULL system prompt meaning 'use the code default', so applying this changes no
behaviour. Admin-only both ways: the anon key ships in the browser bundle and a
system prompt is not something to hand out with it."
```

---

### Task 2: The registry of call sites

**Files:**
- Create: `supabase/functions/_shared/llm-registry.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `type Provider`, `type Tier`, `CALL_SITES: CallSiteMeta[]`, `getCallSiteMeta(callSite: string): CallSiteMeta | undefined`, `PROVIDER_PRESETS: ProviderPreset[]`, `PROVIDER_SECRETS: Record<Provider, string>`

This file holds no prompt text. Default system prompts stay in the files that own them and are passed to the resolver as fallbacks (spec section 8).

- [ ] **Step 1: Write the registry**

Create `supabase/functions/_shared/llm-registry.ts`:

```ts
// What the admin panel needs to know about each call site, and nothing else.
//
// Deliberately not a home for prompt text. Menerio's equivalent grew to 918
// lines because default prompts were migrated into it; here they stay in the
// files that own them and are passed to the resolver as a fallback, so this
// file stays a table of contents.

export type Provider = "lovable" | "openrouter" | "openai" | "anthropic" | "gemini";
export type Tier = "default" | "free" | "premium";

export const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export interface CallSiteMeta {
  call_site: string;
  description: string;
  provider: Provider;
  model: string;
  /** Names usable as {{name}} in a custom system prompt. */
  placeholders: string[];
}

export const CALL_SITES: CallSiteMeta[] = [
  { call_site: "prompt-coach", description: "Chat coach that helps a user write a prompt.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "prompt-kit-coach", description: "Chat coach that helps a user write a prompt kit.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "skill-coach", description: "Chat coach that helps a user write a skill.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "workflow-coach", description: "Chat coach that helps a user write a workflow.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "suggest-metadata", description: "Suggests title, description and tags for a prompt.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "suggest-promptkit-metadata", description: "Suggests title, description and tags for a prompt kit.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "suggest-skill-metadata", description: "Suggests title, description and tags for a skill.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "suggest-workflow-metadata", description: "Suggests title, description and tags for a workflow.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "ai-insights-prompt", description: "Generates the AI insights shown on a prompt page.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "ai-insights-skill", description: "Generates the AI insights shown on a skill page.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "ai-insights-workflow", description: "Generates the AI insights shown on a workflow page.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "ai-insights-prompt_kit", description: "Generates the AI insights shown on a prompt kit page.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "prompt-wizard", description: "The guided wizard that builds a prompt from answers.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "prompt-refinement", description: "Refines an existing prompt on request.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
  { call_site: "translate-artifact", description: "Translates an artifact into another language.", provider: "lovable", model: DEFAULT_MODEL, placeholders: ["targetLanguage"] },
  { call_site: "canvas-ai", description: "The canvas assistant that edits an artifact in place.", provider: "lovable", model: DEFAULT_MODEL, placeholders: ["mode", "artifactType", "canvasContent"] },
  { call_site: "ai-moderate-content", description: "Classifies queued user content against the content policies.", provider: "lovable", model: DEFAULT_MODEL, placeholders: [] },
];

const BY_CALL_SITE = new Map(CALL_SITES.map((c) => [c.call_site, c]));

export function getCallSiteMeta(callSite: string): CallSiteMeta | undefined {
  return BY_CALL_SITE.get(callSite);
}

export const PROVIDER_SECRETS: Record<Provider, string> = {
  lovable: "LOVABLE_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
};

export interface ProviderPreset {
  provider: Provider;
  label: string;
  models: { value: string; label: string }[];
}

// Served to the panel rather than hardcoded in it, so swapping this constant for
// a live catalogue or a shared cross-app registry later is a change to this file
// and nothing else. The panel also keeps a free-text model field, which is what
// actually makes a model released this morning usable this morning.
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    provider: "lovable",
    label: "Lovable AI Gateway",
    models: [
      { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash Preview (default)" },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (cheapest)" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (strongest)" },
      { value: "openai/gpt-5", label: "GPT-5" },
      { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
      { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
    ],
  },
  {
    provider: "openrouter",
    label: "OpenRouter",
    models: [
      { value: "openrouter/auto", label: "Auto (OpenRouter chooses)" },
      { value: "openai/gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
      { value: "openai/gpt-4o", label: "OpenAI GPT-4o" },
      { value: "anthropic/claude-3.5-sonnet", label: "Anthropic Claude 3.5 Sonnet" },
      { value: "google/gemini-2.0-flash-001", label: "Google Gemini 2.0 Flash" },
      { value: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (free)" },
    ],
  },
  {
    provider: "openai",
    label: "OpenAI",
    models: [
      { value: "gpt-4o-mini", label: "gpt-4o-mini" },
      { value: "gpt-4o", label: "gpt-4o" },
      { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
      { value: "gpt-4.1", label: "gpt-4.1" },
    ],
  },
  {
    provider: "anthropic",
    label: "Anthropic",
    models: [
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    ],
  },
  {
    provider: "gemini",
    label: "Gemini (Google)",
    models: [
      { value: "gemini-2.0-flash", label: "gemini-2.0-flash" },
      { value: "gemini-2.0-flash-lite", label: "gemini-2.0-flash-lite" },
      { value: "gemini-1.5-pro", label: "gemini-1.5-pro" },
    ],
  },
];
```

- [ ] **Step 2: Confirm the registry and the migration agree**

Run:
```bash
node -e "const s=require('fs').readFileSync(require('fs').readdirSync('supabase/migrations').filter(f=>f.includes('llm_calls_get_a_configuration')).map(f=>'supabase/migrations/'+f)[0],'utf8');const m=[...s.matchAll(/^  \('([a-z0-9_-]+)',/gm)].map(x=>x[1]);const t=require('fs').readFileSync('supabase/functions/_shared/llm-registry.ts','utf8');const r=[...t.matchAll(/call_site: \"([a-z0-9_-]+)\"/g)].map(x=>x[1]);const miss=m.filter(x=>!r.includes(x)).concat(r.filter(x=>!m.includes(x)));console.log(miss.length?'MISMATCH: '+miss.join(', '):'OK '+m.length+' call sites');"
```
Expected: `OK 17 call sites`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/_shared/llm-registry.ts
git commit -m "A registry of the seventeen call sites, holding no prompt text

Menerio's equivalent grew to 918 lines because prompt text was migrated into
it. Default prompts stay in the files that own them and reach the resolver as a
fallback, so this stays a table of contents. The provider presets live here too
rather than in the React panel, which is the seam for a shared model registry
later."
```

---

### Task 3: The resolution layer

**Files:**
- Create: `supabase/functions/_shared/llm-config.ts`
- Create: `supabase/functions/_shared/llm-config_test.ts`
- Modify: `package.json` (add `test:unit`)

**Interfaces:**
- Consumes: `Provider`, `Tier` from `llm-registry.ts`
- Produces:
  - `interface ConfigRow { call_site, tier, provider, model, system_prompt, temperature, max_tokens, extra_options, enabled }`
  - `interface CallDefaults { provider: Provider; model: string; systemPrompt?: string | null; temperature?: number | null; maxTokens?: number | null }`
  - `interface EffectiveConfig { provider: Provider; model: string; system_prompt: string | null; temperature: number | null; max_tokens: number | null }`
  - `type ConfigSource = "db-free" | "db-premium" | "db-default" | "fallback-default"`
  - `pickConfig(rows: ConfigRow[], tier: Tier, defaults: CallDefaults): { effective: EffectiveConfig; source: ConfigSource }` (pure)
  - `mapRoleToTier(role: string | null | undefined): Tier` (pure)
  - `interpolatePrompt(prompt: string | null, vars?: Record<string, string | number | null | undefined>): string | null` (pure)
  - `applySystemPrompt(messages: ChatMessageLike[], systemPrompt: string | null): ChatMessageLike[]` (pure)
  - `loadConfigRows(db: DbLike, callSite: string): Promise<ConfigRow[]>`
  - `resolveTier(db: DbLike, userId: string | null): Promise<Tier>`
  - `resolveConfig(db: DbLike, callSite: string, tier: Tier, defaults: CallDefaults): Promise<{ effective: EffectiveConfig; source: ConfigSource }>`
  - `resolveSystemPrompt(db: DbLike, callSite: string, tier: Tier, fallback: string, vars?: Record<string, string | number | null | undefined>): Promise<string>`
  - `__clearConfigCache(): void` (test seam)

`DbLike` is a structural interface declared in this file, not an import of `supabase-js`, so `deno test` runs offline with type checking on.

- [ ] **Step 1: Add the unit test script**

In `package.json`, add to `scripts`, after `"test:security"`:

```json
    "test:unit": "deno test --allow-none supabase/functions/_shared/",
```

If `--allow-none` is rejected by the installed Deno version, use `"test:unit": "deno test supabase/functions/_shared/"`. The tests need no permissions either way.

- [ ] **Step 2: Write the failing tests**

Create `supabase/functions/_shared/llm-config_test.ts`:

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  pickConfig,
  mapRoleToTier,
  interpolatePrompt,
  applySystemPrompt,
  type ConfigRow,
  type CallDefaults,
} from "./llm-config.ts";

const DEFAULTS: CallDefaults = {
  provider: "lovable",
  model: "google/gemini-3-flash-preview",
  systemPrompt: "code default prompt",
};

function row(over: Partial<ConfigRow> = {}): ConfigRow {
  return {
    call_site: "prompt-coach",
    tier: "default",
    provider: "openai",
    model: "gpt-4o-mini",
    system_prompt: null,
    temperature: null,
    max_tokens: null,
    extra_options: {},
    enabled: true,
    ...over,
  };
}

Deno.test("pickConfig: no rows falls back to the code default", () => {
  const { effective, source } = pickConfig([], "free", DEFAULTS);
  assertEquals(source, "fallback-default");
  assertEquals(effective.provider, "lovable");
  assertEquals(effective.model, "google/gemini-3-flash-preview");
  assertEquals(effective.system_prompt, "code default prompt");
});

Deno.test("pickConfig: the default row serves a free caller when no free row exists", () => {
  const { effective, source } = pickConfig([row()], "free", DEFAULTS);
  assertEquals(source, "db-default");
  assertEquals(effective.model, "gpt-4o-mini");
});

Deno.test("pickConfig: a premium row wins for a premium caller", () => {
  const rows = [row(), row({ tier: "premium", model: "gpt-4o" })];
  const { effective, source } = pickConfig(rows, "premium", DEFAULTS);
  assertEquals(source, "db-premium");
  assertEquals(effective.model, "gpt-4o");
});

Deno.test("pickConfig: a premium row does not leak to a free caller", () => {
  const rows = [row(), row({ tier: "premium", model: "gpt-4o" })];
  const { effective } = pickConfig(rows, "free", DEFAULTS);
  assertEquals(effective.model, "gpt-4o-mini");
});

Deno.test("pickConfig: a disabled tier row falls through to the tier below it", () => {
  const rows = [row(), row({ tier: "premium", model: "gpt-4o", enabled: false })];
  const { effective, source } = pickConfig(rows, "premium", DEFAULTS);
  assertEquals(source, "db-default");
  assertEquals(effective.model, "gpt-4o-mini");
});

Deno.test("pickConfig: a disabled default row falls all the way through to code", () => {
  const { effective, source } = pickConfig([row({ enabled: false })], "free", DEFAULTS);
  assertEquals(source, "fallback-default");
  assertEquals(effective.model, "google/gemini-3-flash-preview");
});

Deno.test("pickConfig: an empty system_prompt is not an override", () => {
  const { effective } = pickConfig([row({ system_prompt: "   " })], "free", DEFAULTS);
  assertEquals(effective.system_prompt, "code default prompt");
});

Deno.test("mapRoleToTier maps the paying roles to premium and everything else to free", () => {
  assertEquals(mapRoleToTier("premium"), "premium");
  assertEquals(mapRoleToTier("premium_gift"), "premium");
  assertEquals(mapRoleToTier("admin"), "premium");
  assertEquals(mapRoleToTier("free"), "free");
  assertEquals(mapRoleToTier(null), "free");
  assertEquals(mapRoleToTier("something-new"), "free");
});

Deno.test("interpolatePrompt substitutes a value", () => {
  assertEquals(interpolatePrompt("Translate into {{targetLanguage}}.", { targetLanguage: "German" }), "Translate into German.");
});

Deno.test("interpolatePrompt collapses a missing key rather than leaking braces", () => {
  assertEquals(interpolatePrompt("Hello {{nobody}}!", {}), "Hello !");
});

Deno.test("interpolatePrompt leaves a null prompt null", () => {
  assertEquals(interpolatePrompt(null, { a: "b" }), null);
});

Deno.test("applySystemPrompt replaces an existing system message", () => {
  const out = applySystemPrompt(
    [{ role: "system", content: "old" }, { role: "user", content: "hi" }],
    "new",
  );
  assertEquals(out, [{ role: "system", content: "new" }, { role: "user", content: "hi" }]);
});

Deno.test("applySystemPrompt prepends when there is no system message", () => {
  const out = applySystemPrompt([{ role: "user", content: "hi" }], "new");
  assertEquals(out, [{ role: "system", content: "new" }, { role: "user", content: "hi" }]);
});

Deno.test("applySystemPrompt leaves the caller's messages alone when there is no override", () => {
  const msgs = [{ role: "system" as const, content: "old" }, { role: "user" as const, content: "hi" }];
  assertEquals(applySystemPrompt(msgs, null), msgs);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL, module `./llm-config.ts` not found.

- [ ] **Step 4: Write the implementation**

Create `supabase/functions/_shared/llm-config.ts`:

```ts
// Resolving what a call site should actually do, given what the administrator
// configured and what the code would otherwise have done.
//
// The I/O and the logic are deliberately separate. loadConfigRows fetches every
// tier row for one call site in a single query (at most three), and pickConfig
// chooses among them as a pure function. Menerio's version does both at once
// and therefore cannot be tested without a database.

import type { Provider, Tier } from "./llm-registry.ts";

export interface ConfigRow {
  call_site: string;
  tier: Tier;
  provider: Provider;
  model: string;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
  extra_options: Record<string, unknown>;
  enabled: boolean;
}

export interface CallDefaults {
  provider: Provider;
  model: string;
  systemPrompt?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
}

export interface EffectiveConfig {
  provider: Provider;
  model: string;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
}

export type ConfigSource = "db-free" | "db-premium" | "db-default" | "fallback-default";

export interface ChatMessageLike {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
}

/** The shape of the supabase client this module needs, structurally. Declared
 *  rather than imported so the unit tests type-check with no network. */
export interface DbLike {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): PromiseLike<{
        data: unknown[] | null;
        error: { message: string } | null;
      }>;
    };
  };
}

function usable(prompt: string | null | undefined): boolean {
  return typeof prompt === "string" && prompt.trim().length > 0;
}

/**
 * Choose the effective config from every tier row a call site has.
 *
 * The chain is: the caller's own tier, then the 'default' tier, then the code
 * default the caller passed in. First ENABLED match wins, so switching a tier
 * row off restores the tier below it rather than blocking the call.
 */
export function pickConfig(
  rows: ConfigRow[],
  tier: Tier,
  defaults: CallDefaults,
): { effective: EffectiveConfig; source: ConfigSource } {
  const enabled = rows.filter((r) => r.enabled);
  const exact = tier === "default" ? undefined : enabled.find((r) => r.tier === tier);
  const chosen = exact ?? enabled.find((r) => r.tier === "default");

  if (!chosen) {
    return {
      effective: {
        provider: defaults.provider,
        model: defaults.model,
        system_prompt: usable(defaults.systemPrompt) ? defaults.systemPrompt! : null,
        temperature: defaults.temperature ?? null,
        max_tokens: defaults.maxTokens ?? null,
      },
      source: "fallback-default",
    };
  }

  return {
    effective: {
      provider: chosen.provider,
      model: chosen.model,
      // An empty or whitespace prompt is not an override. It means the admin
      // cleared the box, which is "use the code default", not "send nothing".
      system_prompt: usable(chosen.system_prompt)
        ? chosen.system_prompt
        : (usable(defaults.systemPrompt) ? defaults.systemPrompt! : null),
      temperature: chosen.temperature ?? defaults.temperature ?? null,
      max_tokens: chosen.max_tokens ?? defaults.maxTokens ?? null,
    },
    source: `db-${chosen.tier}` as ConfigSource,
  };
}

/** Which roles get the premium configuration. Everything unrecognised is free,
 *  because the safe mistake is giving someone the cheaper model, not the dearer. */
export function mapRoleToTier(role: string | null | undefined): Tier {
  if (role === "premium" || role === "premium_gift" || role === "admin") return "premium";
  return "free";
}

/** Replace {{key}}. A missing key collapses to empty with a warning, so a
 *  misconfigured prompt never leaks literal braces to the model. */
export function interpolatePrompt(
  prompt: string | null,
  vars?: Record<string, string | number | null | undefined>,
): string | null {
  if (prompt === null || prompt === undefined) return null;
  if (!vars) return prompt;
  return prompt.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    if (!(key in vars)) {
      console.warn(`[llm-config] missing template var: ${key}`);
      return "";
    }
    return String(vars[key] ?? "");
  });
}

/** Put the effective system prompt into a message list: replace the existing
 *  system message, or prepend one. A null prompt leaves the list untouched. */
export function applySystemPrompt<T extends ChatMessageLike>(
  messages: T[],
  systemPrompt: string | null,
): T[] {
  if (!usable(systemPrompt)) return messages;
  const hasSystem = messages.some((m) => m.role === "system");
  if (hasSystem) {
    return messages.map((m) => (m.role === "system" ? { ...m, content: systemPrompt! } : m));
  }
  return [{ role: "system", content: systemPrompt! } as T, ...messages];
}

const CACHE_TTL_MS = 30_000;
const configCache = new Map<string, { rows: ConfigRow[]; at: number }>();
const tierCache = new Map<string, { tier: Tier; at: number }>();

/** Test seam. Also useful from the admin function after a write. */
export function __clearConfigCache(): void {
  configCache.clear();
  tierCache.clear();
}

/** Every tier row for one call site, in one query. At most three rows. */
export async function loadConfigRows(db: DbLike, callSite: string): Promise<ConfigRow[]> {
  const cached = configCache.get(callSite);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.rows;

  const { data, error } = await db
    .from("llm_call_configs")
    .select("call_site, tier, provider, model, system_prompt, temperature, max_tokens, extra_options, enabled")
    .eq("call_site", callSite);

  if (error) {
    // Fail OPEN, unlike the credit gate. A config-table outage must not stop
    // the app doing AI at all; it just means everyone gets the code default.
    console.warn(`[llm-config] load failed for ${callSite}: ${error.message}`);
    configCache.set(callSite, { rows: [], at: Date.now() });
    return [];
  }

  const rows = (data ?? []) as ConfigRow[];
  configCache.set(callSite, { rows, at: Date.now() });
  return rows;
}

/** The caller's tier, from user_roles. No user id means a machine caller. */
export async function resolveTier(db: DbLike, userId: string | null): Promise<Tier> {
  if (!userId) return "default";

  const cached = tierCache.get(userId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.tier;

  const { data, error } = await db.from("user_roles").select("role").eq("user_id", userId);
  if (error) {
    console.warn(`[llm-config] role lookup failed for ${userId}: ${error.message}`);
    return "free";
  }
  const first = (data ?? [])[0] as { role?: string } | undefined;
  const tier = mapRoleToTier(first?.role ?? null);
  tierCache.set(userId, { tier, at: Date.now() });
  return tier;
}

export async function resolveConfig(
  db: DbLike,
  callSite: string,
  tier: Tier,
  defaults: CallDefaults,
): Promise<{ effective: EffectiveConfig; source: ConfigSource }> {
  return pickConfig(await loadConfigRows(db, callSite), tier, defaults);
}

/** For callers that build their own request and cannot go through
 *  callLovableAI. Returns the interpolated prompt, never null. */
export async function resolveSystemPrompt(
  db: DbLike,
  callSite: string,
  tier: Tier,
  fallback: string,
  vars?: Record<string, string | number | null | undefined>,
): Promise<string> {
  const { effective } = await resolveConfig(db, callSite, tier, {
    provider: "lovable",
    model: "",
    systemPrompt: fallback,
  });
  return interpolatePrompt(effective.system_prompt, vars) ?? fallback;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS, 14 tests.

- [ ] **Step 6: Run the repo checks**

Run: `npm run check`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/llm-config.ts supabase/functions/_shared/llm-config_test.ts package.json
git commit -m "Resolving a call site's config, as a pure function plus one query

The chain is tier, then default, then the code default, first ENABLED match
wins, so switching a tier row off restores the tier below rather than blocking
the call. Menerio does the query and the choosing in one function and therefore
cannot test the chain without a database; here loadConfigRows fetches all three
tiers in one go and pickConfig chooses, offline and tested.

The config table fails OPEN, unlike the credit gate: an outage means everyone
gets the code default, not that the app stops doing AI."
```

---

### Task 4: The five provider transports

**Files:**
- Create: `supabase/functions/_shared/llm-providers.ts`
- Create: `supabase/functions/_shared/llm-providers_test.ts`

**Interfaces:**
- Consumes: `Provider`, `PROVIDER_SECRETS` from `llm-registry.ts`; `ChatMessageLike` from `llm-config.ts`
- Produces:
  - `interface ProviderRequest { provider: Provider; model: string; messages: ChatMessageLike[]; temperature?: number | null; maxTokens?: number | null; tools?: ToolDefinition[]; toolChoice?: ToolChoice; apiKey: string; fetchImpl?: typeof fetch }`
  - `interface ProviderResult { content: string | null; tool_calls: ToolCall[]; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }; model: string; raw: unknown }`
  - `callProvider(req: ProviderRequest): Promise<ProviderResult>`
  - `providerAvailability(): Record<Provider, boolean>`
  - `class ProviderHttpError extends Error { status: number }`

`fetchImpl` is injectable so the transports are testable without network.

- [ ] **Step 1: Write the failing tests**

Create `supabase/functions/_shared/llm-providers_test.ts`:

```ts
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callProvider, ProviderHttpError } from "./llm-providers.ts";

function stubFetch(status: number, body: unknown, capture?: { url?: string; init?: RequestInit }) {
  return (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (capture) {
      capture.url = String(url);
      capture.init = init;
    }
    return Promise.resolve(
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
    );
  };
}

const MESSAGES = [
  { role: "system" as const, content: "be brief" },
  { role: "user" as const, content: "hello" },
];

Deno.test("openai-compatible providers parse content and usage", async () => {
  const cap: { url?: string; init?: RequestInit } = {};
  const result = await callProvider({
    provider: "openrouter",
    model: "openai/gpt-4o-mini",
    messages: MESSAGES,
    apiKey: "k",
    fetchImpl: stubFetch(200, {
      choices: [{ message: { content: "hi there" } }],
      usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
      model: "openai/gpt-4o-mini",
    }, cap),
  });
  assertEquals(result.content, "hi there");
  assertEquals(result.usage.total_tokens, 5);
  assertEquals(cap.url, "https://openrouter.ai/api/v1/chat/completions");
});

Deno.test("each openai-compatible provider uses its own base url", async () => {
  const seen: string[] = [];
  for (const provider of ["lovable", "openrouter", "openai"] as const) {
    const cap: { url?: string } = {};
    await callProvider({
      provider,
      model: "m",
      messages: MESSAGES,
      apiKey: "k",
      fetchImpl: stubFetch(200, { choices: [{ message: { content: "x" } }] }, cap),
    });
    seen.push(cap.url!);
  }
  assertEquals(seen, [
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    "https://openrouter.ai/api/v1/chat/completions",
    "https://api.openai.com/v1/chat/completions",
  ]);
});

Deno.test("anthropic lifts the system message out of the message list", async () => {
  const cap: { url?: string; init?: RequestInit } = {};
  const result = await callProvider({
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022",
    messages: MESSAGES,
    apiKey: "k",
    fetchImpl: stubFetch(200, {
      content: [{ type: "text", text: "brief answer" }],
      usage: { input_tokens: 4, output_tokens: 1 },
      model: "claude-3-5-haiku-20241022",
    }, cap),
  });
  assertEquals(result.content, "brief answer");
  assertEquals(result.usage.total_tokens, 5);
  const body = JSON.parse(String(cap.init!.body));
  assertEquals(body.system, "be brief");
  assertEquals(body.messages, [{ role: "user", content: "hello" }]);
});

Deno.test("gemini maps roles and reads its own usage shape", async () => {
  const cap: { url?: string; init?: RequestInit } = {};
  const result = await callProvider({
    provider: "gemini",
    model: "gemini-2.0-flash",
    messages: MESSAGES,
    apiKey: "k",
    fetchImpl: stubFetch(200, {
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
      usageMetadata: { promptTokenCount: 6, candidatesTokenCount: 1, totalTokenCount: 7 },
    }, cap),
  });
  assertEquals(result.content, "ok");
  assertEquals(result.usage.total_tokens, 7);
  const body = JSON.parse(String(cap.init!.body));
  assertEquals(body.systemInstruction.parts[0].text, "be brief");
  assertEquals(body.contents[0].role, "user");
});

Deno.test("a non-2xx response throws ProviderHttpError carrying the status", async () => {
  await assertRejects(
    () =>
      callProvider({
        provider: "openai",
        model: "gpt-4o-mini",
        messages: MESSAGES,
        apiKey: "k",
        fetchImpl: stubFetch(429, { error: "slow down" }),
      }),
    ProviderHttpError,
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL, module `./llm-providers.ts` not found.

- [ ] **Step 3: Write the implementation**

Create `supabase/functions/_shared/llm-providers.ts`:

```ts
// Five providers, one result shape.
//
// Lovable, OpenRouter and OpenAI all speak the OpenAI chat-completions dialect
// and differ only in base URL, so they share one implementation. Anthropic and
// Gemini do not: Anthropic wants the system prompt lifted out of the message
// list into its own field, and Gemini wants a different envelope entirely.
// Pretending otherwise is how you ship a provider that silently ignores the
// system prompt.
//
// fetchImpl is injectable so this file is testable without network.

import { PROVIDER_SECRETS, type Provider } from "./llm-registry.ts";
import type { ChatMessageLike } from "./llm-config.ts";

export interface ToolDefinition {
  type: "function";
  function: { name: string; description?: string; parameters: Record<string, unknown> };
}

export type ToolChoice = "auto" | "required" | { type: "function"; function: { name: string } };

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ProviderRequest {
  provider: Provider;
  model: string;
  messages: ChatMessageLike[];
  temperature?: number | null;
  maxTokens?: number | null;
  tools?: ToolDefinition[];
  toolChoice?: ToolChoice;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export interface ProviderResult {
  content: string | null;
  tool_calls: ToolCall[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
  raw: unknown;
}

export class ProviderHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ProviderHttpError";
  }
}

const OPENAI_COMPATIBLE_URLS: Partial<Record<Provider, string>> = {
  lovable: "https://ai.gateway.lovable.dev/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
};

export function providerAvailability(): Record<Provider, boolean> {
  const out = {} as Record<Provider, boolean>;
  for (const [p, env] of Object.entries(PROVIDER_SECRETS) as [Provider, string][]) {
    out[p] = !!Deno.env.get(env);
  }
  return out;
}

async function readOrThrow(response: Response): Promise<unknown> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ProviderHttpError(response.status, text || `Provider error ${response.status}`);
  }
  return await response.json();
}

async function callOpenAICompatible(req: ProviderRequest): Promise<ProviderResult> {
  const doFetch = req.fetchImpl ?? fetch;
  const url = OPENAI_COMPATIBLE_URLS[req.provider]!;

  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
    stream: false,
  };
  if (req.temperature !== undefined && req.temperature !== null) body.temperature = req.temperature;
  if (req.maxTokens !== undefined && req.maxTokens !== null) body.max_tokens = req.maxTokens;
  if (req.tools && req.tools.length > 0) {
    body.tools = req.tools;
    body.tool_choice = req.toolChoice ?? "auto";
  }

  const json = await readOrThrow(
    await doFetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${req.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  ) as {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: ToolCall[] } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    model?: string;
  };

  const message = json.choices?.[0]?.message;
  return {
    content: message?.content ?? null,
    tool_calls: message?.tool_calls ?? [],
    usage: {
      prompt_tokens: Number(json.usage?.prompt_tokens ?? 0),
      completion_tokens: Number(json.usage?.completion_tokens ?? 0),
      total_tokens: Number(json.usage?.total_tokens ?? 0),
    },
    model: json.model || req.model,
    raw: json,
  };
}

async function callAnthropic(req: ProviderRequest): Promise<ProviderResult> {
  const doFetch = req.fetchImpl ?? fetch;

  // Anthropic takes the system prompt as its own field, not as a message.
  const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const rest = req.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model: req.model,
    messages: rest,
    max_tokens: req.maxTokens ?? 4096,
  };
  if (system.length > 0) body.system = system;
  if (req.temperature !== undefined && req.temperature !== null) body.temperature = req.temperature;

  const json = await readOrThrow(
    await doFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": req.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  ) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    model?: string;
  };

  const text = (json.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  const prompt = Number(json.usage?.input_tokens ?? 0);
  const completion = Number(json.usage?.output_tokens ?? 0);
  return {
    content: text.length > 0 ? text : null,
    tool_calls: [],
    usage: { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion },
    model: json.model || req.model,
    raw: json,
  };
}

async function callGemini(req: ProviderRequest): Promise<ProviderResult> {
  const doFetch = req.fetchImpl ?? fetch;

  const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = req.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = { contents };
  if (system.length > 0) body.systemInstruction = { parts: [{ text: system }] };
  const generationConfig: Record<string, unknown> = {};
  if (req.temperature !== undefined && req.temperature !== null) generationConfig.temperature = req.temperature;
  if (req.maxTokens !== undefined && req.maxTokens !== null) generationConfig.maxOutputTokens = req.maxTokens;
  if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent`;
  const json = await readOrThrow(
    await doFetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": req.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  ) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  };

  const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  return {
    content: text.length > 0 ? text : null,
    tool_calls: [],
    usage: {
      prompt_tokens: Number(json.usageMetadata?.promptTokenCount ?? 0),
      completion_tokens: Number(json.usageMetadata?.candidatesTokenCount ?? 0),
      total_tokens: Number(json.usageMetadata?.totalTokenCount ?? 0),
    },
    model: req.model,
    raw: json,
  };
}

export function callProvider(req: ProviderRequest): Promise<ProviderResult> {
  switch (req.provider) {
    case "anthropic":
      return callAnthropic(req);
    case "gemini":
      return callGemini(req);
    case "lovable":
    case "openrouter":
    case "openai":
      return callOpenAICompatible(req);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS, 19 tests total.

- [ ] **Step 5: Run the repo checks**

Run: `npm run check`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/llm-providers.ts supabase/functions/_shared/llm-providers_test.ts
git commit -m "Five providers, one result shape

Lovable, OpenRouter and OpenAI speak the same dialect and share one transport.
Anthropic and Gemini do not, and pretending otherwise is how you ship a
provider that silently drops the system prompt: Anthropic wants it lifted into
its own field, Gemini wants a different envelope. Both are tested for exactly
that. fetch is injectable, so none of this needs network to verify.

Only tool calls on the OpenAI-compatible path for now, which is all any current
call site uses."
```

---

### Task 5: Wire the chokepoint

**Files:**
- Modify: `supabase/functions/_shared/llm.ts`
- Create: `supabase/functions/_shared/llm_test.ts`

**Interfaces:**
- Consumes: everything produced by Tasks 2, 3 and 4
- Produces: `callLovableAI(opts: CallOptions): Promise<CallResult>` with its existing signature intact, plus `CallResult.config_source: ConfigSource` and `CallResult.provider: Provider` added

The fifteen existing callers must keep compiling and behaving identically when no config row overrides them.

- [ ] **Step 1: Write the failing test**

Create `supabase/functions/_shared/llm_test.ts`:

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildProviderRequest } from "./llm.ts";
import type { EffectiveConfig } from "./llm-config.ts";

const CONFIG: EffectiveConfig = {
  provider: "openrouter",
  model: "openai/gpt-4o-mini",
  system_prompt: "configured prompt",
  temperature: 0.2,
  max_tokens: 900,
};

Deno.test("buildProviderRequest swaps the caller's system message for the configured one", () => {
  const req = buildProviderRequest(CONFIG, {
    messages: [
      { role: "system", content: "the code default" },
      { role: "user", content: "hello" },
    ],
    apiKey: "k",
  });
  assertEquals(req.provider, "openrouter");
  assertEquals(req.model, "openai/gpt-4o-mini");
  assertEquals(req.messages, [
    { role: "system", content: "configured prompt" },
    { role: "user", content: "hello" },
  ]);
  assertEquals(req.temperature, 0.2);
  assertEquals(req.maxTokens, 900);
});

Deno.test("buildProviderRequest leaves the caller's messages alone when the config has no prompt", () => {
  const req = buildProviderRequest(
    { ...CONFIG, system_prompt: null },
    { messages: [{ role: "system", content: "the code default" }, { role: "user", content: "hello" }], apiKey: "k" },
  );
  assertEquals(req.messages, [
    { role: "system", content: "the code default" },
    { role: "user", content: "hello" },
  ]);
});

Deno.test("buildProviderRequest interpolates placeholders into the configured prompt", () => {
  const req = buildProviderRequest(
    { ...CONFIG, system_prompt: "Translate into {{targetLanguage}}." },
    { messages: [{ role: "user", content: "x" }], apiKey: "k", templateVars: { targetLanguage: "German" } },
  );
  assertEquals(req.messages[0], { role: "system", content: "Translate into German." });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, `buildProviderRequest` is not exported from `./llm.ts`.

- [ ] **Step 3: Add the imports and the new exported helper to `llm.ts`**

At the top of `supabase/functions/_shared/llm.ts`, after the existing `ensureAllowance` import, add:

```ts
import {
  resolveConfig,
  resolveTier,
  interpolatePrompt,
  applySystemPrompt,
  type EffectiveConfig,
  type ConfigSource,
} from "./llm-config.ts";
import {
  callProvider,
  ProviderHttpError,
  type ProviderRequest,
  type ToolDefinition as ProviderToolDefinition,
  type ToolChoice,
} from "./llm-providers.ts";
import { PROVIDER_SECRETS, type Provider } from "./llm-registry.ts";
```

Then add this exported function near the bottom of the file, above `callLovableAI`:

```ts
/**
 * Turn a resolved config plus a caller's messages into a provider request.
 * Exported and pure so the system-message swap is testable without network.
 */
export function buildProviderRequest(
  config: EffectiveConfig,
  opts: {
    messages: ChatMessage[];
    apiKey: string;
    tools?: ToolDefinition[];
    tool_choice?: ToolChoice;
    templateVars?: Record<string, string | number | null | undefined>;
  },
): ProviderRequest {
  const prompt = interpolatePrompt(config.system_prompt, opts.templateVars);
  return {
    provider: config.provider,
    model: config.model,
    messages: applySystemPrompt(opts.messages, prompt),
    temperature: config.temperature,
    maxTokens: config.max_tokens,
    tools: opts.tools as ProviderToolDefinition[] | undefined,
    toolChoice: opts.tool_choice,
    apiKey: opts.apiKey,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:unit`
Expected: PASS, 22 tests total.

- [ ] **Step 5: Rewrite the body of `callLovableAI` to use it**

In `supabase/functions/_shared/llm.ts`, add two optional fields to `CallOptions`:

```ts
  /** Values for {{placeholder}} substitution in a configured system prompt. */
  templateVars?: Record<string, string | number | null | undefined>;
```

Add two fields to `CallResult`:

```ts
  provider: Provider;
  config_source: ConfigSource;
```

Replace the body of `callLovableAI` (everything from `const apiKey = Deno.env.get("LOVABLE_API_KEY");` down to the final `return {...}`) with:

```ts
  const sb = getServiceClient();

  const tier = await resolveTier(sb, opts.user_id ?? null);
  const { effective, source } = await resolveConfig(sb, opts.feature, tier, {
    provider: "lovable",
    model: opts.model || DEFAULT_MODEL,
    temperature: opts.temperature ?? null,
  });

  const secretName = PROVIDER_SECRETS[effective.provider];
  const apiKey = Deno.env.get(secretName);
  if (!apiKey) {
    throw new Error(
      `${secretName} is not configured, which call site "${opts.feature}" needs for provider "${effective.provider}"`,
    );
  }

  const request = buildProviderRequest(effective, {
    messages: opts.messages,
    apiKey,
    tools: opts.tools,
    tool_choice: opts.tool_choice,
    templateVars: opts.templateVars,
  });

  let result;
  try {
    result = await callProvider(request);
  } catch (e) {
    if (e instanceof ProviderHttpError) {
      if (e.status === 429) throw new RateLimitedError(e.message);
      if (e.status === 402) throw new CreditsExhaustedError(e.message);
      throw new GatewayError(e.status, e.message);
    }
    throw e;
  }

  // Best-effort token logging. Never block the response on accounting errors.
  try {
    const { error } = await sb.rpc("record_llm_usage", {
      p_user_id: opts.user_id,
      p_idempotency_key: opts.idempotency_key ?? crypto.randomUUID(),
      p_feature: opts.feature,
      p_provider: effective.provider,
      p_model: result.model,
      p_prompt_tokens: result.usage.prompt_tokens,
      p_completion_tokens: result.usage.completion_tokens,
      p_total_tokens: result.usage.total_tokens,
      p_metadata: { ...(opts.metadata ?? {}), config_source: source },
    });
    if (error) console.error("[llm.callLovableAI] record_llm_usage error:", error);
  } catch (e) {
    console.error("[llm.callLovableAI] usage logging threw:", e);
  }

  return {
    content: result.content,
    tool_calls: result.tool_calls,
    usage: result.usage,
    model: result.model,
    provider: effective.provider,
    config_source: source,
    raw: result.raw,
  };
```

Delete the now-unused `GATEWAY_URL` constant.

- [ ] **Step 6: Run everything**

Run: `npm run test:unit && npm run check`
Expected: both exit 0. If `deno-check` reports a new error in a function, fix it rather than updating the baseline.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/llm.ts supabase/functions/_shared/llm_test.ts
git commit -m "The chokepoint resolves a config before it calls anything

callLovableAI keeps its name and its signature, so all fifteen callers that
already pass a feature string are now configurable without one line changing in
any of them. Inside, it resolves the tier, resolves the config, swaps the
system message if a row overrides it, and dispatches to whichever provider the
row names.

The usage ledger now records the provider actually used instead of the literal
string 'lovable-ai', and carries config_source so it says which tier's row
served the call."
```

---

### Task 6: Rewire canvas-ai

**Files:**
- Modify: `supabase/functions/canvas-ai/index.ts:82-108`

**Interfaces:**
- Consumes: `callLovableAI`, `CreditsExhaustedError`, `RateLimitedError`, `GatewayError` from `_shared/llm.ts`
- Produces: nothing new

This is the one user-visible behaviour change: canvas calls start deducting tokens. Approved 2026-08-23.

- [ ] **Step 1: Replace the hand-rolled gateway call**

In `supabase/functions/canvas-ai/index.ts`, change the import on line 3 to:

```ts
import {
  getCallerUserId,
  assertCredits,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  callLovableAI,
} from "../_shared/llm.ts";
```

Delete the `LOVABLE_API_KEY` lookup block and replace the `fetch(...)` call and its error handling (from `const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");` through `const rawContent = completion.choices?.[0]?.message?.content || "";`) with:

```ts
    const systemPrompt = buildSystemPrompt(mode || "chat_only", artifactType || "prompt", canvasContent);

    let userMessage = message;
    if (selection?.text) {
      userMessage += `\n\n[Selected text (lines ${selection.start}-${selection.end})]: "${selection.text}"`;
    }

    let rawContent = "";
    try {
      // Through the shared helper now, so canvas usage is recorded and
      // deducted like every other AI call instead of being free after the gate.
      const result = await callLovableAI({
        user_id,
        feature: "canvas-ai",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        templateVars: {
          mode: mode || "chat_only",
          artifactType: artifactType || "prompt",
          canvasContent: canvasContent ?? "",
        },
      });
      rawContent = result.content || "";
    } catch (e) {
      if (e instanceof RateLimitedError) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (e instanceof CreditsExhaustedError) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (e instanceof GatewayError) {
        console.error("[canvas-ai] Gateway error:", e.status, e.message);
        throw new Error(`AI gateway returned ${e.status}`);
      }
      throw e;
    }
```

- [ ] **Step 2: Confirm no direct gateway fetch remains**

Run: `grep -n "ai.gateway.lovable.dev" supabase/functions/canvas-ai/index.ts`
Expected: no output.

- [ ] **Step 3: Run the checks**

Run: `npm run test:unit && npm run check`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/canvas-ai/index.ts
git commit -m "Canvas calls go through the shared helper, and start being paid for

canvas-ai checked the balance and then never deducted anything, so canvas usage
was free once you were past the gate. Routing it through callLovableAI makes it
record and deduct like the other sixteen call sites, and makes its model and
system prompt configurable at the same time.

This is a real change for anyone who leans on the canvas: their credits now
fall when they use it."
```

---

### Task 7: Rewire ai-moderate-content

**Files:**
- Modify: `supabase/functions/ai-moderate-content/index.ts:43-95`

**Interfaces:**
- Consumes: `resolveConfig`, `interpolatePrompt`, `applySystemPrompt` from `_shared/llm-config.ts`; `callProvider` from `_shared/llm-providers.ts`; `PROVIDER_SECRETS` from `_shared/llm-registry.ts`
- Produces: nothing new

This one deliberately does **not** get the credit gate. It is cron- or admin-triggered, it is a platform cost, and gating it on a user's balance would stop moderation whenever that user ran dry.

- [ ] **Step 1: Add the imports**

At the top of `supabase/functions/ai-moderate-content/index.ts`, after the existing `requireMachineOrAdmin` import, add:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveConfig } from "../_shared/llm-config.ts";
import { callProvider } from "../_shared/llm-providers.ts";
import { PROVIDER_SECRETS } from "../_shared/llm-registry.ts";
```

If `createClient` is already imported in this file, do not add it twice.

- [ ] **Step 2: Replace the body of `classifyContent`**

Replace everything in `classifyContent` from `const response = await fetch(AI_GATEWAY_URL, {` down to and including the `if (!response.ok) { ... }` block and the `const data = await response.json();` line with:

```ts
  // Deliberately no credit gate. This runs from cron or an admin button, the
  // cost is the platform's, and gating it on some user's balance would mean
  // moderation stops the moment that user runs dry.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { effective } = await resolveConfig(admin, "ai-moderate-content", "default", {
    provider: "lovable",
    model: "google/gemini-3-flash-preview",
    systemPrompt,
  });

  const secretName = PROVIDER_SECRETS[effective.provider];
  const apiKey = Deno.env.get(secretName);
  if (!apiKey) {
    throw new Error(`${secretName} is not configured, which ai-moderate-content needs`);
  }

  const result = await callProvider({
    provider: effective.provider,
    model: effective.model,
    apiKey,
    temperature: effective.temperature,
    maxTokens: effective.max_tokens,
    messages: [
      { role: "system", content: effective.system_prompt ?? systemPrompt },
      { role: "user", content: `Analyze this content for policy violations:\n\n${content.substring(0, 4000)}` },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "classify_content",
          description: "Return the content moderation classification result.",
          parameters: {
            type: "object",
            properties: {
              safe: { type: "boolean", description: "true if content is safe, false if it violates policies" },
              category: { type: "string", enum: ["none", "sexual", "hate", "malware", "pii", "injection"], description: "The violation category, or 'none' if safe" },
              confidence: { type: "number", description: "Confidence score from 0.0 to 1.0" },
              reason: { type: "string", description: "Brief explanation of the classification decision" },
            },
            required: ["safe", "category", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
    ],
    toolChoice: { type: "function", function: { name: "classify_content" } },
  });

  const data = { choices: [{ message: { tool_calls: result.tool_calls } }] };
```

The `const data = ...` line keeps the rest of the function (which reads `data.choices?.[0]?.message?.tool_calls?.[0]`) working unchanged.

- [ ] **Step 3: Delete the now-unused constant**

Remove the `AI_GATEWAY_URL` constant if nothing else in the file references it.

Run: `grep -n "AI_GATEWAY_URL" supabase/functions/ai-moderate-content/index.ts`
Expected: no output after the deletion.

- [ ] **Step 4: Run the checks**

Run: `npm run test:unit && npm run check`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/ai-moderate-content/index.ts
git commit -m "Moderation's model and prompt become configurable, its accounting does not

It resolves its config and calls the provider directly rather than going
through callLovableAI, because callLovableAI gates on a user's credit balance
and moderation must not stop the moment some user runs dry. It runs from cron
or an admin button and the cost is the platform's.

Its requireMachineOrAdmin guard is untouched."
```

---

### Task 8: The admin edge function

**Files:**
- Create: `supabase/functions/admin-llm-config/index.ts`

**Interfaces:**
- Consumes: `CALL_SITES`, `getCallSiteMeta`, `PROVIDER_PRESETS`, `PROVIDER_SECRETS` from `_shared/llm-registry.ts`; `providerAvailability`, `callProvider` from `_shared/llm-providers.ts`; `resolveConfig`, `interpolatePrompt`, `__clearConfigCache` from `_shared/llm-config.ts`; `isAdminCaller`, `unauthorized` from `_shared/internalAuth.ts`
- Produces: HTTP actions `list`, `sync_defaults`, `test`

- [ ] **Step 1: Write the function**

Create `supabase/functions/admin-llm-config/index.ts`:

```ts
// Read, seed and test-run the LLM call configuration. Admin only.
//
// The identity comes from the JWT via isAdminCaller, never from the body. That
// is the repo's non-negotiable rule and the reason this file does not accept a
// user_id at all.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { isAdminCaller } from "../_shared/internalAuth.ts";
import {
  CALL_SITES,
  getCallSiteMeta,
  PROVIDER_PRESETS,
  PROVIDER_SECRETS,
} from "../_shared/llm-registry.ts";
import { callProvider, providerAvailability } from "../_shared/llm-providers.ts";
import { resolveConfig, interpolatePrompt, __clearConfigCache } from "../_shared/llm-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Insert any call site the registry knows about and the table does not, and
 * backfill an empty description. Never overwrites an administrator's edit.
 *
 * `force` overwrites every column from the registry. Destructive, and only used
 * deliberately.
 */
async function syncDefaults(admin: SupabaseClient, force: boolean): Promise<void> {
  const rows = CALL_SITES.map((c) => ({
    call_site: c.call_site,
    tier: "default",
    description: c.description,
    provider: c.provider,
    model: c.model,
    system_prompt: null,
    enabled: true,
  }));

  if (force) {
    const { error } = await admin
      .from("llm_call_configs")
      .upsert(rows, { onConflict: "call_site,tier" });
    if (error) throw error;
    return;
  }

  const { data: existing, error: readErr } = await admin
    .from("llm_call_configs")
    .select("call_site, description")
    .eq("tier", "default");
  if (readErr) throw readErr;

  const seen = new Map<string, string | null>(
    (existing ?? []).map((r: { call_site: string; description: string | null }) => [r.call_site, r.description]),
  );

  const toInsert = rows.filter((r) => !seen.has(r.call_site));
  if (toInsert.length > 0) {
    const { error } = await admin.from("llm_call_configs").insert(toInsert);
    if (error) throw error;
  }

  for (const c of CALL_SITES) {
    if (!seen.has(c.call_site)) continue;
    const description = seen.get(c.call_site);
    if (description && description.trim().length > 0) continue;
    const { error } = await admin
      .from("llm_call_configs")
      .update({ description: c.description })
      .eq("call_site", c.call_site)
      .eq("tier", "default");
    if (error) throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await isAdminCaller(req))) {
      return json({ error: "Forbidden — admin only" }, 403);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({})) as {
      action?: string;
      call_site?: string;
      tier?: string;
      prompt?: string;
      force?: boolean;
    };
    const tier = body.tier === "free" || body.tier === "premium" ? body.tier : "default";

    if (body.action === "list") {
      await syncDefaults(admin, false);
      __clearConfigCache();

      const { data, error } = await admin
        .from("llm_call_configs")
        .select("*")
        .eq("tier", tier)
        .order("call_site");
      if (error) throw error;

      const configs = (data ?? []).map((row: { call_site: string }) => {
        const meta = getCallSiteMeta(row.call_site);
        return { ...row, placeholders: meta?.placeholders ?? [] };
      });

      return json({ configs, availability: providerAvailability(), providers: PROVIDER_PRESETS });
    }

    if (body.action === "sync_defaults") {
      await syncDefaults(admin, body.force === true);
      __clearConfigCache();
      return json({ ok: true, force: body.force === true, synced: CALL_SITES.map((c) => c.call_site) });
    }

    if (body.action === "test") {
      const callSite = String(body.call_site ?? "");
      if (!callSite) return json({ error: "call_site required" }, 400);

      const meta = getCallSiteMeta(callSite);
      const userPrompt = String(
        body.prompt || "Say 'Hello' and tell me which model and provider you are using.",
      );

      // The panel saves before it tests, so this reads the persisted row.
      __clearConfigCache();
      const { effective, source } = await resolveConfig(admin, callSite, tier, {
        provider: "lovable",
        model: "google/gemini-3-flash-preview",
      });

      const secretName = PROVIDER_SECRETS[effective.provider];
      const apiKey = Deno.env.get(secretName);
      if (!apiKey) {
        return json({ ok: false, error: `${secretName} is not configured` });
      }

      const templateVars: Record<string, string> = {};
      for (const ph of meta?.placeholders ?? []) {
        templateVars[ph] = `[test value for {{${ph}}}]`;
      }
      const systemPrompt = interpolatePrompt(effective.system_prompt, templateVars);

      const startedAt = Date.now();
      try {
        const result = await callProvider({
          provider: effective.provider,
          model: effective.model,
          apiKey,
          temperature: effective.temperature,
          maxTokens: effective.max_tokens,
          messages: systemPrompt
            ? [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
            : [{ role: "user", content: userPrompt }],
        });
        return json({
          ok: true,
          provider: effective.provider,
          model: result.model,
          content: result.content,
          config_source: source,
          latency_ms: Date.now() - startedAt,
          usage: result.usage,
        });
      } catch (err) {
        return json({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          latency_ms: Date.now() - startedAt,
        });
      }
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("admin-llm-config error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
```

- [ ] **Step 2: Confirm no identity is read from the body**

Run: `grep -n "body.user_id\|body\[.user_id.\]" supabase/functions/admin-llm-config/index.ts`
Expected: no output. This is the repo's non-negotiable rule.

- [ ] **Step 3: Run the checks**

Run: `npm run check`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/admin-llm-config/index.ts
git commit -m "An admin-only endpoint to read, seed and test-run the configuration

Identity comes from the JWT through isAdminCaller and the body carries no
user_id at all, which is this repo's non-negotiable rule rather than a style
choice.

list returns the provider presets alongside the rows, so the React panel holds
no model list of its own. That is what makes swapping the presets for a live
catalogue or a shared cross-app registry a change to one server file later."
```

---

### Task 9: The admin page becomes tabs

**Files:**
- Create: `src/components/admin/UsersPanel.tsx`
- Modify: `src/pages/Admin.tsx`

**Interfaces:**
- Consumes: existing `AICreditSettings`, `ModerationPanel`, `EmbeddingsBackfillPanel`, `UserTokenBalance`, `UserTokenModal`
- Produces: `<UsersPanel />`, a default-exported `Admin` page rendering five tabs

Behaviour of the users table must not change. This is a move, not a rewrite.

- [ ] **Step 1: Create UsersPanel by moving, not rewriting**

Create `src/components/admin/UsersPanel.tsx` containing everything currently in `src/pages/Admin.tsx` that serves the users table: the `AllowancePeriod` and `UserWithRole` interfaces, the `users`, `loading`, `searchQuery`, `savingUserId`, `deletingUserId`, `editedUsers`, `allowances` and `tokenModalUser` state, the `initializeAndFetchAllowances`, `fetchUsers`, `fetchAllowances`, `handleAllowanceUpdate`, `handleRoleChange`, `handleSaveUser`, `handleDeleteUser`, `filteredUsers` and `getInitials` functions, and the `<Card>` block that renders the table plus the `<UserTokenModal>`.

Export it as `export function UsersPanel()`. Move the imports it needs (`supabase`, `Card*`, `Button`, `Input`, `Select*`, `Table*`, `Skeleton`, `Avatar*`, the alert-dialog imports, `toast`, `Search`, `Save`, `Users`, `Trash2`, `Coins`, `format`, `UserTokenBalance`, `UserTokenModal`, `AppRole`) with it, and delete them from `Admin.tsx` if nothing there still uses them.

Do not change any logic, any query, any toast string or any handler while moving.

- [ ] **Step 2: Rewrite Admin.tsx as the tab shell**

Replace `src/pages/Admin.tsx` with:

```tsx
import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Users, Sparkles, Database, Cpu } from "lucide-react";
import { AICreditSettings } from "@/components/admin/AICreditSettings";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { EmbeddingsBackfillPanel } from "@/components/admin/EmbeddingsBackfillPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";

const LLMConfigPanel = lazy(() => import("@/components/admin/LLMConfigPanel"));

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Access control. Unchanged: it still runs before any tab renders.
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user || !isAdmin) {
        toast.error("You don't have permission to view the admin panel.");
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, credits, moderation and AI configuration</p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger>
            <TabsTrigger value="credits" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Credits</TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Moderation</TabsTrigger>
            <TabsTrigger value="embeddings" className="gap-1.5"><Database className="h-3.5 w-3.5" /> Embeddings</TabsTrigger>
            <TabsTrigger value="llm" className="gap-1.5"><Cpu className="h-3.5 w-3.5" /> LLM Config</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6"><UsersPanel /></TabsContent>
          <TabsContent value="credits" className="mt-6"><AICreditSettings /></TabsContent>
          <TabsContent value="moderation" className="mt-6"><ModerationPanel /></TabsContent>
          <TabsContent value="embeddings" className="mt-6"><EmbeddingsBackfillPanel /></TabsContent>
          <TabsContent value="llm" className="mt-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <LLMConfigPanel />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
```

This references `LLMConfigPanel`, which Task 10 creates. Do not run the build until then.

- [ ] **Step 3: Commit (build not yet green, stated in the message)**

```bash
git add src/pages/Admin.tsx src/components/admin/UsersPanel.tsx
git commit -m "The admin page becomes five tabs, and the users table becomes a panel

Admin.tsx was 529 lines and most of it was one table. Adding a sixth stacked
card would have made a long page longer, so it becomes a tab shell and the
users table moves out unchanged: same queries, same handlers, same toasts.

The LLM Config tab points at a panel that arrives in the next commit, so the
build is red between the two."
```

---

### Task 10: The config panel

**Files:**
- Create: `src/components/admin/LLMConfigPanel.tsx`

**Interfaces:**
- Consumes: the `admin-llm-config` function's `list` and `test` actions
- Produces: a default-exported `LLMConfigPanel`

- [ ] **Step 1: Write the panel**

Create `src/components/admin/LLMConfigPanel.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Play, RotateCcw, Save } from "lucide-react";

type Provider = "lovable" | "openrouter" | "openai" | "anthropic" | "gemini";

interface ProviderPreset {
  provider: Provider;
  label: string;
  models: { value: string; label: string }[];
}

interface Config {
  call_site: string;
  tier: string;
  description: string | null;
  provider: Provider;
  model: string;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
  enabled: boolean;
  updated_at: string;
  placeholders: string[];
}

interface TestResult {
  ok: boolean;
  error?: string;
  provider?: string;
  model?: string;
  content?: string | null;
  config_source?: string;
  latency_ms?: number;
  usage?: { total_tokens: number };
}

export default function LLMConfigPanel() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Config | null>(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-llm-config", {
        body: { action: "list" },
      });
      if (error) throw error;
      setConfigs(data.configs ?? []);
      setPresets(data.providers ?? []);
      setAvailability(data.availability ?? {});
    } catch (e) {
      toast.error("Failed to load LLM configs", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => configs.filter((c) => c.call_site.toLowerCase().includes(filter.toLowerCase())),
    [configs, filter],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Call Configuration</CardTitle>
        <CardDescription>
          Provider, model and system prompt for each AI call site. An inactive entry, or an empty
          system prompt, falls back to the default in the code. Runtime context is substituted into{" "}
          <code>{`{{placeholder}}`}</code> before the prompt is sent.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          {presets.map((p) => (
            <Badge key={p.provider} variant={availability[p.provider] ? "default" : "outline"} className="text-xs">
              {p.label}
              {availability[p.provider] ? "" : " (no key)"}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Filter by call site…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call site</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>System prompt</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={`${c.call_site}:${c.tier}`}>
                    <TableCell className="font-mono text-xs">{c.call_site}</TableCell>
                    <TableCell>
                      <Badge variant={availability[c.provider] ? "secondary" : "destructive"} className="text-[10px]">
                        {presets.find((p) => p.provider === c.provider)?.label ?? c.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.model}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.system_prompt ? "Custom" : <span className="italic">Code default</span>}
                    </TableCell>
                    <TableCell>{c.enabled ? "✓" : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {editing && (
          <EditDialog
            config={editing}
            presets={presets}
            availability={availability}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await load();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EditDialog({
  config,
  presets,
  availability,
  onClose,
  onSaved,
}: {
  config: Config;
  presets: ProviderPreset[];
  availability: Record<string, boolean>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Config>({ ...config });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPrompt, setTestPrompt] = useState(
    "Say 'Hello' and tell me which model and provider you are using.",
  );
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const models = presets.find((p) => p.provider === draft.provider)?.models ?? [];
  const isCustomModel = !models.some((m) => m.value === draft.model);

  const save = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("llm_call_configs")
        .update({
          provider: draft.provider,
          model: draft.model.trim(),
          system_prompt: draft.system_prompt?.trim() ? draft.system_prompt : null,
          temperature: draft.temperature,
          max_tokens: draft.max_tokens,
          enabled: draft.enabled,
        })
        .eq("call_site", draft.call_site)
        .eq("tier", draft.tier);
      if (error) throw error;
      toast.success("Saved");
      return true;
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Save first, so the test exercises what is actually persisted.
      if (!(await save())) return;
      const { data, error } = await supabase.functions.invoke("admin-llm-config", {
        body: { action: "test", call_site: draft.call_site, tier: draft.tier, prompt: testPrompt },
      });
      if (error) throw error;
      setTestResult(data as TestResult);
    } catch (e) {
      setTestResult({ ok: false, error: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{draft.call_site}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provider</Label>
              <Select
                value={draft.provider}
                onValueChange={(v) => {
                  const next = v as Provider;
                  const firstModel = presets.find((p) => p.provider === next)?.models[0]?.value;
                  setDraft({ ...draft, provider: next, model: firstModel ?? draft.model });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.provider} value={p.provider} disabled={!availability[p.provider]}>
                      {p.label}
                      {!availability[p.provider] && " — no API key"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Select
                value={isCustomModel ? "__custom__" : draft.model}
                onValueChange={(v) => {
                  if (v === "__custom__") return;
                  setDraft({ ...draft, model: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom…</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="mt-2 font-mono text-xs"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="e.g. openai/gpt-4o-mini"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>System prompt</Label>
              {draft.system_prompt && (
                <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, system_prompt: null })}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset to code default
                </Button>
              )}
            </div>
            <Textarea
              rows={10}
              value={draft.system_prompt ?? ""}
              onChange={(e) => setDraft({ ...draft, system_prompt: e.target.value })}
              placeholder="Leave empty to use the default in the code."
              className="font-mono text-xs"
            />
            {draft.placeholders.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Available placeholders:{" "}
                {draft.placeholders.map((p) => (
                  <code key={p} className="mx-0.5">{`{{${p}}}`}</code>
                ))}{" "}
                substituted with runtime context before sending.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={draft.temperature ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, temperature: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="auto"
              />
            </div>
            <div>
              <Label>Max tokens</Label>
              <Input
                type="number"
                min="1"
                value={draft.max_tokens ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, max_tokens: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="auto"
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch checked={draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} />
              <Label>Active</Label>
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3 bg-muted/30">
            <Label className="text-xs">Test run</Label>
            <Textarea rows={2} value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} className="text-xs" />
            <Button size="sm" onClick={runTest} disabled={testing || saving}>
              {testing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
              Save &amp; test
            </Button>
            {testResult && (
              <div className="text-xs mt-2 space-y-1">
                {testResult.ok ? (
                  <>
                    <div className="text-muted-foreground">
                      {testResult.provider} / <code>{testResult.model}</code> · {testResult.latency_ms}ms · config:{" "}
                      {testResult.config_source}
                      {testResult.usage && ` · ${testResult.usage.total_tokens} tokens`}
                    </div>
                    <pre className="whitespace-pre-wrap rounded bg-background p-2 border max-h-48 overflow-auto">
                      {testResult.content}
                    </pre>
                  </>
                ) : (
                  <div className="text-destructive">Error: {testResult.error}</div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (await save()) onSaved();
            }}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Declare the table in the Supabase types**

`src/integrations/supabase/types.ts` is checked in, so the new table has to be added by hand or the `.from("llm_call_configs")` call in this panel resolves to `never`. Insert this entry into the `Tables` object, in alphabetical order immediately before the existing `llm_usage_events` entry (around line 713):

```ts
      llm_call_configs: {
        Row: {
          call_site: string
          created_at: string
          description: string | null
          enabled: boolean
          extra_options: Json
          max_tokens: number | null
          model: string
          provider: string
          system_prompt: string | null
          temperature: number | null
          tier: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          call_site: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          extra_options?: Json
          max_tokens?: number | null
          model: string
          provider?: string
          system_prompt?: string | null
          temperature?: number | null
          tier?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          call_site?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          extra_options?: Json
          max_tokens?: number | null
          model?: string
          provider?: string
          system_prompt?: string | null
          temperature?: number | null
          tier?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
```

Match the surrounding entries' exact indentation and their use or omission of trailing commas. If `llm_usage_events` carries a `Relationships` key, keep the one above; if the file's entries omit it, drop it.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Run the full check**

Run: `npm run check`
Expected: exits 0. The lint ratchet must not increase.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/LLMConfigPanel.tsx
git commit -m "The panel that edits the configuration

Provider and model come from the server's preset list rather than a constant in
this file, so a shared model registry later changes one server file and not
this one. The free-text model field next to the dropdown is what makes a model
released this morning usable this morning.

No tier control. The column exists and the resolver honours it, but whether
per-tier models are a good idea has not been decided, and a control for an
undecided feature is worse than no control."
```

---

### Task 11: The live security tests

**Files:**
- Create: `tests/security/18-llm-config-is-admin-only.spec.ts`
- Create: `tests/security/19-a-call-site-uses-its-configured-model.spec.ts`

**Interfaces:**
- Consumes: `callFunction`, `asUser`, `asAnonKey`, `signInTestUser`, `restAsUser`, `restAsService` from `tests/security/helpers/api`

**These tests run against the live Supabase project.** They cannot pass until Task 1's migration and the new functions are deployed. Step 4 states that explicitly.

- [ ] **Step 1: Write the admin-only test**

Create `tests/security/18-llm-config-is-admin-only.spec.ts`:

```ts
// A system prompt is not something to hand out with the anon key, and the model
// dropdown is a spending control: whoever can write this table can point every
// AI call in the app at a model they choose, on the platform's bill.
//
// So the table is admin-only in both directions, and the function that fronts it
// refuses anyone else before it reads a single row.

import { test, expect } from "@playwright/test";
import { asAnonKey, asUser, callFunction, restAsUser, restAsService, signInTestUser } from "./helpers/api";
import { ANON_KEY, REST_URL } from "./helpers/env";

interface ConfigRow {
  call_site: string;
  model: string;
}

test.describe("LLM configuration is admin-only", () => {
  test("a stranger holding the anon key gets nothing", async () => {
    const res = await fetch(`${REST_URL}/llm_call_configs?select=call_site,model`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    const body = await res.json();
    const rows = Array.isArray(body) ? (body as ConfigRow[]) : [];

    expect(
      rows.length,
      "the anon key, which ships in every visitor's browser bundle, is reading the system " +
        "prompts and the model routing. The table has lost its RLS policies.",
    ).toBe(0);
  });

  test("a signed-in non-admin gets nothing either", async () => {
    const res = await restAsUser<ConfigRow[]>("llm_call_configs?select=call_site,model");
    const rows = Array.isArray(res.data) ? res.data : [];
    expect(rows.length, "an ordinary account can read the LLM configuration").toBe(0);
  });

  test("a signed-in non-admin cannot repoint a call site at a model of its choosing", async () => {
    const path = "llm_call_configs?call_site=eq.prompt-coach&tier=eq.default&select=call_site,model";
    const before = await restAsService<ConfigRow[]>(path);

    await restAsUser("llm_call_configs?call_site=eq.prompt-coach&tier=eq.default", {
      method: "PATCH",
      body: { model: "attacker/expensive-model" },
    });

    // The status code is not the assertion. Whether the row moved is.
    const after = await restAsService<ConfigRow[]>(path);
    expect(
      after.data[0].model,
      "a non-admin changed which model an AI call uses, on the platform's bill",
    ).toBe(before.data[0].model);
  });

  test("admin-llm-config refuses a non-admin", async () => {
    const session = await signInTestUser();
    const res = await callFunction("admin-llm-config", { action: "list" }, asUser(session.accessToken));
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).toMatch(/admin/i);
  });

  test("admin-llm-config refuses the anon key outright", async () => {
    const res = await callFunction("admin-llm-config", { action: "list" }, asAnonKey);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
```

`restAsUser(path, opts)` and `restAsService(path, opts)` each take two arguments and resolve to `RestResponse<T>`, so rows are on `.data`. `restAsUser` signs in as the test user itself; it does not take a token. The anon-key case has no helper, which is why the first test uses raw `fetch` with `ANON_KEY` and `REST_URL`, matching `15-the-allowance-view-is-not-a-user-list.spec.ts`.

- [ ] **Step 2: Write the configured-model test**

Create `tests/security/19-a-call-site-uses-its-configured-model.spec.ts`:

```ts
// The point of the whole feature: a row in llm_call_configs actually decides
// which model runs. A config table that the runtime quietly ignores is worse
// than no config table, because the admin page then lies.
//
// This writes a row with the service role, invokes the call site, and reads the
// usage ledger back to see which model was really used.

import { test, expect } from "@playwright/test";
import { asUser, callFunction, restAsService, signInTestUser, sqlQuery } from "./helpers/api";

const CALL_SITE = "suggest-metadata";
const CODE_DEFAULT = "google/gemini-3-flash-preview";
const OVERRIDE_MODEL = "google/gemini-2.5-flash-lite";
const ROW = `llm_call_configs?call_site=eq.${CALL_SITE}&tier=eq.default`;

// llm-config.ts caches a call site's rows for 30 seconds per isolate, and there
// is no way to flush another function's isolate from here, so the test has to
// outwait the cache. That is longer than the suite's 30s default.
const CACHE_TTL_MS = 30_000;

test.describe("a call site uses its configured model", () => {
  test.afterAll(async () => {
    // Put it back, so the suite leaves the project as it found it.
    await restAsService(ROW, { method: "PATCH", body: { model: CODE_DEFAULT, enabled: true } });
  });

  test("the ledger records the configured model, not the code default", async () => {
    test.setTimeout(CACHE_TTL_MS + 90_000);

    await restAsService(ROW, { method: "PATCH", body: { model: OVERRIDE_MODEL, enabled: true } });
    await new Promise((r) => setTimeout(r, CACHE_TTL_MS + 2_000));

    const session = await signInTestUser();
    const res = await callFunction(
      "suggest-metadata",
      { prompt_content: "Write a haiku about a cat sitting on a warm windowsill." },
      asUser(session.accessToken),
    );
    expect(res.status, `suggest-metadata failed: ${JSON.stringify(res.body)}`).toBe(200);

    const rows = await sqlQuery<{ model: string; provider: string; metadata: Record<string, unknown> }>(
      `SELECT model, provider, metadata FROM llm_usage_events
       WHERE feature = '${CALL_SITE}'
       ORDER BY created_at DESC LIMIT 1`,
    );

    expect(
      rows[0].model,
      "the config row named a model and the runtime used a different one, so the admin page lies",
    ).toBe(OVERRIDE_MODEL);
    expect(rows[0].provider).toBe("lovable");
    expect(rows[0].metadata.config_source).toBe("db-default");
  });
});
```

Two things this test costs, both deliberate: it spends a small number of real AI credits on the test account, the way `06-no-credits-means-402.spec.ts` already does, and it takes about 40 seconds because of the cache. `sqlQuery` needs a management token, so this spec is skipped on machines without one; check how the existing specs guard that with `hasManagementToken()` and follow the same pattern.

- [ ] **Step 3: Push and deploy**

```bash
git add tests/security/
git commit -m "Two live tests: the table is admin-only, and the row actually decides

A config table the runtime quietly ignores is worse than no config table,
because the admin page then lies. Test 19 writes a row, runs the call site, and
reads the ledger back to see which model really ran.

Test 18 is the spending control: whoever can write this table can point every
AI call in the app at a model of their choosing, on the platform's bill."
git push origin main
```

Then ask the Lovable agent to apply the migration and deploy `admin-llm-config`, `canvas-ai`, `ai-moderate-content` and the shared functions.

- [ ] **Step 4: Run the live suite**

Run: `npm test`
Expected: all specs pass, including 18 and 19. If 19 fails on the model assertion, the resolver is not being consulted; check that the migration applied and that `llm.ts` was deployed, not just committed.

- [ ] **Step 5: Verify in the browser**

Open the admin page, go to the LLM Config tab, confirm 17 rows load, edit one call site's model, press "Save & test", and confirm the response names the model you just chose.

---

## Self-review

**Spec coverage.** Section 1 (table, RLS, trigger, seed, ledger metadata): Task 1 and Task 5 step 5. Section 2 (three-file split, resolution, tier chain): Tasks 3, 4, 5. Section 3 (17 call sites, placeholders): Tasks 1, 2. Section 4 (admin function, three actions, `providers` in the response): Task 8. Section 5 (tabs, UsersPanel extraction, panel, no tier selector): Tasks 9, 10. Section 6 (canvas-ai deducts, moderation keeps no credit gate, ai-insights four rows): Tasks 6, 7, and the seed in Task 1. Section 7 (deno unit tests, two Playwright specs): Tasks 3, 4, 5, 11. Section 8 (five providers, prompts stay put, embeddings excluded, presets served): Tasks 2, 4, and the absence of any embeddings call site in Task 1's seed. Section 9 (follow-ups): deliberately unimplemented.

**Type consistency.** `Provider` and `Tier` are declared once in `llm-registry.ts` and imported everywhere else. `ConfigRow`, `EffectiveConfig`, `CallDefaults` and `ConfigSource` are declared once in `llm-config.ts`. `ProviderRequest` and `ProviderResult` are declared once in `llm-providers.ts`. `ChatMessageLike` is declared in `llm-config.ts` and used by `llm-providers.ts`; `llm.ts` keeps its own `ChatMessage`, which is structurally identical, so `buildProviderRequest` accepts it. `pickConfig` returns `db-${tier}`, which matches the `ConfigSource` union for the two non-default tiers and `db-default` for the third.

**Three things checked rather than assumed.**

1. `restAsUser` and `restAsService` take `(path, opts)` and return `RestResponse<T>` with rows on `.data`. `restAsUser` signs in as the test user itself and accepts no token, so the anon-key case uses raw `fetch` with `ANON_KEY`, matching spec 15. Task 11's tests are written to those signatures.
2. `src/integrations/supabase/types.ts` is checked in, not generated at build time, so the new table has to be declared by hand or `.from("llm_call_configs")` resolves to `never`. Task 10 step 2 carries the exact entry.
3. `playwright.security.config.ts` sets `timeout: 30_000`, which is shorter than the resolver's 30 second cache. A sleep-and-assert test would have failed on the timeout rather than on the behaviour. Task 11's test 19 raises its own timeout with `test.setTimeout()` and says why in a comment.

**One design consequence worth knowing before this ships.** The 30 second config cache is per edge-function isolate, and nothing can flush another isolate's copy. So an administrator's change takes up to 30 seconds to take effect everywhere, and the "Save & test" button can report the new model while a live call still uses the old one for a few seconds. That is acceptable for a settings page and is why the cache is short, but it should not surprise anyone.
