// AI-allowance provisioning, in one place.
//
// This file used to be one of THREE implementations of the same rules
// (finding S4): here, again in ensure-token-allowance/index.ts, and a third
// time as the SQL function provision_ai_allowance. They had already drifted:
// only the two TypeScript copies carried unused tokens over from the previous
// month, and they disagreed with the SQL about the token-to-credit rate
// (finding M6), so what a user got depended on which path happened to run
// first.
//
// The implementation now lives in the database, in ensure_ai_allowance, where
// the transaction is: the read of the existing period, the rollover lookup and
// the insert are one statement's worth of work under one snapshot, and the
// overlap constraint can refuse a bad period rather than trusting the caller
// to have checked. Everything here is a thin caller.

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

/** The current calendar month in UTC, the same boundaries the SQL uses. */
export function getCurrentMonthPeriod(): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)),
  };
}

/** The user's active allowance period, or null. */
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

/**
 * Ensure the user has an active allowance period, creating the one their role
 * entitles them to when there is none. Idempotent, and safe to call
 * concurrently: a caller that loses the race gets the winner's period back
 * rather than an error.
 *
 * `forceTokens`, `periodStart`, `periodEnd` and `source` are administrative
 * overrides. Nothing here checks that: the check belongs at the front door of
 * whatever function is exposing them, because only that function knows who is
 * calling. ensure-token-allowance requires is_admin before it passes any of
 * them through.
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
  const { data, error } = await sb.rpc("ensure_ai_allowance", {
    _user_id: userId,
    _force_tokens: opts?.forceTokens ?? null,
    _period_start: opts?.periodStart?.toISOString() ?? null,
    _period_end: opts?.periodEnd?.toISOString() ?? null,
    _source: opts?.source ?? null,
    _skip_rollover: opts?.skipRollover ?? false,
    _created_by: opts?.createdBy ?? "ensureAllowance",
  });

  if (error) throw new Error(`Failed to ensure allowance: ${error.message}`);

  // The function returns a table, so supabase-js hands back an array of one.
  const row = (Array.isArray(data) ? data[0] : data) as
    | (AllowanceRow & { created: boolean })
    | undefined;

  if (!row) throw new Error("ensure_ai_allowance returned no row");

  const { created, ...allowance } = row;
  return { created, allowance: allowance as AllowanceRow };
}
