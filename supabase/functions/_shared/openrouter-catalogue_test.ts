// The whole nightly job reduced to functions with no network and no database,
// because the parts that can quietly ruin a Saturday morning are all decisions
// rather than I/O: what counts as a price, what counts as retired, and when to
// refuse to act at all.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  diffCatalogue,
  isPlausible,
  mapModel,
  type CatalogueModel,
  type StoredModel,
} from "./openrouter-catalogue.ts";

// Shapes taken from the live catalogue on 2026-08-26, trimmed to the fields
// this module reads. Inline rather than a fixture file because `deno test`
// runs with no --allow-read.
const GEMINI_FLASH_LITE = {
  id: "google/gemini-3.1-flash-lite",
  name: "Google: Gemini 3.1 Flash Lite",
  context_length: 1048576,
  pricing: { prompt: "0.00000025", completion: "0.0000015" },
  architecture: {
    input_modalities: ["text", "image"],
    output_modalities: ["text"],
  },
  supported_parameters: ["tools", "tool_choice", "max_tokens", "temperature"],
  expiration_date: null,
};

// openrouter/auto quotes -1 per token, which is a sentinel for "depends which
// model it picks", not a price of minus one million dollars.
const AUTO = {
  id: "openrouter/auto",
  name: "Auto Router",
  context_length: 2000000,
  pricing: { prompt: "-1", completion: "-1" },
  architecture: { input_modalities: ["text"], output_modalities: ["text"] },
  supported_parameters: ["tools", "tool_choice"],
  expiration_date: null,
};

const IMAGE_MODEL = {
  id: "google/gemini-3.1-flash-lite-image",
  name: "Google: Nano Banana 2 Lite",
  context_length: 65536,
  pricing: { prompt: "0.00000025", completion: "0.0000015" },
  architecture: {
    input_modalities: ["image", "text"],
    output_modalities: ["image", "text"],
  },
  supported_parameters: ["max_tokens", "temperature", "seed"],
  expiration_date: "2026-12-31",
};

/** mapModel, with the "has an id" case asserted once instead of in every test. */
function mapped(raw: Parameters<typeof mapModel>[0]): CatalogueModel {
  const m = mapModel(raw);
  if (!m)
    throw new Error(`mapModel refused ${JSON.stringify(raw).slice(0, 80)}`);
  return m;
}

// ── mapModel ────────────────────────────────────────────────────────────────

Deno.test("mapModel: per-token prices become per-million", () => {
  const m = mapped(GEMINI_FLASH_LITE);
  assertEquals(m.prompt_price_per_m, 0.25);
  assertEquals(m.completion_price_per_m, 1.5);
});

// The label in llm-registry.ts said $0.05/$0.10 for deepseek three days after
// it was written, when the catalogue said $0.08/$0.15. Reading the number is
// the entire point, so getting the multiplier wrong would be a silent lie in a
// dropdown that exists to show cost.
Deno.test("mapModel: a price is read, never rounded away", () => {
  const m = mapped({
    ...GEMINI_FLASH_LITE,
    id: "deepseek/deepseek-v4-flash",
    pricing: { prompt: "0.00000008", completion: "0.00000015" },
  });
  assertEquals(m.prompt_price_per_m, 0.08);
  assertEquals(m.completion_price_per_m, 0.15);
});

Deno.test("mapModel: a negative price is not a price", () => {
  const m = mapped(AUTO);
  assertEquals(m.prompt_price_per_m, null);
  assertEquals(m.completion_price_per_m, null);
});

Deno.test("mapModel: a missing price block is not a price either", () => {
  const m = mapped({ ...GEMINI_FLASH_LITE, pricing: undefined });
  assertEquals(m.prompt_price_per_m, null);
  assertEquals(m.completion_price_per_m, null);
});

// Eleven of the seventeen call sites send a tools array. A model without tool
// support does not error on one, it answers in prose and the JSON parse fails
// somewhere downstream, which is the worst way to find out.
Deno.test("mapModel: tool support is read from supported_parameters", () => {
  assertEquals(mapped(GEMINI_FLASH_LITE).supports_tools, true);
  assertEquals(mapped(IMAGE_MODEL).supports_tools, false);
});

Deno.test("mapModel: modalities and context length survive the trip", () => {
  const m = mapped(IMAGE_MODEL);
  assertEquals(m.input_modalities, ["image", "text"]);
  assertEquals(m.output_modalities, ["image", "text"]);
  assertEquals(m.context_length, 65536);
  assertEquals(m.expiration_date, "2026-12-31");
});

Deno.test(
  "mapModel: a model with no id is refused rather than stored blank",
  () => {
    assertEquals(mapModel({ name: "nameless" }), null);
  },
);

// ── isPlausible ─────────────────────────────────────────────────────────────
//
// The rail. Without it, one truncated response at twenty past four retires the
// whole catalogue and disables every AI call in the app, and the first person
// to notice is a user.

Deno.test("isPlausible: a normal catalogue is plausible", () => {
  assert(isPlausible(417, 342));
});

Deno.test("isPlausible: growth is always plausible", () => {
  assert(isPlausible(900, 342));
});

Deno.test("isPlausible: a small honest shrink is plausible", () => {
  assert(isPlausible(400, 417));
});

Deno.test("isPlausible: losing more than half the catalogue is not", () => {
  assertEquals(isPlausible(200, 417), false);
  assertEquals(isPlausible(0, 417), false);
});

Deno.test(
  "isPlausible: the very first run has nothing to compare against",
  () => {
    assert(isPlausible(417, 0));
  },
);

Deno.test("isPlausible: an empty first run is still refused", () => {
  assertEquals(isPlausible(0, 0), false);
});

// ── diffCatalogue ───────────────────────────────────────────────────────────

function stored(over: Partial<StoredModel> = {}): StoredModel {
  return {
    provider: "openrouter",
    model_id: "google/gemini-3.1-flash-lite",
    supports_tools: true,
    retired_at: null,
    ...over,
  };
}

function fetched(over: Partial<CatalogueModel> = {}): CatalogueModel {
  return { ...mapped(GEMINI_FLASH_LITE), ...over };
}

Deno.test("diffCatalogue: a model we have never seen is added", () => {
  const d = diffCatalogue([], [fetched()]);
  assertEquals(
    d.added.map((m: CatalogueModel) => m.model_id),
    ["google/gemini-3.1-flash-lite"],
  );
  assertEquals(d.retired, []);
});

Deno.test("diffCatalogue: a model that stopped being listed is retired", () => {
  const d = diffCatalogue(
    [stored({ model_id: "vendor/gone" }), stored()],
    [fetched()],
  );
  assertEquals(d.retired, ["vendor/gone"]);
});

Deno.test("diffCatalogue: a model already retired is not retired twice", () => {
  const gone = stored({
    model_id: "vendor/gone",
    retired_at: "2026-08-01T00:00:00Z",
  });
  const d = diffCatalogue([gone], []);
  assertEquals(d.retired, []);
});

// A model can come back. OpenRouter drops and restores ids, and a row left
// marked retired would keep the admin page shouting about it forever.
Deno.test("diffCatalogue: a model that came back is un-retired", () => {
  const back = stored({ retired_at: "2026-08-01T00:00:00Z" });
  const d = diffCatalogue([back], [fetched()]);
  assertEquals(d.unretired, ["google/gemini-3.1-flash-lite"]);
  assertEquals(d.retired, []);
});

Deno.test("diffCatalogue: losing tool support is reported on its own", () => {
  const d = diffCatalogue([stored()], [fetched({ supports_tools: false })]);
  assertEquals(d.lostTools, ["google/gemini-3.1-flash-lite"]);
  assertEquals(d.retired, []);
});

Deno.test("diffCatalogue: gaining tool support is not an alert", () => {
  const d = diffCatalogue([stored({ supports_tools: false })], [fetched()]);
  assertEquals(d.lostTools, []);
});

Deno.test(
  "diffCatalogue: one provider's catalogue never retires another's",
  () => {
    const openai = stored({ provider: "openai", model_id: "gpt-4o-mini" });
    const d = diffCatalogue([openai, stored()], [fetched()]);
    assertEquals(d.retired, []);
  },
);
