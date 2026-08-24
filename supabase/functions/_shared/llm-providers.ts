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
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
}

export type ToolChoice =
  "auto" | "required" | { type: "function"; function: { name: string } };

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
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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
  for (const [p, env] of Object.entries(PROVIDER_SECRETS) as [
    Provider,
    string,
  ][]) {
    out[p] = !!Deno.env.get(env);
  }
  return out;
}

async function readOrThrow(response: Response): Promise<unknown> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ProviderHttpError(
      response.status,
      text || `Provider error ${response.status}`,
    );
  }
  return await response.json();
}

async function callOpenAICompatible(
  req: ProviderRequest,
): Promise<ProviderResult> {
  const doFetch = req.fetchImpl ?? fetch;
  const url = OPENAI_COMPATIBLE_URLS[req.provider]!;

  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
    stream: false,
  };
  if (req.temperature !== undefined && req.temperature !== null)
    body.temperature = req.temperature;
  if (req.maxTokens !== undefined && req.maxTokens !== null)
    body.max_tokens = req.maxTokens;
  if (req.tools && req.tools.length > 0) {
    body.tools = req.tools;
    body.tool_choice = req.toolChoice ?? "auto";
  }

  const json = (await readOrThrow(
    await doFetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  )) as {
    choices?: Array<{
      message?: { content?: string | null; tool_calls?: ToolCall[] };
    }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
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
  const system = req.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const rest = req.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model: req.model,
    messages: rest,
    max_tokens: req.maxTokens ?? 4096,
  };
  if (system.length > 0) body.system = system;
  if (req.temperature !== undefined && req.temperature !== null)
    body.temperature = req.temperature;

  const json = (await readOrThrow(
    await doFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": req.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  )) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    model?: string;
  };

  const text = (json.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  const prompt = Number(json.usage?.input_tokens ?? 0);
  const completion = Number(json.usage?.output_tokens ?? 0);
  return {
    content: text.length > 0 ? text : null,
    tool_calls: [],
    usage: {
      prompt_tokens: prompt,
      completion_tokens: completion,
      total_tokens: prompt + completion,
    },
    model: json.model || req.model,
    raw: json,
  };
}

async function callGemini(req: ProviderRequest): Promise<ProviderResult> {
  const doFetch = req.fetchImpl ?? fetch;

  const system = req.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = req.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = { contents };
  if (system.length > 0) body.systemInstruction = { parts: [{ text: system }] };
  const generationConfig: Record<string, unknown> = {};
  if (req.temperature !== undefined && req.temperature !== null) {
    generationConfig.temperature = req.temperature;
  }
  if (req.maxTokens !== undefined && req.maxTokens !== null) {
    generationConfig.maxOutputTokens = req.maxTokens;
  }
  if (Object.keys(generationConfig).length > 0)
    body.generationConfig = generationConfig;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent`;
  const json = (await readOrThrow(
    await doFetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": req.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  )) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
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
