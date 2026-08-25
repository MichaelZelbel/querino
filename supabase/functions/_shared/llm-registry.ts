// What the admin panel needs to know about each call site, and nothing else.
//
// Deliberately not a home for prompt text. Menerio's equivalent grew to 918
// lines because default prompts were migrated into it; here they stay in the
// files that own them and are passed to the resolver as a fallback, so this
// file stays a table of contents.

export type Provider =
  "lovable" | "openrouter" | "openai" | "anthropic" | "gemini";
export type Tier = "default" | "free" | "premium";

// The code defaults, used when the config table has no row for a call site or
// cannot be read at all.
//
// These point at OpenRouter, not at the Lovable gateway. On 2026-08-23 the
// Lovable workspace hit its credit limit and every AI call in the app returned
// 502; a fallback that lands on a dead provider is not a fallback. Independence
// from Lovable has to hold when the config table is unreachable too, otherwise
// it is only independence on a good day.
//
// CHAT: interactive and user-facing, so it has to be quick and reliable.
// BACKGROUND: short structured output nobody waits on, so it is the cheap one.
export const DEFAULT_PROVIDER: Provider = "openrouter";
export const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";
export const BACKGROUND_MODEL = "deepseek/deepseek-v4-flash";
export const TRANSLATION_MODEL = "google/gemini-3.7-flash";

export interface CallSiteMeta {
  call_site: string;
  description: string;
  provider: Provider;
  model: string;
  /** Names usable as {{name}} in a custom system prompt. */
  placeholders: string[];
  /**
   * True when this call site sends a tools array, so a model without tool
   * support breaks it. Eleven of the seventeen do. Such a model does not
   * error: it answers in prose and the JSON parse fails downstream, which is
   * why the nightly catalogue sync acts on this flag rather than guessing.
   * llm-registry_test.ts is what holds it level with the code.
   */
  requiresTools: boolean;
}

export const CALL_SITES: CallSiteMeta[] = [
  {
    call_site: "prompt-coach",
    description: "Chat coach that helps a user write a prompt.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "prompt-kit-coach",
    description: "Chat coach that helps a user write a prompt kit.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "skill-coach",
    description: "Chat coach that helps a user write a skill.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "workflow-coach",
    description: "Chat coach that helps a user write a workflow.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "suggest-metadata",
    description: "Suggests title, description and tags for a prompt.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "suggest-promptkit-metadata",
    description: "Suggests title, description and tags for a prompt kit.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "suggest-skill-metadata",
    description: "Suggests title, description and tags for a skill.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "suggest-workflow-metadata",
    description: "Suggests title, description and tags for a workflow.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "ai-insights-prompt",
    description: "Generates the AI insights shown on a prompt page.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: false,
  },
  {
    call_site: "ai-insights-skill",
    description: "Generates the AI insights shown on a skill page.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: false,
  },
  {
    call_site: "ai-insights-workflow",
    description: "Generates the AI insights shown on a workflow page.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: false,
  },
  {
    call_site: "ai-insights-prompt_kit",
    description: "Generates the AI insights shown on a prompt kit page.",
    provider: DEFAULT_PROVIDER,
    model: BACKGROUND_MODEL,
    placeholders: [],
    requiresTools: false,
  },
  {
    call_site: "prompt-wizard",
    description: "The guided wizard that builds a prompt from answers.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: [],
    requiresTools: false,
  },
  {
    call_site: "prompt-refinement",
    description: "Refines an existing prompt on request.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: [],
    requiresTools: true,
  },
  {
    call_site: "translate-artifact",
    description: "Translates an artifact into another language.",
    provider: DEFAULT_PROVIDER,
    model: TRANSLATION_MODEL,
    placeholders: ["artifactType", "sourceLanguage", "targetLanguage"],
    requiresTools: true,
  },
  {
    call_site: "canvas-ai",
    description: "The canvas assistant that edits an artifact in place.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: ["mode", "artifactType", "canvasContent", "modeInstructions"],
    requiresTools: false,
  },
  {
    call_site: "ai-moderate-content",
    description: "Classifies queued user content against the content policies.",
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    placeholders: [],
    requiresTools: true,
  },
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

// A STATIC LIST. Nothing here is fetched at runtime, from OpenRouter or anyone
// else. The models below were copied by hand out of OpenRouter's catalogue; the
// app has never called its /models endpoint and does not now.
//
// It is served to the panel rather than hardcoded in it, so swapping this
// constant for a live catalogue or a shared cross-app registry later is a change
// to this file and nothing else. That is the only sense in which the panel's
// list is dynamic: the UI hardcodes nothing, this file does. The panel also
// keeps a free-text model field, which is what actually makes a model released
// this morning usable this morning without waiting for anyone to edit this.
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    provider: "lovable",
    label: "Lovable AI Gateway",
    models: [
      {
        value: "google/gemini-3-flash-preview",
        label: "Gemini 3 Flash Preview (default)",
      },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      {
        value: "google/gemini-2.5-flash-lite",
        label: "Gemini 2.5 Flash Lite (cheapest)",
      },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (strongest)" },
      { value: "openai/gpt-5", label: "GPT-5" },
      { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
      { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
    ],
  },
  {
    // Prices are per million tokens, input/output, read from OpenRouter's public
    // catalogue on 2026-08-23. They drift, so treat them as a rough ordering
    // rather than a quote, and check openrouter.ai/models before trusting one.
    // Every model here supports tool calling, which eleven of the seventeen
    // call sites require and which fails silently on a model that lacks it.
    provider: "openrouter",
    label: "OpenRouter",
    models: [
      {
        value: "google/gemini-3.1-flash-lite",
        label: "Gemini 3.1 Flash Lite ($0.25/$1.50) — chat default",
      },
      {
        value: "google/gemini-3.7-flash",
        label: "Gemini 3.7 Flash ($0.38/$1.88) — stronger, translation",
      },
      {
        value: "deepseek/deepseek-v4-flash",
        label: "DeepSeek V4 Flash ($0.05/$0.10) — background default",
      },
      {
        value: "qwen/qwen3.7-flash",
        label: "Qwen3.7 Flash ($0.03/$0.13) — cheapest sensible",
      },
      {
        value: "mistralai/mistral-small-3.2-24b-instruct",
        label: "Mistral Small 3.2 24B ($0.08/$0.20)",
      },
      { value: "z-ai/glm-4.7-flash", label: "GLM 4.7 Flash ($0.06/$0.40)" },
      {
        value: "meta-llama/llama-4-scout",
        label: "Llama 4 Scout ($0.10/$0.30)",
      },
      { value: "openai/gpt-5-mini", label: "GPT-5 Mini ($0.25/$2.00)" },
      {
        value: "google/gemini-3-flash-preview",
        label: "Gemini 3 Flash Preview ($0.50/$3.00) — dearest here",
      },
      { value: "openrouter/auto", label: "Auto (OpenRouter chooses)" },
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
