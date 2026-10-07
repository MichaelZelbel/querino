// Specs 18, 19 and 20 write the live llm_call_configs table: the row that
// decides which model every real user's AI call runs on and which prompt it
// sends. Putting it back is part of those tests, not a courtesy.
//
// Until 2026-10-07 none of the three could be sure it had. Spec 20 restored
// only `if (originalPrompt !== null)`, and the live prompt-wizard
// system_prompt IS null (null means "follow the prompt in the code"), so a run
// that failed between saving its German edit and resetting it would have left
// every user's Prompt Wizard on the test's prompt, and the restore would have
// decided there was nothing to restore. Spec 19 kept the original only in
// memory and never looked at whether its restoring PATCH landed. Spec 18
// restored nothing when its first read had failed.
//
// So: the whole row is read before anything is written, it is written back
// whole, NULLs included, and what comes back from that write is compared with
// what was read. A restore that did not land throws, loudly, from the test's
// `finally` and again from `afterAll`.

import { restAsService } from "./api";

/**
 * Every column an administrator can change. call_site and tier are the key,
 * and created_at / updated_at belong to the database.
 */
const RESTORED = [
  "description",
  "provider",
  "model",
  "system_prompt",
  "temperature",
  "max_tokens",
  "extra_options",
  "enabled",
  "updated_by",
] as const;

type RestoredColumn = (typeof RESTORED)[number];

export type LlmConfigRow = Record<RestoredColumn, unknown>;

export interface LlmConfigSnapshot {
  callSite: string;
  tier: string;
  row: LlmConfigRow;
}

const SELECT = `select=${RESTORED.join(",")}`;

function rowPath(callSite: string, tier: string): string {
  return (
    `llm_call_configs?call_site=eq.${encodeURIComponent(callSite)}` +
    `&tier=eq.${encodeURIComponent(tier)}`
  );
}

/** Read the complete row. Throws, before anything is written, if it cannot. */
export async function snapshotLlmConfig(
  callSite: string,
  tier = "default",
): Promise<LlmConfigSnapshot> {
  const res = await restAsService<LlmConfigRow[]>(
    `${rowPath(callSite, tier)}&${SELECT}`,
  );
  if (!res.ok || res.data?.length !== 1) {
    throw new Error(
      `Could not read llm_call_configs ${callSite}/${tier} before writing it ` +
        `(${res.status}, ${res.data?.length ?? 0} rows: ${JSON.stringify(res.error)}). ` +
        "Nothing was written.",
    );
  }
  return { callSite, tier, row: res.data[0] };
}

/**
 * Write the snapshot back, every column, and check that it landed.
 *
 * The error names the columns that are wrong but never their values: CI logs
 * of this public repository are public, and a system prompt is admin-only.
 */
export async function restoreLlmConfig(
  snapshot: LlmConfigSnapshot,
): Promise<void> {
  const { callSite, tier, row } = snapshot;
  const res = await restAsService<LlmConfigRow[]>(
    `${rowPath(callSite, tier)}&${SELECT}`,
    {
      method: "PATCH",
      body: Object.fromEntries(RESTORED.map((c) => [c, row[c]])),
      headers: { Prefer: "return=representation" },
    },
  );
  const after = res.ok && res.data?.length === 1 ? res.data[0] : null;
  const wrong = after
    ? RESTORED.filter(
        (c) => JSON.stringify(after[c]) !== JSON.stringify(row[c]),
      )
    : [...RESTORED];
  if (wrong.length > 0) {
    throw new Error(
      `RESTORE FAILED: llm_call_configs ${callSite}/${tier} is not back to what it was ` +
        `before this run (${res.status}: ${JSON.stringify(res.error)}; wrong: ${wrong.join(", ")}). ` +
        `Every real user's ${callSite} call now runs on whatever the test left there. ` +
        "Compare the row with the admin panel and put it back by hand.",
    );
  }
}
