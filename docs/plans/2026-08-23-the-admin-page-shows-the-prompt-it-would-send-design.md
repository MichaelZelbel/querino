# The admin page shows the prompt it would send

**Date:** 2026-08-23
**Status:** approved
**Amends:** `2026-08-23-llm-call-configuration-design.md`, section 8

The LLM Config tab's system prompt box is empty on every one of the seventeen
call sites. It shows the placeholder "Leave empty to use the default in the
code." An administrator cannot read the prompt that is actually being sent, so
they cannot judge whether it needs changing, and an override has to be written
blind.

## Why it is empty

Not a bug. Section 8 of the original design put default prompt text in the files
that own it and passed it to the resolver as a fallback, so the registry stayed a
table of contents rather than growing into Menerio's 918-line `llm-defaults.ts`.
`llm_call_configs.system_prompt` is NULL for all seventeen rows, and the server
has no way to read what the default says.

## What changes, and why that reason survives

Showing the default requires the admin endpoint to be able to read the text.
There is no UI-only fix. So the text has to move somewhere both the call site and
`admin-llm-config` can import.

It moves to `supabase/functions/_shared/prompts/`, **one file per owning
function**, fourteen files of ten to sixty lines each, plus `coach-suffix.ts` for
the block the four coaches append. `_shared/llm-default-prompts.ts` is a thin
index exporting `DEFAULT_SYSTEM_PROMPTS: Record<call_site, string>` with the
coach entries already composed.

The rejected thing was one unnavigable file. That is still rejected: each prompt
keeps a single home, and `llm-registry.ts` stays metadata only. What is given up
is that a call site's prompt no longer sits in the same file as its handler. That
is the price of the admin page telling the truth, and it is worth paying.

## Two call sites become templates

`canvas-ai` and `translate-artifact` compose their prompt from runtime values, so
their default is a template interpolated at the call site by `interpolatePrompt`.

- `canvas-ai` gains a `{{modeInstructions}}` placeholder for the mode-dependent
  paragraph, alongside the `{{mode}}`, `{{artifactType}}` and `{{canvasContent}}`
  it already declares.
- `translate-artifact` declares `{{artifactType}}`, `{{sourceLanguage}}` and
  `{{targetLanguage}}`, and starts passing `templateVars`. It did not before, so
  a custom prompt using its one declared placeholder would have interpolated to
  an empty string. That was a live bug.
- `translate-artifact`'s prompt tells the model to preserve "template variables
  like `{{variable}}`". Once that prompt is interpolated, the interpolator eats
  the example. The line is reworded to name double-brace placeholders without
  writing one.

The four coaches are shown composed, coach text plus the shared suffix, because
that is what is sent, and because an override replaces the whole system message.
An administrator who cannot see the suffix would delete the tool-calling contract
without knowing.

## Server

- `list` returns `default_system_prompt` per row, computed from the map. No
  column, no migration.
- `save` normalises. A prompt that trims to empty, **or that trims equal to that
  call site's default**, is stored as NULL. Enforced on the server, so no client
  can freeze a call site by accident, and the table's "Custom" versus "Code
  default" column cannot start lying. The cost: an administrator cannot pin
  today's default text verbatim without changing a character. That is the right
  side of the trade, because a call site silently stopping tracking code changes
  is the failure nobody notices.
- `test` passes the default as the `systemPrompt` fallback, so testing a call
  site that is on the code default finally exercises its real prompt instead of
  sending none.

## Panel

The box is prefilled with `system_prompt ?? default_system_prompt` and is never
empty. A badge above it reads "Code default" while the text still matches and
flips to "Custom" the moment it differs, computed live from the same rule the
server enforces. "Reset to code default" refills the box with the default text
rather than emptying it, and is always available. Clearing the box by hand still
means code default, and the box shows the default again when reopened. The
`{{placeholder}}` hint and the table column are untouched.

## Tests

Deno unit tests in `_shared/`:

- Every registry call site has a default and every default has a call site, so
  the two cannot drift.
- Every `{{placeholder}}` in a default is declared in the registry and vice
  versa. This one fails against today's `translate-artifact`.
- `normalizeSystemPrompt(callSite, text)` returns NULL for empty, NULL for
  default-equal, the text otherwise.
- Golden tests: the `canvas-ai` and `translate-artifact` templates, interpolated,
  reproduce the exact strings the current builders produce, so the move is
  provably behaviour-preserving.
- The composed coach prompt equals coach text plus suffix.

Live Playwright, `tests/security/20-the-admin-page-can-read-every-prompt.spec.ts`:
`list` returns a non-empty default for all seventeen call sites, and saving an
unmodified default leaves `system_prompt` NULL.

## Deploy

No migration. The fourteen functions whose prompt moved plus `admin-llm-config`
are deployed individually by name, and the frontend ships with the repo push.
