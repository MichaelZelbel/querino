import { supabase } from "@/integrations/supabase/client";

export interface AllowanceTokens {
  tokens_granted: number;
  tokens_used: number;
}

interface AdjustAllowanceArgs {
  allowanceId: string;
  userId: string;
  displayName?: string | null;
  adminId: string;
  /** Change to tokens_granted, relative to the row as it is now. */
  grantedDelta: number;
  /** Change to tokens_used, relative to the row as it is now. */
  usedDelta: number;
  /** Which admin control made the change, recorded in the audit event. */
  via: "token_modal" | "inline_balance";
}

export interface AdjustAllowanceResult {
  previous: AllowanceTokens;
  next: AllowanceTokens;
  /** False when the balance changed but the audit event could not be written. */
  audited: boolean;
}

const MAX_ATTEMPTS = 3;

/**
 * Apply an admin's balance change as a delta on the row as it is in the
 * database right now, never as absolute values from the admin's screen.
 *
 * The admin panels used to write absolute tokens_used / tokens_granted taken
 * from a snapshot loaded when the page opened. Any AI call the user made in
 * between was charged to tokens_used and then silently erased by the admin's
 * save. Here the row is re-read, the delta applied, and the write only lands
 * if the row still holds what was read (otherwise it is read again).
 * Every change writes the same audit event, whichever control made it.
 */
export async function adjustAllowance({
  allowanceId,
  userId,
  displayName = null,
  adminId,
  grantedDelta,
  usedDelta,
  via,
}: AdjustAllowanceArgs): Promise<AdjustAllowanceResult> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: current, error: readError } = await supabase
      .from("ai_allowance_periods")
      .select("tokens_granted, tokens_used")
      .eq("id", allowanceId)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) throw new Error("The allowance period no longer exists.");

    const previous: AllowanceTokens = {
      tokens_granted: Number(current.tokens_granted) || 0,
      tokens_used: Number(current.tokens_used) || 0,
    };
    let nextGranted = Math.max(previous.tokens_granted + grantedDelta, 0);
    let nextUsed = previous.tokens_used + usedDelta;
    if (nextUsed < 0) {
      // More remaining than the period grants: grant the difference.
      nextGranted += -nextUsed;
      nextUsed = 0;
    }
    const next: AllowanceTokens = {
      tokens_granted: nextGranted,
      tokens_used: nextUsed,
    };

    const { data: written, error: writeError } = await supabase
      .from("ai_allowance_periods")
      .update(next)
      .eq("id", allowanceId)
      .eq("tokens_granted", previous.tokens_granted)
      .eq("tokens_used", previous.tokens_used)
      .select("id");
    if (writeError) throw writeError;
    if (!written || written.length === 0) {
      // The row moved between the read and the write (a charge landed).
      continue;
    }

    const { error: logError } = await supabase.from("llm_usage_events").insert({
      user_id: userId,
      idempotency_key: `admin_adjustment_${allowanceId}_${Date.now()}`,
      feature: "admin_balance_adjustment",
      total_tokens: next.tokens_granted - previous.tokens_granted, // Net change in granted tokens
      prompt_tokens: 0,
      completion_tokens: 0,
      credits_charged: 0,
      metadata: {
        admin_id: adminId,
        admin_action: "balance_adjustment",
        admin_control: via,
        allowance_period_id: allowanceId,
        target_user_id: userId,
        target_display_name: displayName,
        previous_tokens_granted: previous.tokens_granted,
        new_tokens_granted: next.tokens_granted,
        tokens_granted_delta: next.tokens_granted - previous.tokens_granted,
        previous_tokens_used: previous.tokens_used,
        new_tokens_used: next.tokens_used,
        tokens_used_delta: next.tokens_used - previous.tokens_used,
        previous_remaining: previous.tokens_granted - previous.tokens_used,
        new_remaining: next.tokens_granted - next.tokens_used,
        adjusted_at: new Date().toISOString(),
      },
    });
    if (logError) {
      console.error("Failed to log admin adjustment:", logError);
    }

    return { previous, next, audited: !logError };
  }
  throw new Error(
    "The balance kept changing while saving. Reload and try again.",
  );
}
