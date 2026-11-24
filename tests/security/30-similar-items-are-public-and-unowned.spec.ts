// The detail pages show similar items to visitors, so the get_similar_*
// functions are called with the anon key and nothing else. They must hand back
// only what the public listings show: published, and not owned by a team.
// Migration 20261124100000.

import { test, expect } from "@playwright/test";
import { restAsAnon, restAsService } from "./helpers/api";

const KINDS = [
  { fn: "get_similar_prompts", table: "prompts", live: "is_public=eq.true" },
  { fn: "get_similar_skills", table: "skills", live: "published=eq.true" },
  {
    fn: "get_similar_workflows",
    table: "workflows",
    live: "published=eq.true",
  },
  {
    fn: "get_similar_prompt_kits",
    table: "prompt_kits",
    live: "published=eq.true",
  },
] as const;

interface SimilarRow {
  id: string;
  team_id: string | null;
}

for (const { fn, table, live } of KINDS) {
  test.describe(fn, () => {
    test("a visitor gets only public, team-less items for a public item", async () => {
      const seed = await restAsService<{ id: string }[]>(
        `${table}?select=id&${live}&team_id=is.null&embedding=not.is.null&limit=1`,
      );
      test.skip(!seed.data?.length, `no public ${table} with an embedding`);

      const res = await restAsAnon<SimilarRow[]>(`rpc/${fn}`, {
        method: "POST",
        body: { target_id: seed.data[0].id, match_limit: 6 },
      });
      expect(res.status).toBe(200);
      expect(res.data.every((r) => r.team_id === null)).toBe(true);

      if (res.data.length) {
        const ids = res.data.map((r) => r.id).join(",");
        const listed = await restAsService<{ id: string }[]>(
          `${table}?select=id&${live}&team_id=is.null&id=in.(${ids})`,
        );
        expect(listed.data.length).toBe(res.data.length);
      }
    });

    test("a visitor gets nothing for an item that is not public", async () => {
      const seed = await restAsService<{ id: string }[]>(
        `${table}?select=id&or=(${live.replace("=eq.", ".neq.")},team_id.not.is.null)&embedding=not.is.null&limit=1`,
      );
      const target =
        seed.data?.[0]?.id ?? "00000000-0000-0000-0000-000000000000";

      const res = await restAsAnon<SimilarRow[]>(`rpc/${fn}`, {
        method: "POST",
        body: { target_id: target, match_limit: 6 },
      });
      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });
  });
}
