export type LLMTarget = "chatgpt" | "claude" | "gemini" | "perplexity";

export interface LLMOption {
  id: LLMTarget;
  name: string;
  icon: string;
}

export const LLM_OPTIONS: LLMOption[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "💬" },
  { id: "claude", name: "Claude", icon: "🤖" },
  { id: "gemini", name: "Gemini", icon: "✨" },
  { id: "perplexity", name: "Perplexity", icon: "🔍" },
];

const LLM_URLS: Record<LLMTarget, (encoded: string) => string> = {
  chatgpt: (encoded) => `https://chat.openai.com/?prompt=${encoded}`,
  claude: (encoded) => `https://claude.ai/new?q=${encoded}`,
  gemini: (encoded) => `https://gemini.google.com/app?query=${encoded}`,
  perplexity: (encoded) => `https://www.perplexity.ai/?q=${encoded}`,
};

const LLM_BASE_URLS: Record<LLMTarget, string> = {
  chatgpt: "https://chat.openai.com/",
  claude: "https://claude.ai/new",
  gemini: "https://gemini.google.com/app",
  perplexity: "https://www.perplexity.ai/",
};

// Most browsers/servers limit URLs to ~8KB; use 6000 chars as safe threshold
const MAX_URL_LENGTH = 6000;

export async function openLLM(model: LLMTarget, prompt: string): Promise<"url" | "clipboard"> {
  const encoded = encodeURIComponent(prompt);
  const url = LLM_URLS[model](encoded);

  if (url.length <= MAX_URL_LENGTH) {
    window.open(url, "_blank");
    return "url";
  }

  // URL too long – copy to clipboard and open blank session
  await navigator.clipboard.writeText(prompt);
  window.open(LLM_BASE_URLS[model], "_blank");
  return "clipboard";
}

export function buildPromptForLLM(title: string, content: string): string {
  return `# ${title}\n\n${content}`;
}

// Preference storage
const PREFERENCE_KEY = "querino_preferred_llm";

export function getPreferredLLM(): LLMTarget | null {
  const stored = localStorage.getItem(PREFERENCE_KEY);
  if (stored && LLM_OPTIONS.some((opt) => opt.id === stored)) {
    return stored as LLMTarget;
  }
  return null;
}

export function setPreferredLLM(llm: LLMTarget): void {
  localStorage.setItem(PREFERENCE_KEY, llm);
}
