import { supabase } from "@/integrations/supabase/client";

export interface AllowanceTokens {
  tokens_granted: number;
  tokens_used: number;
}

interface AdjustAllowanceArgs {
  allowanceId: string;
  /** Kept for the callers; the database reads the user from the period. */
  userId?: string;
  displayName?: string | null;
  /** Kept for the callers; the database takes the admin from the login. */
  adminId?: string;
  /** Change to tokens_granted, relative to the row as it is now. */
  grantedDelta: number;
  /** Change to tokens_used, relative to the row as it is now. */
  usedDelta: number;
  /** Which admin control made the change, recorded with it. */
  via: "token_modal" | "inline_balance";
}

export interface AdjustAllowanceResult {
  previous: AllowanceTokens;
  next: AllowanceTokens;
  /** Always true since 2026-10-07: the record is written with the change. */
  audited: boolean;
}

/**
 * Apply an admin's balance change as a delta on the row as it is in the
 * database right now, never as absolute values from the admin's screen.
 *
 * The admin panels used to write absolute tokens_used / tokens_granted taken
 * from a snapshot loaded when the page opened, which silently erased any AI
 * call the user made in between. Until 2026-10-07 this then re-read the row
 * and wrote with a compare-and-retry loop, and inserted an audit row into
 * llm_usage_events, which the browser may not write: every change went
 * unrecorded. admin_adjust_allowance (migration 20261007121300) now locks the
 * row, applies the delta and records the change in one transaction.
 */
export async function adjustAllowance({
  allowanceId,
  grantedDelta,
  usedDelta,
  via,
}: AdjustAllowanceArgs): Promise<AdjustAllowanceResult> {
  const { data, error } = await supabase.rpc("admin_adjust_allowance", {
    p_allowance_id: allowanceId,
    p_granted_delta: Math.trunc(grantedDelta),
    p_used_delta: Math.trunc(usedDelta),
    p_via: via,
  });
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        previous_tokens_granted: number | string;
        previous_tokens_used: number | string;
        new_tokens_granted: number | string;
        new_tokens_used: number | string;
      }
    | undefined;
  if (!row) throw new Error("The balance change returned nothing.");

  return {
    previous: {
      tokens_granted: Number(row.previous_tokens_granted) || 0,
      tokens_used: Number(row.previous_tokens_used) || 0,
    },
    next: {
      tokens_granted: Number(row.new_tokens_granted) || 0,
      tokens_used: Number(row.new_tokens_used) || 0,
    },
    audited: true,
  };
}
