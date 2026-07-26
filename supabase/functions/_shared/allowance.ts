// Shared, idempotent AI-allowance provisioning.
//
// Mirrors the logic of the `ensure-token-allowance` edge function so that any
// AI feature can provision a user's allowance period on demand instead of
// failing with a false "out of credits" error. The insert is idempotent: it
// upserts on the (user_id, period_start, period_end) unique constraint and
// falls back to re-reading the existing row on conflict.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface AllowanceRow {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  tokens_granted: number;
  tokens_used: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface EnsureAllowanceResult {
  created: boolean;
  allowance: AllowanceRow | null;
}

export function getCurrentMonthPeriod(): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)),
  };
}

export async function getActiveAllowance(
  sb: SupabaseClient,
  userId: string,
): Promise<AllowanceRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("ai_allowance_periods")
    .select("*")
    .eq("user_id", userId)
    .lte("period_start", now)
    .gt("period_end", now)
    .maybeSingle();
  if (error) throw new Error(`Failed to check active allowance: ${error.message}`);
  return data as AllowanceRow | null;
}

async function getSettings(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("ai_credit_settings")
    .select("key, value_int")
    .in("key", ["tokens_per_credit", "credits_free_per_month", "credits_premium_per_month"]);
  if (error) throw new Error(`Failed to fetch token settings: ${error.message}`);
  const s: Record<string, number> = {};
  for (const row of data ?? []) s[(row as { key: string }).key] = (row as { value_int: number }).value_int;
  return {
    tokensPerCredit: s["tokens_per_credit"] ?? 200,
    creditsFreePerMonth: s["credits_free_per_month"] ?? 0,
    creditsPremiumPerMonth: s["credits_premium_per_month"] ?? 1500,
  };
}

/**
 * Insert an allowance period idempotently. If a row already exists for the
 * same (user_id, period_start, period_end), the existing row is returned.
 */
export async function upsertAllowancePeriod(
  sb: SupabaseClient,
  userId: string,
  opts: {
    periodStart: Date;
    periodEnd: Date;
    baseTokensGranted: number;
    rolloverTokens?: number;
    source: string;
    createdBy?: string;
  },
): Promise<{ created: boolean; allowance: AllowanceRow }> {
  const rolloverTokens = opts.rolloverTokens ?? 0;
  const payload = {
    user_id: userId,
    period_start: opts.periodStart.toISOString(),
    period_end: opts.periodEnd.toISOString(),
    tokens_granted: opts.baseTokensGranted + rolloverTokens,
    tokens_used: 0,
    source: opts.source,
    metadata: {
      created_by: opts.createdBy ?? "ensure-token-allowance",
      created_at: new Date().toISOString(),
      rollover_tokens: rolloverTokens,
      base_tokens: opts.baseTokensGranted,
    },
  };

  const { data, error } = await sb
    .from("ai_allowance_periods")
    .insert(payload)
    .select()
    .single();

  if (!error) return { created: true, allowance: data as AllowanceRow };

  // 23505 = unique_violation → another concurrent call already created it.
  const isDuplicate =
    (error as { code?: string }).code === "23505" ||
    /duplicate key value/i.test(error.message ?? "");

  if (!isDuplicate) {
    throw new Error(`Failed to create allowance period: ${error.message}`);
  }

  const { data: existing, error: readError } = await sb
    .from("ai_allowance_periods")
    .select("*")
    .eq("user_id", userId)
    .eq("period_start", payload.period_start)
    .eq("period_end", payload.period_end)
    .maybeSingle();

  if (readError || !existing) {
    throw new Error(
      `Failed to read existing allowance period after conflict: ${readError?.message ?? "not found"}`,
    );
  }
  return { created: false, allowance: existing as AllowanceRow };
}

/**
 * Ensure the user has an active allowance period, creating the plan-appropriate
 * one (with rollover from the last expired period) when missing. Safe to call
 * concurrently and repeatedly.
 */
export async function ensureAllowance(
  sb: SupabaseClient,
  userId: string,
  opts?: {
    periodStart?: Date;
    periodEnd?: Date;
    source?: string;
    forceTokens?: number;
    skipRollover?: boolean;
    createdBy?: string;
  },
): Promise<EnsureAllowanceResult> {
  const existing = await getActiveAllowance(sb, userId);
  if (existing) return { created: false, allowance: existing };

  const settings = await getSettings(sb);

  const { data: profile } = await sb
    .from("profiles")
    .select("plan_type")
    .eq("id", userId)
    .maybeSingle();
  const planType = (profile as { plan_type?: string } | null)?.plan_type ?? "free";

  const baseTokensGranted =
    opts?.forceTokens !== undefined
      ? opts.forceTokens
      : (planType === "premium" ? settings.creditsPremiumPerMonth : settings.creditsFreePerMonth) *
        settings.tokensPerCredit;

  const source = opts?.source ?? (planType === "premium" ? "subscription" : "free_tier");

  let rolloverTokens = 0;
  if (!opts?.skipRollover) {
    const now = new Date().toISOString();
    const { data: previous } = await sb
      .from("ai_allowance_periods")
      .select("*")
      .eq("user_id", userId)
      .lt("period_end", now)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    const prev = previous as AllowanceRow | null;
    if (prev) {
      const remaining = Number(prev.tokens_granted) - Number(prev.tokens_used);
      rolloverTokens = Math.min(Math.max(remaining, 0), baseTokensGranted);
    }
  }

  const { periodStart: defaultStart, periodEnd: defaultEnd } = getCurrentMonthPeriod();

  return await upsertAllowancePeriod(sb, userId, {
    periodStart: opts?.periodStart ?? defaultStart,
    periodEnd: opts?.periodEnd ?? defaultEnd,
    baseTokensGranted,
    rolloverTokens,
    source,
    createdBy: opts?.createdBy,
  });
}
