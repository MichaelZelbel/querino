// Setup and teardown against the deployed project.
//
// Every fixture here is scoped to the one non-admin test account and every
// change it makes is reverted. Nothing touches another user's rows.

import { createHash, randomBytes } from "node:crypto";
import { restAsService, signInTestUser } from "./api";

export interface AllowancePeriod {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  tokens_granted: number;
  tokens_used: number;
}

/** The test user's active allowance period. Throws if there is not exactly one. */
export async function activeAllowance(): Promise<AllowancePeriod> {
  const { userId } = await signInTestUser();
  const nowIso = new Date().toISOString();
  const res = await restAsService<AllowancePeriod[]>(
    `ai_allowance_periods?user_id=eq.${userId}` +
      `&period_start=lte.${nowIso}&period_end=gt.${nowIso}` +
      `&select=id,user_id,period_start,period_end,tokens_granted,tokens_used`,
  );
  if (!res.ok) throw new Error(`Reading the allowance failed: ${JSON.stringify(res.error)}`);
  const rows = res.data ?? [];
  if (rows.length === 0) {
    throw new Error("The test account has no active allowance period.");
  }
  if (rows.length > 1) {
    // Exactly the state finding M5 warns about: assertCredits uses
    // .maybeSingle() and starts failing closed once two periods overlap.
    throw new Error(
      `The test account has ${rows.length} overlapping allowance periods, which breaks AI for it (finding M5).`,
    );
  }
  return rows[0];
}

/** Overwrite tokens_used on one allowance period. */
export async function setTokensUsed(periodId: string, tokensUsed: number): Promise<void> {
  const res = await restAsService(`ai_allowance_periods?id=eq.${periodId}`, {
    method: "PATCH",
    body: { tokens_used: tokensUsed },
    headers: { Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error(`Writing tokens_used failed: ${JSON.stringify(res.error)}`);
}

/** Run `body` with the test account's credits at zero, then put them back. */
export async function withExhaustedCredits<T>(body: () => Promise<T>): Promise<T> {
  const period = await activeAllowance();
  const original = period.tokens_used;
  await setTokensUsed(period.id, period.tokens_granted);
  try {
    return await body();
  } finally {
    await setTokensUsed(period.id, original);
  }
}

// ── MCP token ─────────────────────────────────────────────────────────

const sha256Hex = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

export interface MintedMcpToken {
  token: string;
  revoke: () => Promise<void>;
}

/**
 * Mint a real MCP token for the test account, the same shape Settings issues:
 * the plaintext is returned once and only its SHA-256 is stored.
 */
export async function mintMcpToken(): Promise<MintedMcpToken> {
  const { userId } = await signInTestUser();
  const token = `qrn_mcp_${randomBytes(24).toString("hex")}`;

  const res = await restAsService<Array<{ id: string }>>("mcp_api_tokens", {
    method: "POST",
    body: {
      user_id: userId,
      name: "security-suite (ephemeral)",
      token_hash: sha256Hex(token),
      token_prefix: token.slice(0, 16),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    headers: { Prefer: "return=representation" },
  });
  if (!res.ok || !res.data?.[0]) {
    throw new Error(`Minting an MCP token failed: ${JSON.stringify(res.error)}`);
  }

  const id = res.data[0].id;
  return {
    token,
    revoke: async () => {
      await restAsService(`mcp_api_tokens?id=eq.${id}`, { method: "DELETE" });
    },
  };
}

// ── Searchable prompt ─────────────────────────────────────────────────

export interface PromptFixture {
  id: string;
  title: string;
  /** A word from the title with no PostgREST metacharacter in it. */
  plainTerm: string;
  /** The same match, but containing a comma. This is what finding M2 breaks. */
  commaTerm: string;
  remove: () => Promise<void>;
}

/**
 * A private prompt owned by the test account whose title contains a comma, so
 * a search for it exercises the filter-building code rather than the data.
 */
export async function createSearchablePrompt(): Promise<PromptFixture> {
  const { userId } = await signInTestUser();
  const marker = randomBytes(4).toString("hex");
  const title = `Seczz${marker} comma, fixture`;

  const res = await restAsService<Array<{ id: string }>>("prompts", {
    method: "POST",
    body: {
      author_id: userId,
      title,
      description: `Security suite fixture ${marker}. Safe to delete.`,
      content: "Fixture body. Not used by any assertion.",
      category: "writing",
      is_public: false,
    },
    headers: { Prefer: "return=representation" },
  });
  if (!res.ok || !res.data?.[0]) {
    throw new Error(`Creating the search fixture failed: ${JSON.stringify(res.error)}`);
  }

  const id = res.data[0].id;
  return {
    id,
    title,
    plainTerm: `Seczz${marker}`,
    commaTerm: `comma, fixture`,
    remove: async () => {
      await restAsService(`prompts?id=eq.${id}`, { method: "DELETE" });
    },
  };
}
