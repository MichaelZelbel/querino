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
