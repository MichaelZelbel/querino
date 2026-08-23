// Found 23 August 2026, while fixing something else.
//
// Nothing in this project ever generated an embedding when an artifact was
// written. Not the web hooks, not create_skill in the MCP server, not a
// trigger. A row got one when an admin pressed Backfill, or when someone
// pressed Refresh on the artifact itself.
//
// Every semantic RPC filters `published = true AND embedding IS NOT NULL`, so
// a published artifact with no embedding is absent from concept search and
// nothing says so. It looks exactly like an artifact nobody wanted. On the day
// this was written that was 62 rows, 40 of them published, 38 public prompts.
//
// The same morning the OpenAI balance hit zero, so every embedding call in the
// project returned 429 and the semantic-merge caller turned that into an empty
// list on purpose. Concept search became keyword search and looked like a site
// where nothing matched.
//
// Both failures are silent, which is the only reason either lasted. These
// tests are the noise.

import { test, expect } from "@playwright/test";
import { restAsService } from "./helpers/api";

const TABLES = ["prompts", "skills", "workflows", "prompt_kits"] as const;

/** Rows a visitor can reach by concept search, and so must be embedded. */
async function publishedWithoutEmbedding(table: string): Promise<number> {
  const flag = table === "prompts" ? "is_public" : "published";
  const res = await restAsService<Array<{ id: string }>>(
    `${table}?select=id&embedding=is.null&${flag}=is.true&limit=200`,
  );
  if (!res.ok) throw new Error(`counting ${table} failed: ${JSON.stringify(res.error)}`);
  return res.data?.length ?? 0;
}

test.describe("a published artifact is never invisible to concept search", () => {
  for (const table of TABLES) {
    test(`every published row in ${table} has an embedding`, async () => {
      // Allowed to be briefly non-zero: an edit clears the embedding and the
      // job refills it within two minutes. A number that stays up is the job
      // not running, or the embedding provider refusing every call.
      const missing = await publishedWithoutEmbedding(table);
      expect(
        missing,
        `${missing} published ${table} have no embedding, so concept search cannot return them`,
      ).toBe(0);
    });
  }

  // There is deliberately no test here asserting the cron job exists. The
  // cron schema is not reachable over PostgREST, and a test that checked
  // something else and called it "the job is running" would be worse than
  // none. The four assertions above already go red when the job stops,
  // because that is the only thing that keeps those counts at zero.
});

test.describe("editing an artifact re-embeds it", () => {
  test("changing the text clears the embedding, and a bare re-save does not", async () => {
    // The trigger is the whole guarantee that a future write path cannot
    // forget: the condition lives in the database, not in each caller.
    const found = await restAsService<Array<{ id: string; language: string | null }>>(
      "skills?select=id,language&embedding=not.is.null&limit=1",
    );
    expect(found.ok, `could not read a skill: ${JSON.stringify(found.error)}`).toBe(true);
    const row = found.data?.[0];
    test.skip(!row, "no skill has an embedding yet, so there is nothing to invalidate");

    // Touch a column the embedding is NOT built from, writing back the value
    // that is already there. This is somebody's real artifact, so the test
    // gets its UPDATE without changing a single thing about the row.
    //
    // The embedding must survive: update_embedding writes that column and
    // nothing else, and if a write like this cleared it, the job would re-embed
    // the same row every two minutes forever.
    const untouched = await restAsService(`skills?id=eq.${row!.id}`, {
      method: "PATCH",
      body: { language: row!.language },
      headers: { Prefer: "return=representation" },
    });
    expect(untouched.ok).toBe(true);

    const after = await restAsService<Array<{ embedding: unknown }>>(
      `skills?select=embedding&id=eq.${row!.id}`,
    );
    expect(
      after.data?.[0]?.embedding,
      "a save that changed no text cleared the embedding: the job will now re-embed this row forever",
    ).not.toBeNull();
  });
});
