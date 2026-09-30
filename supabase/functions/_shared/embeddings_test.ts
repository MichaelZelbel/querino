import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MAX_INPUT_CHARS,
  embeddableText,
  statusBlamesInput,
  truncateToTokenBudget,
} from "./embeddings.ts";

Deno.test("English prose is kept well past the old 8,000 characters", () => {
  const prose = "the quick brown fox jumps over the lazy dog ".repeat(300);
  assertEquals(truncateToTokenBudget(prose, 7_000).length, prose.length);
});

Deno.test(
  "CJK text is cut by its byte weight, so it stays under the model's limit",
  () => {
    const cjk = "漢".repeat(8_000);
    const cut = truncateToTokenBudget(cjk, 7_000);
    // Three bytes each: at most 2,333 characters fit a 7,000-token budget.
    assertEquals(cut.length, 2_333);
  },
);

Deno.test("an emoji is never split in half", () => {
  const emoji = "😀".repeat(5_000);
  const cut = truncateToTokenBudget(emoji, 10);
  // Four "tokens" each, two whole emoji, four UTF-16 code units.
  assertEquals(cut, "😀😀");
});

Deno.test("the character ceiling holds whatever the estimate allows", () => {
  const spaces = " ".repeat(MAX_INPUT_CHARS * 2);
  assertEquals(
    truncateToTokenBudget(spaces, 1_000_000).length,
    MAX_INPUT_CHARS,
  );
});

Deno.test("embeddableText joins the fields and applies the same budget", () => {
  const row = { title: "T", description: null, content: "漢".repeat(8_000) };
  const text = embeddableText(row, ["title", "description", "content"]);
  assertEquals(text.startsWith("T\n\n"), true);
  assertEquals(text.length < 3_000, true);
});

Deno.test("only a refusal of the text itself spends an attempt", () => {
  assertEquals(statusBlamesInput(400), true);
  assertEquals(statusBlamesInput(413), true);
  assertEquals(statusBlamesInput(422), true);
  assertEquals(statusBlamesInput(401), false);
  assertEquals(statusBlamesInput(402), false);
  assertEquals(statusBlamesInput(429), false);
  assertEquals(statusBlamesInput(500), false);
  assertEquals(statusBlamesInput(503), false);
});

// ── Paying for an embedding (2026-09-30) ─────────────────────────────────────

import {
  createEmbedding,
  EMBEDDING_DIMENSIONS,
  embedAndCharge,
  estimateEmbeddingTokens,
  MAX_INPUT_TOKENS,
  type EmbeddingResult,
  type LedgerClient,
} from "./embeddings.ts";

Deno.test("the reservation is never below what the provider can bill", () => {
  // The estimate counts every character at or above its real token cost, so
  // it only ever overstates. It is also capped where the text is cut.
  assertEquals(estimateEmbeddingTokens("hello world") >= 3, true);
  assertEquals(
    estimateEmbeddingTokens("漢".repeat(8_000)) <= MAX_INPUT_TOKENS,
    true,
  );
  assertEquals(estimateEmbeddingTokens("漢".repeat(8_000)) >= 6_999, true);
  assertEquals(estimateEmbeddingTokens(""), 1);
});

function fakeLedger(reserveAnswer: {
  data: unknown;
  error: { message: string } | null;
}) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const ledger: LedgerClient = {
    rpc(fn, args) {
      calls.push({ fn, args });
      if (fn === "reserve_llm_credits_in_period")
        return Promise.resolve(reserveAnswer);
      return Promise.resolve({ data: null, error: null });
    },
  };
  return { ledger, calls };
}

const VECTOR: EmbeddingResult = {
  embedding: new Array(EMBEDDING_DIMENSIONS).fill(0),
  provider: "openai",
  model: "text-embedding-3-small",
  promptTokens: 4,
  totalTokens: 4,
};

Deno.test(
  "an embedding is reserved first and settled against the reservation",
  async () => {
    const { ledger, calls } = fakeLedger({ data: "period-a", error: null });
    const out = await embedAndCharge(ledger, "user-1", "some text", {
      feature: "embedding",
      metadata: { itemType: null },
      embed: () => Promise.resolve(VECTOR),
    });
    assertEquals(out.ok, true);
    assertEquals(
      calls.map((c) => c.fn),
      ["reserve_llm_credits_in_period", "record_llm_usage"],
    );
    const reserved = calls[0].args.p_tokens as number;
    assertEquals(reserved, estimateEmbeddingTokens("some text"));
    assertEquals(calls[1].args.p_reserved_tokens, reserved);
    assertEquals(calls[1].args.p_period_id, "period-a");
    assertEquals(calls[1].args.p_total_tokens, 4);
    assertEquals(calls[1].args.p_user_id, "user-1");
  },
);

Deno.test(
  "a balance that cannot hold the reservation pays for nothing",
  async () => {
    const { ledger, calls } = fakeLedger({ data: null, error: null });
    let embedded = false;
    const out = await embedAndCharge(ledger, "user-1", "some text", {
      feature: "embedding",
      embed: () => {
        embedded = true;
        return Promise.resolve(VECTOR);
      },
    });
    assertEquals(out, {
      ok: false,
      reason: "credits_exhausted",
      detail: "reservation refused",
    });
    assertEquals(embedded, false);
    assertEquals(
      calls.map((c) => c.fn),
      ["reserve_llm_credits_in_period"],
    );
  },
);

Deno.test("a ledger that cannot be read fails closed", async () => {
  const { ledger } = fakeLedger({ data: null, error: { message: "boom" } });
  let embedded = false;
  const out = await embedAndCharge(ledger, "user-1", "some text", {
    feature: "embedding",
    embed: () => {
      embedded = true;
      return Promise.resolve(VECTOR);
    },
  });
  assertEquals(out.ok, false);
  if (!out.ok) assertEquals(out.reason, "credit_check_failed");
  assertEquals(embedded, false);
});

Deno.test("a provider failure hands the reservation back", async () => {
  const { ledger, calls } = fakeLedger({ data: "period-a", error: null });
  const out = await embedAndCharge(ledger, "user-1", "some text", {
    feature: "embedding",
    embed: () => Promise.reject(new Error("429 no credits")),
  });
  assertEquals(out.ok, false);
  if (!out.ok) assertEquals(out.reason, "provider_failed");
  assertEquals(
    calls.map((c) => c.fn),
    ["reserve_llm_credits_in_period", "release_llm_credits"],
  );
  assertEquals(calls[1].args.p_tokens, calls[0].args.p_tokens);
});

Deno.test(
  "a provider that never answers is abandoned for the next one",
  async () => {
    const hanging = (_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(init.signal!.reason),
        );
      });
    const answering = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [{ embedding: new Array(EMBEDDING_DIMENSIONS).fill(0.5) }],
            usage: { prompt_tokens: 3, total_tokens: 3 },
            model: "openai/text-embedding-3-small",
          }),
          { status: 200 },
        ),
      );
    const fetchImpl = ((url: string | URL | Request, init?: RequestInit) =>
      String(url).includes("first")
        ? hanging(url, init)
        : answering()) as typeof fetch;

    const result = await createEmbedding("hello", {
      providers: [
        {
          name: "first",
          url: "https://first.example/embeddings",
          apiKey: "k",
          model: "m",
        },
        {
          name: "second",
          url: "https://second.example/embeddings",
          apiKey: "k",
          model: "m",
        },
      ],
      fetchImpl,
      timeoutMs: 20,
    });
    assertEquals(result.provider, "second");
    assertEquals(result.totalTokens, 3);
  },
);
