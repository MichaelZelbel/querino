import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callProvider, ProviderHttpError } from "./llm-providers.ts";

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
