// Turning the ledger's grouped rows into something a person can read.
//
// The SQL side groups; this side classifies and reshapes. Kept apart so the
// interesting decisions (who counts as a paying caller, what an unrecorded
// config source is called) are testable without a database.

/** One row as `admin_llm_usage_summary` returns it. */
export interface UsageGroup {
  call_site: string;
  caller_role: string | null;
  is_machine: boolean;
  config_source: string | null;
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  credits: number;
  users: number;
  last_call_at: string | null;
}

/**
 * Who made the call, for the purpose of deciding what it costs.
 *
 * Deliberately NOT the same buckets as `mapRoleToTier` in llm-config.ts. That
 * function answers "which config row should serve this call" and puts admins in
 * with premium, which is right for routing. Here the question is "who is costing
 * money", and an admin is the operator testing his own app.
 */
export type CallerBucket = "free" | "premium" | "admin" | "machine";

/** Fixed render order, so the badges do not reshuffle between loads. */
const CALLER_ORDER: CallerBucket[] = ["free", "premium", "admin", "machine"];

export function classifyCaller(
  role: string | null,
  isMachine: boolean,
): CallerBucket {
  if (isMachine) return "machine";
  if (role === "admin") return "admin";
  if (role === "premium" || role === "premium_gift") return "premium";
  // Everything unrecognised, and every account with no role row at all, is free.
  return "free";
}

/**
 * One row as the database actually hands it over.
 *
 * Postgres serialises bigint and numeric as JSON strings, so every count and
 * every token sum arrives as text. Coercing here, once, is what stops
 * `calls + calls` quietly producing "22" instead of 4.
 */
export function normalizeUsageRow(raw: Record<string, unknown>): UsageGroup {
  const num = (v: unknown): number => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const text = (v: unknown): string | null =>
    typeof v === "string" && v.length > 0 ? v : null;

  return {
    call_site: text(raw.call_site) ?? "(unnamed)",
    caller_role: text(raw.caller_role),
    is_machine: raw.is_machine === true,
    config_source: text(raw.config_source),
    calls: num(raw.calls),
    prompt_tokens: num(raw.prompt_tokens),
    completion_tokens: num(raw.completion_tokens),
    credits: num(raw.credits),
    users: num(raw.users),
    last_call_at: text(raw.last_call_at),
  };
}

export interface CallerUsage {
  caller: CallerBucket;
  calls: number;
  total_tokens: number;
  users: number;
}

/**
 * What a null config_source is called on screen.
 *
 * Every row logged before the configuration layer shipped has none, so this is
 * most of the ledger for a while yet. Naming it beats guessing it.
 */
export const SOURCE_NOT_RECORDED = "not recorded";

export interface SourceUsage {
  source: string;
  calls: number;
}

export interface CallSiteUsage {
  call_site: string;
  calls: number;
  total_tokens: number;
  /**
   * Whether this name is a call site the configuration table carries today.
   *
   * False covers two different things, which is why the panel says "not
   * configured" rather than naming either one:
   *
   *   - A name that only exists in the ledger's history. The older logging wrote
   *     `workflow_name` ("Prompt Coach") where the current code writes `feature`
   *     ("prompt-coach"). The two cannot be merged: the transform that pairs
   *     those turns "Suggest Prompt Metadata" into a call site that does not
   *     exist, since it is "suggest-metadata" now. Labelling beats a merge that
   *     is right about half the rows and silent about the rest.
   *   - A live feature that spends tokens without being a configurable call
   *     site, such as `embedding` and `embedding-backfill`. Those are current,
   *     not historical, and calling them old would be untrue.
   */
  is_configured: boolean;
  by_caller: CallerUsage[];
  by_source: SourceUsage[];
}

export interface UsageTotals {
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  credits: number;
}

export interface UsageSummary {
  call_sites: CallSiteUsage[];
  /** Every call site added together. */
  totals: UsageTotals;
  /** Every call site added together, split by who called it. */
  by_caller: CallerUsage[];
}

/**
 * Free callers' share of every token the app spent, 0 to 1.
 *
 * The denominator is all traffic, cron and admin included, because the question
 * this answers is what free users cost relative to the whole bill. An empty
 * ledger is 0, not a division by zero rendered as NaN in the panel.
 */
export function freeShareOfTokens(summary: UsageSummary): number {
  if (summary.totals.total_tokens === 0) return 0;
  const free =
    summary.by_caller.find((c) => c.caller === "free")?.total_tokens ?? 0;
  return free / summary.totals.total_tokens;
}

export function summarizeUsage(
  groups: UsageGroup[],
  knownCallSites: string[],
): UsageSummary {
  const bySite = new Map<string, CallSiteUsage>();
  const callers = new Map<string, Map<CallerBucket, CallerUsage>>();
  const sources = new Map<string, Map<string, SourceUsage>>();

  // Every call site the panel knows about starts at zero, so one that has never
  // been called reads as dormant rather than as missing.
  const configured = new Set(knownCallSites);
  for (const name of knownCallSites) {
    bySite.set(name, {
      call_site: name,
      calls: 0,
      total_tokens: 0,
      is_configured: true,
      by_caller: [],
      by_source: [],
    });
  }

  for (const g of groups) {
    const site = bySite.get(g.call_site) ?? {
      call_site: g.call_site,
      calls: 0,
      total_tokens: 0,
      is_configured: configured.has(g.call_site),
      by_caller: [],
      by_source: [],
    };
    const tokens = g.prompt_tokens + g.completion_tokens;
    site.calls += g.calls;
    site.total_tokens += tokens;
    bySite.set(g.call_site, site);

    const bucket = classifyCaller(g.caller_role, g.is_machine);
    const forSite =
      callers.get(g.call_site) ?? new Map<CallerBucket, CallerUsage>();
    const entry = forSite.get(bucket) ?? {
      caller: bucket,
      calls: 0,
      total_tokens: 0,
      users: 0,
    };
    entry.calls += g.calls;
    entry.total_tokens += tokens;
    entry.users += g.users;
    forSite.set(bucket, entry);
    callers.set(g.call_site, forSite);

    const label = g.config_source ?? SOURCE_NOT_RECORDED;
    const bySource = sources.get(g.call_site) ?? new Map<string, SourceUsage>();
    const seen = bySource.get(label) ?? { source: label, calls: 0 };
    seen.calls += g.calls;
    bySource.set(label, seen);
    sources.set(g.call_site, bySource);
  }

  for (const site of bySite.values()) {
    const forSite = callers.get(site.call_site);
    site.by_caller = CALLER_ORDER.map((c) => forSite?.get(c)).filter(
      (e): e is CallerUsage => e !== undefined,
    );
    site.by_source = [...(sources.get(site.call_site)?.values() ?? [])].sort(
      (a, b) => b.calls - a.calls,
    );
  }

  // Dearest first, because the reason to open this panel is to find what costs
  // money. Ties break by name so the order never depends on map insertion.
  const call_sites = [...bySite.values()].sort(
    (a, b) =>
      b.total_tokens - a.total_tokens || a.call_site.localeCompare(b.call_site),
  );

  const totals: UsageTotals = {
    calls: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    credits: 0,
  };
  const overall = new Map<CallerBucket, CallerUsage>();

  for (const g of groups) {
    totals.calls += g.calls;
    totals.prompt_tokens += g.prompt_tokens;
    totals.completion_tokens += g.completion_tokens;
    totals.credits += g.credits;

    const bucket = classifyCaller(g.caller_role, g.is_machine);
    const entry = overall.get(bucket) ?? {
      caller: bucket,
      calls: 0,
      total_tokens: 0,
      users: 0,
    };
    entry.calls += g.calls;
    entry.total_tokens += g.prompt_tokens + g.completion_tokens;
    entry.users += g.users;
    overall.set(bucket, entry);
  }
  totals.total_tokens = totals.prompt_tokens + totals.completion_tokens;

  const by_caller = CALLER_ORDER.map((c) => overall.get(c)).filter(
    (e): e is CallerUsage => e !== undefined,
  );

  return { call_sites, totals, by_caller };
}
