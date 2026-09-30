// Two findings of the 2026-09-30 audit, from the outside.
//
// generate-embedding charged the old way until then: it asked only for a
// balance above zero, paid the provider, and wrote the charge afterwards, so
// one token left bought as many parallel embeddings as a caller could send.
// Since then it holds an estimate against the balance first, like every call
// through callLovableAI, and refuses when the estimate does not fit.
//
// translate-artifact cut an artifact's content at 16,000 characters and sent
// back the translation of the start as if it were the whole thing, which the
// Translate dialog then prefilled into a new artifact. It now refuses content
// it cannot translate whole, before anything is charged.
//
// Neither test reaches a provider on the fixed code, so running them costs
// nothing. The test account's balance is put back whatever happens.

import { test, expect } from "@playwright/test";
import { asUser, callFunction, signInTestUser } from "./helpers/api";
import { activeAllowance, setTokensUsed } from "./helpers/fixtures";

/** Run `body` with exactly one token left, then put the balance back. */
async function withOneTokenLeft<T>(body: () => Promise<T>): Promise<T> {
  const period = await activeAllowance();
  const original = period.tokens_used;
  await setTokensUsed(period.id, period.tokens_granted - 1);
  try {
    return await body();
  } finally {
    await setTokensUsed(period.id, original);
  }
}

test.describe("Refused before anything is paid for", () => {
  test("one token left does not buy an embedding", async () => {
    const session = await signInTestUser();

    await withOneTokenLeft(async () => {
      const res = await callFunction(
        "generate-embedding",
        { text: "a sentence long enough to need more than one token" },
        asUser(session.accessToken),
      );

      expect(
        res.status,
        "generate-embedding paid a provider for a caller whose balance could not cover it. " +
          "It has lost the reserve_llm_credits step before the call.",
      ).toBe(402);
      expect(JSON.stringify(res.body)).toMatch(/credit/i);
      expect(JSON.stringify(res.body)).not.toMatch(/"embedding"/);
    });
  });

  test("the balance is restored after the one-token test", async () => {
    const allowance = await activeAllowance();
    expect(allowance.tokens_granted - allowance.tokens_used).toBeGreaterThan(1);
  });

  test("content too long to translate whole is refused, and costs nothing", async () => {
    const session = await signInTestUser();
    const before = await activeAllowance();

    const res = await callFunction(
      "translate-artifact",
      {
        artifactType: "skill",
        title: "A long skill",
        description: "",
        content: "word ".repeat(4_000), // 20,000 characters
        tags: [],
        sourceLanguage: "en",
        targetLanguage: "de",
      },
      asUser(session.accessToken),
    );

    expect(
      res.status,
      "translate-artifact accepted content longer than it translates, so the " +
        "translation it returns is missing the end of the artifact",
    ).toBe(413);
    expect(JSON.stringify(res.body)).toMatch(/20,000 characters/);

    const after = await activeAllowance();
    expect(
      after.tokens_used,
      "a refused translation still moved the balance",
    ).toBe(before.tokens_used);
  });
});
