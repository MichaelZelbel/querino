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
import { createSearchableSkill } from "./helpers/fixtures";

const TABLES = ["prompts", "skills", "workflows", "prompt_kits"] as const;

/** Rows a visitor can reach by concept search, and so must be embedded. */
async function publishedWithoutEmbedding(table: string): Promise<number> {
  const flag = table === "prompts" ? "is_public" : "published";
  // An edit clears the embedding and the two-minute job refills it, so a row
  // edited in the last five minutes is not yet a failure. Without this the
  // test went red whenever anyone saved a published item just before a run
  // (2026-09-23, 21:45: a skill saved 20 seconds before the check, embedded
  // by the 21:48 tick).
  const settled = new Date(Date.now() - 5 * 60_000).toISOString();
  const res = await restAsService<Array<{ id: string }>>(
    `${table}?select=id&embedding=is.null&${flag}=is.true` +
      `&updated_at=lt.${encodeURIComponent(settled)}&limit=200`,
  );
  if (!res.ok)
    throw new Error(`counting ${table} failed: ${JSON.stringify(res.error)}`);
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
    //
    // Until 2026-10-07 this test only re-saved somebody's real skill with the
    // value it already had, so the half its title promises, that changing the
    // text clears the embedding, was never exercised: a trigger that cleared
    // nothing passed. It now works on an unpublished skill of the test
    // account's own, so it can change the text for real, and deletes it.
    const skill = await createSearchableSkill();
    try {
      // Any vector of the right width will do; the row is unpublished, so no
      // search ever ranks it. The service role is not the browser, so the
      // computed-columns guard lets it write one (20260930100200).
      const vector = `[${Array.from({ length: 1536 }, () => "0.01").join(",")}]`;
      const embedded = await restAsService<Array<{ embedding: unknown }>>(
        `skills?id=eq.${skill.id}&select=embedding`,
        {
          method: "PATCH",
          body: { embedding: vector },
          headers: { Prefer: "return=representation" },
        },
      );
      expect(
        embedded.ok,
        `could not give the fixture an embedding: ${JSON.stringify(embedded.error)}`,
      ).toBe(true);
      expect(
        embedded.data?.[0]?.embedding,
        "the fixture has no embedding to lose",
      ).not.toBeNull();

      // Touch a column the embedding is NOT built from, writing back the value
      // that is already there. The embedding must survive: update_embedding
      // writes that column and nothing else, and if a write like this cleared
      // it, the job would re-embed the same row every two minutes forever.
      const untouched = await restAsService<Array<{ embedding: unknown }>>(
        `skills?id=eq.${skill.id}&select=embedding`,
        {
          method: "PATCH",
          body: { category: "coding" },
          headers: { Prefer: "return=representation" },
        },
      );
      expect(untouched.ok, JSON.stringify(untouched.error)).toBe(true);
      expect(
        untouched.data?.[0]?.embedding,
        "a save that changed no text cleared the embedding: the job will now re-embed this row forever",
      ).not.toBeNull();

      // Now change the text. The row this UPDATE returns is the row as the
      // trigger left it, so the two-minute job cannot refill it in between.
      const edited = await restAsService<Array<{ embedding: unknown }>>(
        `skills?id=eq.${skill.id}&select=embedding`,
        {
          method: "PATCH",
          body: {
            description: `${skill.marker} was edited, so its old embedding describes text that is gone.`,
          },
          headers: { Prefer: "return=representation" },
        },
      );
      expect(edited.ok, JSON.stringify(edited.error)).toBe(true);
      expect(edited.data?.length, "the edit did not reach the fixture").toBe(1);
      expect(
        edited.data?.[0]?.embedding,
        "the text changed and the embedding stayed, so concept search keeps finding this " +
          "artifact by what it used to say",
      ).toBeNull();
    } finally {
      await skill.remove();
    }
  });
});
