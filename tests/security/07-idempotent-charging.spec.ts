// record_llm_usage is where money is actually deducted. It is called on a
// best-effort path (llm.ts swallows its errors), retries are ordinary, and the
// only thing standing between a retry and a double charge is the unique index
// on (user_id, idempotency_key) plus the row_count guard around the UPDATE.
//
// That guard is one `get diagnostics` away from being deleted by accident, and
// nothing else in the system would notice. Hence this test.

import { test, expect } from "@playwright/test";
import { restAsService, signInTestUser } from "./helpers/api";
import { activeAllowance } from "./helpers/fixtures";

const CHARGE_TOKENS = 4000;

interface UsageEvent {
  id: string;
  total_tokens: number;
}

async function recordUsage(userId: string, idempotencyKey: string) {
  return restAsService("rpc/record_llm_usage", {
    method: "POST",
    body: {
      p_user_id: userId,
      p_idempotency_key: idempotencyKey,
      p_feature: "security-suite",
      p_provider: "security-suite",
      p_model: "security-suite",
      p_prompt_tokens: CHARGE_TOKENS / 2,
      p_completion_tokens: CHARGE_TOKENS / 2,
      p_total_tokens: CHARGE_TOKENS,
      p_metadata: { source: "security suite", safe_to_delete: true },
    },
  });
}

test.describe("Charging the same work twice", () => {
  test("the same idempotency key deducts once, however many times it arrives", async () => {
    const { userId } = await signInTestUser();
    const key = `security-suite-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const before = await activeAllowance();

    try {
      const first = await recordUsage(userId, key);
      expect(first.ok, `first charge failed: ${JSON.stringify(first.error)}`).toBe(true);

      const afterFirst = await activeAllowance();
      expect(afterFirst.tokens_used - before.tokens_used).toBe(CHARGE_TOKENS);

      // The retry. Three more times, because "twice" is the cheap case.
      for (let i = 0; i < 3; i++) {
        const repeat = await recordUsage(userId, key);
        expect(repeat.ok, `retry ${i + 1} errored: ${JSON.stringify(repeat.error)}`).toBe(true);
      }

      const afterRetries = await activeAllowance();
      expect(
        afterRetries.tokens_used - before.tokens_used,
        "a retried charge must still cost exactly one charge",
      ).toBe(CHARGE_TOKENS);

      const events = await restAsService<UsageEvent[]>(
        `llm_usage_events?user_id=eq.${userId}&idempotency_key=eq.${key}&select=id,total_tokens`,
      );
      expect(events.data?.length, "exactly one usage event is on record").toBe(1);
    } finally {
      await restAsService(`llm_usage_events?user_id=eq.${userId}&idempotency_key=eq.${key}`, {
        method: "DELETE",
      });
      await restAsService(`ai_allowance_periods?id=eq.${before.id}`, {
        method: "PATCH",
        body: { tokens_used: before.tokens_used },
        headers: { Prefer: "return=minimal" },
      });
    }
  });

  test("two different keys are two charges", async () => {
    // The complement. Without it, "never deduct anything" would pass the test
    // above and lose all the money instead of double-charging it.
    const { userId } = await signInTestUser();
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const keys = [`security-suite-a-${stamp}`, `security-suite-b-${stamp}`];
    const before = await activeAllowance();

    try {
      for (const key of keys) {
        const res = await recordUsage(userId, key);
        expect(res.ok, `charge ${key} failed: ${JSON.stringify(res.error)}`).toBe(true);
      }

      const after = await activeAllowance();
      expect(after.tokens_used - before.tokens_used).toBe(CHARGE_TOKENS * 2);
    } finally {
      for (const key of keys) {
        await restAsService(`llm_usage_events?user_id=eq.${userId}&idempotency_key=eq.${key}`, {
          method: "DELETE",
        });
      }
      await restAsService(`ai_allowance_periods?id=eq.${before.id}`, {
        method: "PATCH",
        body: { tokens_used: before.tokens_used },
        headers: { Prefer: "return=minimal" },
      });
    }
  });

  test("record_llm_usage is not callable by an ordinary user", async () => {
    // It was revoked from anon and authenticated in a later migration. If that
    // revoke is ever lost, a user could zero their own meter by hand.
    const { userId } = await signInTestUser();
    const { restAsUser } = await import("./helpers/api");
    const res = await restAsUser("rpc/record_llm_usage", {
      method: "POST",
      body: {
        p_user_id: userId,
        p_idempotency_key: `should-never-land-${Date.now()}`,
        p_feature: "security-suite",
        p_provider: "security-suite",
        p_model: "security-suite",
        p_prompt_tokens: 0,
        p_completion_tokens: 0,
        p_total_tokens: 0,
        p_metadata: {},
      },
    });
    expect(res.ok, "an ordinary user must not be able to write the meter").toBe(false);
  });
});
