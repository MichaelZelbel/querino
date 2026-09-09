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

// ── Tool calling on the two non-OpenAI dialects ──────────────────────────────
//
// Eleven of the seventeen call sites force a tool call and read the answer out
// of `tool_calls[0].function.arguments`. Until 2026-09-08 these two transports
// dropped `tools` on the floor and returned `tool_calls: []`, so any call site
// an administrator pointed at Anthropic or Gemini answered in prose, the caller
// returned 502, and the user had already been charged. Each dialect gets the
// same tools, the same choice, and hands back the same ToolCall shape.

function anthropicToolChoice(choice: ToolChoice | undefined) {
  if (!choice || choice === "auto") return { type: "auto" };
  if (choice === "required") return { type: "any" };
  return { type: "tool", name: choice.function.name };
}

function geminiToolConfig(choice: ToolChoice | undefined) {
  if (!choice || choice === "auto") {
    return { functionCallingConfig: { mode: "AUTO" } };
  }
  if (choice === "required") {
    return { functionCallingConfig: { mode: "ANY" } };
  }
  return {
    functionCallingConfig: {
      mode: "ANY",
      allowedFunctionNames: [choice.function.name],
    },
  };
}

// Gemini's function declarations take an OpenAPI subset, not JSON Schema, and
// the API answers 400 to a key it does not know. `additionalProperties: false`
// is on every tool in this repository, so it has to be stripped, not hoped
// away.
const GEMINI_UNSUPPORTED_SCHEMA_KEYS = new Set([
  "additionalProperties",
  "$schema",
  "$id",
  "$ref",
  "default",
  "examples",
  "title",
  "const",
  "pattern",
  "patternProperties",
]);

export function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema === null || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(
    schema as Record<string, unknown>,
  )) {
    if (GEMINI_UNSUPPORTED_SCHEMA_KEYS.has(key)) continue;
    if (key === "properties" && value && typeof value === "object") {
      const props: Record<string, unknown> = {};
      for (const [name, sub] of Object.entries(
        value as Record<string, unknown>,
      )) {
        props[name] = toGeminiSchema(sub);
      }
      out[key] = props;
      continue;
    }
    out[key] = toGeminiSchema(value);
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
  if (req.tools && req.tools.length > 0) {
    body.tools = req.tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
    body.tool_choice = anthropicToolChoice(req.toolChoice);
  }

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
    content?: Array<{
      type: string;
      text?: string;
      id?: string;
      name?: string;
      input?: unknown;
    }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    model?: string;
  };

  const blocks = json.content ?? [];
  const text = blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  const tool_calls: ToolCall[] = blocks
    .filter((b) => b.type === "tool_use" && typeof b.name === "string")
    .map((b, i) => ({
      id: b.id || `anthropic_tool_${i}`,
      type: "function" as const,
      function: {
        name: b.name!,
        arguments: JSON.stringify(b.input ?? {}),
      },
    }));
  const prompt = Number(json.usage?.input_tokens ?? 0);
  const completion = Number(json.usage?.output_tokens ?? 0);
  return {
    content: text.length > 0 ? text : null,
    tool_calls,
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
  if (req.tools && req.tools.length > 0) {
    body.tools = [
      {
        functionDeclarations: req.tools.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: toGeminiSchema(t.function.parameters),
        })),
      },
    ];
    body.toolConfig = geminiToolConfig(req.toolChoice);
  }

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
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          functionCall?: { name?: string; args?: unknown };
        }>;
      };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  const tool_calls: ToolCall[] = parts
    .filter((p) => typeof p.functionCall?.name === "string")
    .map((p, i) => ({
      id: `gemini_tool_${i}`,
      type: "function" as const,
      function: {
        name: p.functionCall!.name!,
        arguments: JSON.stringify(p.functionCall!.args ?? {}),
      },
    }));
  return {
    content: text.length > 0 ? text : null,
    tool_calls,
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
