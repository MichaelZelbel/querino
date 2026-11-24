// When an item first went public is the database's word, not the client's
// (issue #66). This reads migration 20261119160000 and checks the rules the
// stamp_published_at trigger must keep. The live probe of the same rules (an
// author, the MCP server's service role, an edit, a republish, a forged date)
// needs the management token; its SQL is in the description of PR #77 for
// the owner to add to the security suite.

import { assert, assertMatch } from "@std/assert";

const MIGRATION =
  "supabase/migrations/20261119160000_an_item_remembers_when_it_went_public.sql";

/** The body of one plpgsql function in the migration. */
function fn(sql: string, name: string): string {
  const start = sql.indexOf(`FUNCTION public.${name}()`);
  assert(start >= 0, `no function ${name}`);
  const open = sql.indexOf("$fn$", start);
  const close = sql.indexOf("$fn$", open + 4);
  return sql.slice(open + 4, close);
}

Deno.test("skills, workflows and prompt kits get published_at", async () => {
  const sql = await Deno.readTextFile(MIGRATION);
  for (const table of ["skills", "workflows", "prompt_kits"]) {
    assertMatch(
      sql,
      new RegExp(
        `ALTER TABLE public\\.${table}\\s+ADD COLUMN IF NOT EXISTS published_at timestamptz`,
      ),
      table,
    );
  }
});

Deno.test(
  "one trigger on all four tables stamps published_at, before insert or update",
  async () => {
    const sql = await Deno.readTextFile(MIGRATION);
    assertMatch(
      sql,
      /FOREACH t IN ARRAY ARRAY\['prompts', 'skills', 'workflows', 'prompt_kits'\]/,
    );
    assertMatch(
      sql,
      /CREATE TRIGGER stamp_published_at BEFORE INSERT OR UPDATE ON public\.%I '\s*'FOR EACH ROW EXECUTE FUNCTION public\.stamp_published_at\(\)/,
    );
  },
);

Deno.test(
  "a client's value is never kept: an insert starts at NULL, an update keeps the stored date",
  async () => {
    const body = fn(await Deno.readTextFile(MIGRATION), "stamp_published_at");
    assertMatch(
      body,
      /IF TG_OP = 'UPDATE' THEN\s+NEW\.published_at := OLD\.published_at;\s+ELSE\s+NEW\.published_at := NULL;\s+END IF;/,
    );
    // now() only when the row is public and has no date yet, so an edit and
    // a republish keep the first date.
    assertMatch(
      body,
      /IF v_now_public AND NEW\.published_at IS NULL THEN\s+NEW\.published_at := now\(\);/,
    );
    // No role is exempt: the MCP server writes with the service role.
    assert(!/current_user|current_role|auth\.role/.test(body));
    // prompts spells the flag is_public, the others published.
    assertMatch(
      body,
      /TG_TABLE_NAME = 'prompts'[\s\S]*NEW\.is_public[\s\S]*NEW\.published\b/,
    );
  },
);

Deno.test(
  "published_at is bookkeeping: on its own it does not move updated_at",
  async () => {
    const body = fn(
      await Deno.readTextFile(MIGRATION),
      "touch_artifact_updated_at",
    );
    assertMatch(
      body,
      /v_bookkeeping constant text\[\] := ARRAY\[[\s\S]*'published_at'[\s\S]*\];/,
    );
  },
);

Deno.test(
  "existing public rows are backfilled from created_at, before the trigger exists",
  async () => {
    const sql = await Deno.readTextFile(MIGRATION);
    const trigger = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.stamp_published_at",
    );
    for (const [table, flag] of [
      ["prompts", "is_public"],
      ["skills", "published"],
      ["workflows", "published"],
      ["prompt_kits", "published"],
    ]) {
      const re = new RegExp(
        `UPDATE public\\.${table}\\s+SET published_at = created_at WHERE ${flag} AND published_at IS NULL;`,
      );
      assertMatch(sql, re, table);
      assert(sql.search(re) < trigger, table);
    }
  },
);

Deno.test(
  "anon and authenticated cannot call the trigger function",
  async () => {
    const sql = await Deno.readTextFile(MIGRATION);
    for (const role of ["PUBLIC", "anon", "authenticated"]) {
      assert(
        sql.includes(
          `REVOKE ALL ON FUNCTION public.stamp_published_at() FROM ${role};`,
        ),
        role,
      );
    }
  },
);
