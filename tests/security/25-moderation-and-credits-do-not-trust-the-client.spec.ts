// The two larger findings of the 2026-09-16 audit that a REST client could
// walk around (godspeed decision D-214).
//
// Moderation. The only way into moderation_review_queue was the
// moderate-content edge function, called by the browser before it saved, and
// its client helper fails open. So anyone who flipped is_public with PostgREST
// was never reviewed. Migration 20260916140000 files the queue row from a
// trigger on the artifact itself, and these tests publish exactly the way that
// client would: PATCH, as the user, no edge function anywhere.
//
// Credits. The gate asked only for "more than zero tokens left", so one token
// bought twenty parallel calls. llm.ts now reserves an estimate in the
// database before it calls a provider, and refuses when it does not fit.
//
// Everything created here is removed again, and the balance is put back.

import { test, expect } from "@playwright/test";
import {
  asUser,
  callFunction,
  restAsService,
  restAsUser,
  signInTestUser,
} from "./helpers/api";
import { activeAllowance, setTokensUsed } from "./helpers/fixtures";

interface QueueRow {
  id: string;
  user_id: string;
  status: string;
  item_type: string;
}

async function queueRowsFor(itemId: string): Promise<QueueRow[]> {
  const res = await restAsService<QueueRow[]>(
    `moderation_review_queue?item_id=eq.${itemId}&select=id,user_id,status,item_type`,
  );
  if (!res.ok) {
    throw new Error(`reading the queue failed: ${JSON.stringify(res.error)}`);
  }
  return res.data ?? [];
}

test.describe("Publishing is moderated whoever does the publishing", () => {
  test("a prompt made public with a bare PATCH lands in the review queue", async () => {
    const { userId } = await signInTestUser();
    const marker = Date.now().toString(36);

    const created = await restAsUser<Array<{ id: string }>>("prompts", {
      method: "POST",
      body: {
        author_id: userId,
        title: `Security suite moderation probe ${marker}`,
        description:
          "Created and deleted by tests/security/25. Safe to delete.",
        content: "Summarise the following paragraph in one sentence.",
        category: "writing",
        is_public: false,
      },
      headers: { Prefer: "return=representation" },
    });
    expect(
      created.ok,
      `creating the probe prompt failed: ${JSON.stringify(created.error)}`,
    ).toBe(true);
    const id = created.data[0].id;

    try {
      expect(
        await queueRowsFor(id),
        "a private prompt is not queued",
      ).toHaveLength(0);

      const published = await restAsUser(`prompts?id=eq.${id}`, {
        method: "PATCH",
        body: { is_public: true },
      });
      expect(
        published.ok,
        `publishing failed: ${JSON.stringify(published.error)}`,
      ).toBe(true);

      const afterPublish = await queueRowsFor(id);
      expect(
        afterPublish.length,
        "publishing through PostgREST filed no review",
      ).toBeGreaterThanOrEqual(1);
      expect(afterPublish[0].user_id).toBe(userId);
      expect(afterPublish[0].item_type).toBe("prompt");

      // An edit while public files again, but never a second pending row.
      const edited = await restAsUser(`prompts?id=eq.${id}`, {
        method: "PATCH",
        body: {
          content: "Summarise the following paragraph in two sentences.",
        },
      });
      expect(edited.ok, JSON.stringify(edited.error)).toBe(true);
      const pending = (await queueRowsFor(id)).filter(
        (r) => r.status === "pending",
      );
      expect(pending.length).toBeLessThanOrEqual(1);
    } finally {
      await restAsService(`prompts?id=eq.${id}`, { method: "DELETE" });
      await restAsService(`moderation_review_queue?item_id=eq.${id}`, {
        method: "DELETE",
      });
    }
  });
});

test.describe("The credit gate reserves before it spends", () => {
  test("a balance above zero but below the reservation gets 402, not a paid call", async () => {
    const session = await signInTestUser();
    const period = await activeAllowance();
    const original = period.tokens_used;

    // 500 tokens left: the old gate said yes, the smallest reservation is 1,000.
    await setTokensUsed(period.id, period.tokens_granted - 500);
    try {
      const res = await callFunction(
        "refine-prompt",
        {
          prompt: "write a haiku about reservations",
          framework: "auto",
        },
        asUser(session.accessToken),
      );
      expect(res.status).toBe(402);
      expect(JSON.stringify(res.body)).toMatch(/credit/i);

      const after = await activeAllowance();
      expect(
        after.tokens_used,
        "a refused reservation must not move the balance",
      ).toBe(period.tokens_granted - 500);
    } finally {
      await setTokensUsed(period.id, original);
    }
  });

  test("a user cannot reserve, release or settle credits directly", async () => {
    const { userId } = await signInTestUser();
    for (const fn of ["reserve_llm_credits", "release_llm_credits"]) {
      const res = await restAsUser(`rpc/${fn}`, {
        method: "POST",
        body: { p_user_id: userId, p_tokens: 1 },
      });
      expect(res.ok, `${fn} answered a browser session`).toBe(false);
    }
  });
});
