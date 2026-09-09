import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  callProvider,
  ProviderHttpError,
  toGeminiSchema,
} from "./llm-providers.ts";

function stubFetch(
  status: number,
  body: unknown,
  capture?: { url?: string; init?: RequestInit },
) {
  return (
    url: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    if (capture) {
      capture.url = String(url);
      capture.init = init;
    }
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
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
    fetchImpl: stubFetch(
      200,
      {
        choices: [{ message: { content: "hi there" } }],
        usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
        model: "openai/gpt-4o-mini",
      },
      cap,
    ),
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
      fetchImpl: stubFetch(
        200,
        { choices: [{ message: { content: "x" } }] },
        cap,
      ),
    });
    seen.push(cap.url!);
  }
  assertEquals(seen, [
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    "https://openrouter.ai/api/v1/chat/completions",
    "https://api.openai.com/v1/chat/completions",
  ]);
});

Deno.test(
  "anthropic lifts the system message out of the message list",
  async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    const result = await callProvider({
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      messages: MESSAGES,
      apiKey: "k",
      fetchImpl: stubFetch(
        200,
        {
          content: [{ type: "text", text: "brief answer" }],
          usage: { input_tokens: 4, output_tokens: 1 },
          model: "claude-3-5-haiku-20241022",
        },
        cap,
      ),
    });
    assertEquals(result.content, "brief answer");
    assertEquals(result.usage.total_tokens, 5);
    const body = JSON.parse(String(cap.init!.body));
    assertEquals(body.system, "be brief");
    assertEquals(body.messages, [{ role: "user", content: "hello" }]);
  },
);

Deno.test("gemini maps roles and reads its own usage shape", async () => {
  const cap: { url?: string; init?: RequestInit } = {};
  const result = await callProvider({
    provider: "gemini",
    model: "gemini-2.0-flash",
    messages: MESSAGES,
    apiKey: "k",
    fetchImpl: stubFetch(
      200,
      {
        candidates: [{ content: { parts: [{ text: "ok" }] } }],
        usageMetadata: {
          promptTokenCount: 6,
          candidatesTokenCount: 1,
          totalTokenCount: 7,
        },
      },
      cap,
    ),
  });
  assertEquals(result.content, "ok");
  assertEquals(result.usage.total_tokens, 7);
  const body = JSON.parse(String(cap.init!.body));
  assertEquals(body.systemInstruction.parts[0].text, "be brief");
  assertEquals(body.contents[0].role, "user");
});

Deno.test(
  "a non-2xx response throws ProviderHttpError carrying the status",
  async () => {
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
  },
);

// ── Tool calling on Anthropic and Gemini ─────────────────────────────────────
//
// Eleven call sites force a tool call. Until 2026-09-08 these two transports
// dropped `tools` and returned `tool_calls: []`, so a call site pointed at
// either of them answered in prose, the caller returned 502, and the user had
// already been charged. These tests pin down both directions of the mapping.

const RESPOND_TOOL = {
  type: "function" as const,
  function: {
    name: "respond",
    description: "Return the answer.",
    parameters: {
      type: "object",
      properties: { answer: { type: "string" } },
      required: ["answer"],
      additionalProperties: false,
    },
  },
};

Deno.test(
  "anthropic sends tools in its own dialect and reads tool_use back",
  async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    const result = await callProvider({
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      messages: MESSAGES,
      apiKey: "k",
      tools: [RESPOND_TOOL],
      toolChoice: { type: "function", function: { name: "respond" } },
      fetchImpl: stubFetch(
        200,
        {
          content: [
            { type: "text", text: "" },
            {
              type: "tool_use",
              id: "toolu_1",
              name: "respond",
              input: { answer: "42" },
            },
          ],
          usage: { input_tokens: 4, output_tokens: 2 },
          model: "claude-3-5-haiku-20241022",
        },
        cap,
      ),
    });
    const body = JSON.parse(String(cap.init!.body));
    assertEquals(body.tools, [
      {
        name: "respond",
        description: "Return the answer.",
        input_schema: RESPOND_TOOL.function.parameters,
      },
    ]);
    assertEquals(body.tool_choice, { type: "tool", name: "respond" });
    assertEquals(result.tool_calls.length, 1);
    assertEquals(result.tool_calls[0].id, "toolu_1");
    assertEquals(result.tool_calls[0].function.name, "respond");
    assertEquals(JSON.parse(result.tool_calls[0].function.arguments), {
      answer: "42",
    });
  },
);

Deno.test("anthropic maps 'required' and 'auto' tool choices", async () => {
  for (const [choice, expected] of [
    ["required", { type: "any" }],
    ["auto", { type: "auto" }],
    [undefined, { type: "auto" }],
  ] as const) {
    const cap: { init?: RequestInit } = {};
    await callProvider({
      provider: "anthropic",
      model: "m",
      messages: MESSAGES,
      apiKey: "k",
      tools: [RESPOND_TOOL],
      toolChoice: choice,
      fetchImpl: stubFetch(200, { content: [] }, cap),
    });
    assertEquals(JSON.parse(String(cap.init!.body)).tool_choice, expected);
  }
});

Deno.test(
  "gemini sends function declarations, forces the call, and reads functionCall back",
  async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    const result = await callProvider({
      provider: "gemini",
      model: "gemini-2.0-flash",
      messages: MESSAGES,
      apiKey: "k",
      tools: [RESPOND_TOOL],
      toolChoice: { type: "function", function: { name: "respond" } },
      fetchImpl: stubFetch(
        200,
        {
          candidates: [
            {
              content: {
                parts: [
                  { functionCall: { name: "respond", args: { answer: "ok" } } },
                ],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 6,
            candidatesTokenCount: 1,
            totalTokenCount: 7,
          },
        },
        cap,
      ),
    });
    const body = JSON.parse(String(cap.init!.body));
    assertEquals(body.tools[0].functionDeclarations[0].name, "respond");
    // Gemini answers 400 to additionalProperties, so it must not be sent.
    assertEquals(
      "additionalProperties" in
        body.tools[0].functionDeclarations[0].parameters,
      false,
    );
    assertEquals(body.toolConfig, {
      functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["respond"] },
    });
    assertEquals(result.tool_calls.length, 1);
    assertEquals(result.tool_calls[0].function.name, "respond");
    assertEquals(JSON.parse(result.tool_calls[0].function.arguments), {
      answer: "ok",
    });
    assertEquals(result.content, null);
  },
);

Deno.test(
  "toGeminiSchema strips unsupported keys at every depth and keeps the rest",
  () => {
    const out = toGeminiSchema({
      type: "object",
      additionalProperties: false,
      properties: {
        tags: {
          type: "array",
          items: { type: "string", pattern: "^[a-z]+$" },
          default: [],
        },
        canvas: {
          type: "object",
          additionalProperties: false,
          properties: { updated: { type: "boolean" } },
          required: ["updated"],
        },
      },
      required: ["tags"],
    }) as Record<string, unknown>;
    assertEquals(out, {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
        canvas: {
          type: "object",
          properties: { updated: { type: "boolean" } },
          required: ["updated"],
        },
      },
      required: ["tags"],
    });
  },
);
