import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { freeShareOfTokens, normalizeUsageRow, summarizeUsage, type UsageGroup } from "./llm-usage-summary.ts";

function group(over: Partial<UsageGroup> = {}): UsageGroup {
  return {
    call_site: "prompt-coach",
    caller_role: "free",
    is_machine: false,
    config_source: "db-default",
    calls: 1,
    prompt_tokens: 100,
    completion_tokens: 20,
    credits: 0.5,
    users: 1,
    last_call_at: "2026-08-23T10:00:00Z",
    ...over,
  };
}

Deno.test("summarizeUsage: rows for one call site collapse into a single entry", () => {
  const { call_sites } = summarizeUsage([
    group({ caller_role: "free", calls: 2, prompt_tokens: 100, completion_tokens: 20 }),
    group({ caller_role: "admin", calls: 3, prompt_tokens: 300, completion_tokens: 30 }),
  ], []);

  assertEquals(call_sites.length, 1);
  assertEquals(call_sites[0].call_site, "prompt-coach");
  assertEquals(call_sites[0].calls, 5);
  assertEquals(call_sites[0].total_tokens, 450);
});

Deno.test("summarizeUsage: premium_gift counts as paying, admin never does", () => {
  const { call_sites } = summarizeUsage([
    group({ caller_role: "premium_gift", calls: 2 }),
    group({ caller_role: "premium", calls: 3 }),
    group({ caller_role: "admin", calls: 40 }),
  ], []);

  const callers = call_sites[0].by_caller;
  assertEquals(callers.find((c) => c.caller === "premium")?.calls, 5);
  // Michael's own testing is 94% of this ledger. Folding admin into premium,
  // which is what mapRoleToTier does for routing, would hide that entirely and
  // make the panel report a thriving paid tier that does not exist.
  assertEquals(callers.find((c) => c.caller === "admin")?.calls, 40);
});

Deno.test("summarizeUsage: an account with no role row counts as free", () => {
  const { call_sites } = summarizeUsage([
    group({ caller_role: null, is_machine: false, calls: 7 }),
  ], []);

  assertEquals(call_sites[0].by_caller[0].caller, "free");
  assertEquals(call_sites[0].by_caller[0].calls, 7);
});

Deno.test("summarizeUsage: a call with no user is machine traffic, not free", () => {
  const { call_sites } = summarizeUsage([
    group({ caller_role: null, is_machine: true, calls: 106 }),
  ], []);

  // The embedding backfill is 106 of the 300 calls on record. Counting it as
  // free usage would answer the tiering question with cron traffic.
  assertEquals(call_sites[0].by_caller[0].caller, "machine");
});

Deno.test("summarizeUsage: a ledger row written before config_source existed says so", () => {
  const { call_sites } = summarizeUsage([
    group({ config_source: null, calls: 288 }),
    group({ config_source: "db-default", calls: 12 }),
  ], []);

  const sources = call_sites[0].by_source;
  // 288 of the 300 rows on record predate the config layer. Showing them as
  // "db-default" would be a guess, and hiding them would lose 96% of the ledger.
  assertEquals(sources.find((s) => s.source === "not recorded")?.calls, 288);
  assertEquals(sources.find((s) => s.source === "db-default")?.calls, 12);
});

Deno.test("summarizeUsage: a configured call site nobody has used still appears", () => {
  const { call_sites } = summarizeUsage(
    [group({ call_site: "prompt-coach", calls: 4 })],
    ["prompt-coach", "canvas-ai"],
  );

  const dormant = call_sites.find((c) => c.call_site === "canvas-ai");
  assertEquals(dormant?.calls, 0);
  assertEquals(dormant?.by_caller, []);
});

Deno.test("summarizeUsage: the most expensive call site is first, dormant ones last", () => {
  const { call_sites } = summarizeUsage([
    group({ call_site: "cheap", prompt_tokens: 10, completion_tokens: 0 }),
    group({ call_site: "dear", prompt_tokens: 9000, completion_tokens: 0 }),
  ], ["cheap", "dear", "unused"]);

  assertEquals(call_sites.map((c) => c.call_site), ["dear", "cheap", "unused"]);
});

Deno.test("summarizeUsage: totals add up across every call site", () => {
  const { totals } = summarizeUsage([
    group({ call_site: "a", calls: 2, prompt_tokens: 100, completion_tokens: 10, credits: 1.5 }),
    group({ call_site: "b", calls: 3, prompt_tokens: 200, completion_tokens: 20, credits: 2.25 }),
  ], []);

  assertEquals(totals.calls, 5);
  assertEquals(totals.prompt_tokens, 300);
  assertEquals(totals.completion_tokens, 30);
  assertEquals(totals.total_tokens, 330);
  assertEquals(totals.credits, 3.75);
});

Deno.test("summarizeUsage: callers are also totalled across call sites", () => {
  const { by_caller } = summarizeUsage([
    group({ call_site: "a", caller_role: "free", calls: 2 }),
    group({ call_site: "b", caller_role: "free", calls: 3 }),
    group({ call_site: "b", caller_role: "admin", calls: 9 }),
  ], []);

  assertEquals(by_caller.find((c) => c.caller === "free")?.calls, 5);
  assertEquals(by_caller.find((c) => c.caller === "admin")?.calls, 9);
});

Deno.test("freeShareOfTokens: an empty ledger is zero, never a NaN on screen", () => {
  assertEquals(freeShareOfTokens(summarizeUsage([], ["prompt-coach"])), 0);
});

Deno.test("freeShareOfTokens: the share is of every token the app spent", () => {
  const summary = summarizeUsage([
    group({ caller_role: "free", prompt_tokens: 250, completion_tokens: 0 }),
    group({ caller_role: "admin", prompt_tokens: 750, completion_tokens: 0 }),
  ], []);

  assertEquals(freeShareOfTokens(summary), 0.25);
});

Deno.test("normalizeUsageRow: a bigint arrives from Postgres as a string, not a number", () => {
  // Postgres serialises bigint and numeric as JSON strings. Left alone, the
  // first `calls + calls` in summarizeUsage would produce "22" instead of 4.
  const row = normalizeUsageRow({
    call_site: "prompt-coach",
    caller_role: "free",
    is_machine: false,
    config_source: "db-default",
    calls: "22",
    prompt_tokens: "1000",
    completion_tokens: "200",
    credits: "3.75",
    users: "2",
    last_call_at: "2026-08-23T10:00:00Z",
  });

  assertEquals(row.calls, 22);
  assertEquals(row.prompt_tokens, 1000);
  assertEquals(row.credits, 3.75);
  assertEquals(row.users, 2);
});

Deno.test("normalizeUsageRow: a missing number is zero and a missing call site is named", () => {
  const row = normalizeUsageRow({ caller_role: null, is_machine: true });

  assertEquals(row.call_site, "(unnamed)");
  assertEquals(row.calls, 0);
  assertEquals(row.credits, 0);
  assertEquals(row.config_source, null);
  assertEquals(row.last_call_at, null);
});

Deno.test("summarizeUsage: a name the config table does not carry is flagged, not mixed in", () => {
  // The ledger holds both "prompt-coach" (today's call site) and "Prompt Coach"
  // (the old n8n workflow name for the same thing). They cannot be merged: the
  // transform works for that pair and not for "Suggest Prompt Metadata", whose
  // call site is now "suggest-metadata". A half-merge that looks whole is worse
  // than none, so the panel says which names are configured and which are
  // history instead of pretending they are one list.
  const { call_sites } = summarizeUsage([
    group({ call_site: "prompt-coach" }),
    group({ call_site: "Prompt Coach" }),
  ], ["prompt-coach", "canvas-ai"]);

  const byName = new Map(call_sites.map((c) => [c.call_site, c]));
  assertEquals(byName.get("prompt-coach")?.is_configured, true);
  assertEquals(byName.get("Prompt Coach")?.is_configured, false);
  // A configured call site nobody has used is still configured.
  assertEquals(byName.get("canvas-ai")?.is_configured, true);
});
