# Admin-configurable LLM calls

**Date:** 2026-08-23
**Status:** approved, not yet implemented

Give the Querino administrator one page where the provider, the model and the
system prompt of every LLM call in the app can be changed without a deploy.
Ported from the equivalent feature in Menerio, with the divergences listed at
the end.

## Why

Every AI call in Querino today hardcodes `google/gemini-3-flash-preview` and its
system prompt. Changing either one, to try a cheaper model, to fix a prompt that
produces bad metadata, to move a call off a provider having an outage, is a code
change and a deploy. It should be a dropdown and a textarea.

## Shape of the thing

One table keyed by call site. A resolution layer that lets a row in that table
override what the code would otherwise do. An admin-only edge function to read
and test the rows. An admin panel to edit them.

A row that does not exist, or exists with `enabled = false`, means "use the code
default". So the feature is inert until an administrator touches it, and turning
a row off is always a safe way back.

## 1. Data model

Migration: `supabase/migrations/<ts>_llm_calls_get_a_configuration.sql`, named in
the repo's existing style (timestamp, then a sentence).

```sql
CREATE TABLE public.llm_call_configs (
  call_site    TEXT NOT NULL,
  tier         TEXT NOT NULL DEFAULT 'default',
  description  TEXT,
  provider     TEXT NOT NULL DEFAULT 'lovable',
  model        TEXT NOT NULL,
  system_prompt TEXT,              -- NULL means "use the code default"
  temperature  NUMERIC,
  max_tokens   INTEGER,
  extra_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  updated_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (call_site, tier),
  CONSTRAINT llm_call_configs_provider_chk
    CHECK (provider IN ('lovable','openrouter','openai','anthropic','gemini')),
  CONSTRAINT llm_call_configs_tier_chk
    CHECK (tier IN ('default','free','premium'))
);
```

### Why `tier` is in the key on day one

Per-tier configuration, cheaper models for free users and better ones for paying
users, is **not built in this piece of work**. Whether it is even a good idea is
an open question: the case against is that free users are the ones you most want
to impress into converting.

The column is here anyway because it is the one part of that feature that is
expensive to add later. Adding tiering afterwards would mean migrating the
primary key of a live table and re-touching all five layers: table, resolver,
every caller, edge function and panel. Adding it now costs a column, a check
constraint and the fallback chain in section 2.

With the column present from the start, turning tiering on later is a tier
selector in the panel and nothing else. No migration, no resolver change, no call
site change. This build buys the option, not the feature.

Row-level security on, with two policies, both gated on `is_admin(auth.uid())`:
admins select, admins do everything. No policy for anyone else, so the anon key
that ships in the browser bundle reads nothing. `scripts/check-migrations.mjs`
enforces this on every new public table and will fail the build otherwise.

The `updated_at` trigger uses `public.update_updated_at_column`, which is the
function this repo actually has. Menerio's `handle_updated_at` does not exist
here.

The migration seeds all 17 rows (section 3) at tier `default`, with the provider
and model each call site uses today, and `system_prompt` NULL for every one of
them. No `free` or `premium` row is created. Applying the migration therefore
changes no behaviour.

**Usage ledger.** `llm_usage_events` already records `feature`, which is the same
string as `call_site`, so no new column is needed. Two smaller changes inside
`record_llm_usage`'s caller:

- `p_provider` is currently the literal `"lovable-ai"`. It becomes the provider
  actually used.
- `config_source`, one of `db-free`, `db-premium`, `db-default` or
  `fallback-default`, goes into the existing `p_metadata` jsonb. This avoids
  changing the RPC signature, and it makes the ledger say which tier's row
  actually served a call once tiering is switched on.

## 2. Resolution layer

`supabase/functions/_shared/llm.ts` is 250 lines today and would roughly double.
It splits into three files.

**`_shared/llm-config.ts`** (new). Ported near-verbatim from Menerio's
`llm-router.ts`, which is the part of that file worth copying:

- `loadConfig(db, callSite, tier)` with a 30 second in-memory cache keyed on both,
  so a burst of calls does not become a burst of selects.
- `resolveTier(db, userId)` reading `user_roles` and mapping `premium`,
  `premium_gift` and `admin` to `premium`, and `free` or a missing row to `free`.
  Cached the same way, so it is not a query per call. Callers with no user, the
  cron-driven ones, pass no id and resolve to `default` directly.
- `resolveConfig(db, callSite, tier, defaults)` returning the effective config
  plus a source of `db-<tier>`, `db-default` or `fallback-default`. It walks a
  three step chain and takes the first enabled row it finds:
  1. the row for `(callSite, tier)`
  2. the row for `(callSite, 'default')`
  3. the code default passed in by the caller

  The chain is what makes a half-filled table safe. Today only step 2 ever hits,
  because only `default` rows exist. When tiering is switched on later, a
  `premium` row for one call site changes that call site alone and every other
  one keeps falling through to `default`.
- `interpolatePrompt(prompt, vars)` replacing `{{key}}`. A missing key collapses
  to an empty string with a console warning, so a misconfigured prompt never
  leaks literal `{{...}}` text to the model.
- `resolveSystemPrompt(db, callSite, tier, fallback, vars)` for callers that build
  their own request and cannot go through `callLovableAI`.

**`_shared/llm-providers.ts`** (new). Five transports. Lovable, OpenRouter and
OpenAI share one OpenAI-compatible implementation that differs only in base URL
and key. Anthropic and Gemini each get their own, because their request and
response shapes are different enough that pretending otherwise produces silent
bugs. Each transport returns the same normalised `{content, tool_calls, usage,
model}` so nothing downstream cares which one ran.

Provider to secret:

| Provider   | Secret               | Present in Querino today |
| ---------- | -------------------- | ------------------------ |
| lovable    | `LOVABLE_API_KEY`    | yes                      |
| openrouter | `OPENROUTER_API_KEY` | yes                      |
| openai     | `OPENAI_API_KEY`     | yes                      |
| anthropic  | `ANTHROPIC_API_KEY`  | no                       |
| gemini     | `GEMINI_API_KEY`     | no                       |

The two without keys appear in the panel marked "no key" and cannot be selected,
which is how Menerio already renders an unavailable provider. Adding one later is
a Supabase secret, not a code change.

**`_shared/llm.ts`** (stays). Keeps the public contract, the credit gate
(`assertCredits`), usage recording, and the error classes. `callLovableAI` keeps
its exact name and signature, so none of its existing callers change. Inside, it
gains three steps before the fetch, using the service-role client it already
builds with `getServiceClient()` rather than taking a new argument:

1. `resolveConfig(getServiceClient(), opts.feature, await resolveTier(db, opts.user_id), {provider: 'lovable', model: opts.model ?? DEFAULT_MODEL})`
2. If the resolved config carries a `system_prompt` that is non-null and
   non-empty after trimming, replace the system message in `opts.messages` with
   it (interpolated). If the caller sent no system message, prepend one. In every
   other case, including an all-whitespace prompt, the caller's own message is
   used untouched.
3. Dispatch to the resolved provider's transport instead of always fetching the
   Lovable gateway.

`resolveConfig` and `resolveSystemPrompt` stay exported on their own, because one
call site must be configurable without being credit-gated (section 6).

## 3. The 17 call sites

Fifteen already pass a `feature` string through `callLovableAI` and need **no
code change at all**, only a seeded row:

| call_site                   | Source                                          |
| --------------------------- | ----------------------------------------------- |
| `prompt-coach`              | `_shared/coach.ts` via `prompt-coach`            |
| `prompt-kit-coach`          | `_shared/coach.ts` via `prompt-kit-coach`        |
| `skill-coach`               | `_shared/coach.ts` via `skill-coach`             |
| `workflow-coach`            | `_shared/coach.ts` via `workflow-coach`          |
| `suggest-metadata`          | `_shared/suggest.ts` via `suggest-metadata`      |
| `suggest-promptkit-metadata`| `_shared/suggest.ts`                             |
| `suggest-skill-metadata`    | `_shared/suggest.ts`                             |
| `suggest-workflow-metadata` | `_shared/suggest.ts`                             |
| `ai-insights-prompt`        | `ai-insights`                                    |
| `ai-insights-skill`         | `ai-insights`                                    |
| `ai-insights-workflow`      | `ai-insights`                                    |
| `ai-insights-prompt_kit`    | `ai-insights`                                    |
| `prompt-wizard`             | `prompt-wizard`                                  |
| `prompt-refinement`         | `refine-prompt`                                  |
| `translate-artifact`        | `translate-artifact`                             |

`ai-insights` is four rows rather than one because it already builds its feature
string as `ai-insights-${item_type}` and already keeps a separate system prompt
per artifact type. Four rows matches what the usage ledger records today and
lets each artifact type be tuned separately.

Two are rewired, because they bypass the shared helper and fetch the gateway
directly with a hardcoded model and an inline system prompt:

| call_site            | What changes                                                |
| -------------------- | ----------------------------------------------------------- |
| `canvas-ai`          | Routed through `callLovableAI`. See section 6.               |
| `ai-moderate-content`| Uses `resolveConfig` plus a transport, no credit gate. See 6.|

All 17 seed at tier `default` as `lovable` / `google/gemini-3-flash-preview`,
which is what every one of them uses today.

**Placeholders**, listed under the prompt box in the panel so an administrator
knows what a custom prompt may reference:

- `translate-artifact`: `{{targetLanguage}}`
- `canvas-ai`: `{{mode}}`, `{{artifactType}}`, `{{canvasContent}}`
- everything else: none

## 4. Admin edge function

`supabase/functions/admin-llm-config/index.ts`, ported from Menerio with two
changes.

It authorises with `isAdminCaller` from `_shared/internalAuth.ts`, which is this
repo's authoritative admin check, rather than Menerio's inline `is_admin` RPC
call. Per the repo's non-negotiable security rule, the identity comes from the
JWT and never from the request body.

Three actions:

- **`list`** backfills any missing rows and empty descriptions from the registry
  without overwriting administrator edits, then returns
  `{configs, availability, providers}`. It takes an optional `tier` defaulting to
  `default`, and only backfills that tier, so it never invents `free` or
  `premium` rows on its own.
- **`sync_defaults`** with an optional `force` to overwrite every column from the
  registry. Destructive, used for rollout and migration. Operates on tier
  `default` only.
- **`test`** saves nothing itself; it reads the persisted row for one call site
  and tier, runs a single real call with a supplied prompt and test values
  substituted for any placeholders, and returns provider, model, content,
  `config_source`, latency and tokens spent.

`providers` in the `list` response is the preset catalogue: the five providers
and their suggested models. It lives in **one server-side constant**, not in the
React component. That is deliberate (section 8).

## 5. Admin UI

**`src/pages/Admin.tsx`** becomes a Tabs layout: Users, AI Credits, Moderation,
Embeddings, LLM Config. The four existing panels move into tab content with no
edits to their internals.

The Users table and its handlers, which are most of the page's 529 lines, move
out to **`src/components/admin/UsersPanel.tsx`** unchanged in behaviour, leaving
`Admin.tsx` as the tab shell it should be. The access-control effect stays in
`Admin.tsx` and still runs before any tab renders.

**`src/components/admin/LLMConfigPanel.tsx`** is a close port of Menerio's,
lazy-loaded the same way:

- Provider availability badges across the header, unavailable ones marked
  "no key".
- A filter box over call sites.
- A table: call site, provider, model, system prompt (`Custom` or `Code default`),
  active, Edit.
- An edit dialog: provider select, model select seeded from `providers` plus a
  free-text field for any model id not in the list, system prompt textarea with
  "Reset to code default", temperature, max tokens, an Active switch, and a
  "Save & test" button that persists then runs one real call and shows provider,
  model, latency, tokens and the output.

The free-text model field matters more than the preset list. A model released
this morning is usable the same day by pasting its id, with no registry involved
and no deploy.

**No tier selector.** The panel reads and writes tier `default` only, and does not
mention tiers at all. The column exists in the table and the resolver honours it,
but an administrator has no way to create a `free` or `premium` row from the UI
in this build, which is deliberate: the decision on whether tiering is worth
having has not been made yet, and a control for an undecided feature is worse
than no control.

## 6. Behaviour changes, stated rather than smuggled

**`canvas-ai` starts deducting tokens.** Today it calls `assertCredits`, so it
refuses when a user is out of credits, but it never calls `record_llm_usage`, so
the call itself costs the user nothing. Routing it through `callLovableAI` makes
it record and deduct like the other fifteen. Approved on 2026-08-23. Users who
lean on the canvas will see credits fall faster than before.

**`ai-moderate-content` deliberately keeps no credit gate.** It is called by cron
or by an admin, it is a platform cost, and gating it on a user's balance would
stop moderation whenever that user ran dry. So it calls `resolveConfig` and a
transport directly rather than `callLovableAI`. Its provider, model and system
prompt become configurable; its accounting does not change. It also keeps its
`requireMachineOrAdmin` guard.

**`ai-insights` becomes four rows**, as described in section 3.

## 7. Testing

Deno is already a devDependency for `scripts/deno-check.mjs`, so `deno test`
needs no new tooling. Written first, before the code they cover:

- `interpolatePrompt`: substitutes a value; a missing key collapses to an empty
  string rather than leaking `{{...}}`; a null prompt stays null.
- `resolveConfig` and its three step chain: a `premium` row wins for a premium
  caller; with no `premium` row that caller falls through to the `default` row;
  with neither, to the code default. A disabled tier row falls through rather
  than blocking, so switching one off restores the tier below it. A failed load
  falls back rather than throws.
- `resolveTier`: `premium`, `premium_gift` and `admin` map to premium; `free` and
  a missing row map to free; no user id gives `default`.
- System message handling: a config prompt replaces an existing system message,
  prepends when there is none, and leaves the caller's message alone when the
  config carries no prompt.

Live behaviour joins the existing numbered Playwright suite in `tests/security/`,
in its established style:

- `18-llm-config-is-admin-only.spec.ts`: anon cannot read `llm_call_configs`; a
  signed-in non-admin cannot read or write it; `admin-llm-config` returns 403 to
  a non-admin.
- `19-a-call-site-uses-its-configured-model.spec.ts`: write a config row, invoke
  that call site, assert the usage ledger recorded that model and a
  `config_source` of `db`.

`npm run check` (migrations, lint ratchet, Deno types) stays green throughout,
and `npm test` passes before anything ships.

## 8. Divergences from Menerio, and why

**Mistral is dropped.** Every Mistral model in Menerio's preset list is an OCR or
vision model serving uploaded PDFs, and Querino has no upload or OCR feature to
point them at. Five providers, not six. Adding it later is one line in the
server-side preset constant.

**Default system prompts stay in the files that own them.** Menerio's
`llm-defaults.ts` is 918 lines mostly because prompt text was migrated into it,
but its own seed migration shows the architecture never required that: nearly
every seeded row has `system_prompt` NULL, and `resolveSystemPrompt` takes the
fallback from the calling code. Querino's registry therefore carries metadata
only: description, placeholders, default provider and model. The panel still
distinguishes `Custom` from `Code default` and "Reset to code default" still
works, on a far smaller diff.

**Embeddings are not configurable.** Menerio lists `embeddings.default` as a call
site. Querino's `_shared/embeddings.ts` documents why that is dangerous here: a
similarity score is only meaningful between vectors from the same model, and a
different model does not error, it returns confident nonsense. Making the
embedding model a dropdown means one click can silently poison the vector store
and degrade search with nothing in the logs. If this is ever wanted, it needs a
dimension guard and a backfill plan, which is its own piece of work.

**The preset list is served, not hardcoded in the UI.** The panel reads
`providers` from the `admin-llm-config` response. Today that is a constant in one
server file. This is the seam for the follow-up below.

## 9. Follow-ups, deliberately not in this build

**Per-tier configuration.** Cheaper or slower models for free users, better ones
for paying users, configured separately because a different model often wants a
different system prompt. The table, the resolver and the ledger already support
it after this build (section 1). What is missing is only the panel control: a
tier selector that lets an administrator create a `free` or `premium` row
alongside the `default` one.

Worth deciding with data rather than now. The case against tiering is real: free
users are the ones you most want to impress into paying, and giving them the
weaker model is a strange way to sell the stronger one. The case for it is
budget. Once this build has been live for a while, `llm_usage_events` grouped by
feature and by user role answers which call sites actually cost money on free
accounts, which is the number that settles the argument.

**A shared model registry across applications.** Preset lists go stale as models
ship and are retired. Three ways forward, in rising order of effort: fetch live
from a provider's own catalogue (`GET https://openrouter.ai/api/v1/models` is
public and returns 200 with no API key, verified 2026-08-23); keep one shared
table that Querino, Menerio and the hub all read; or a provisioning service both
apps call.

The natural home is Querino itself, which is already the cross-app AI-artifacts
registry and already exposes an MCP server. An `llm_models` table plus one public
read endpoint would serve the others.

None of that is built here. Because the panel reads `providers` from the server,
adopting any of the three later is a change to one server-side file: no UI
change, no migration, no second application to touch.
