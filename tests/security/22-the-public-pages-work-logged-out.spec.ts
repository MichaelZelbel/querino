// The public surface, from the only seat that matters for it: logged out.
//
// On 2026-08-23 a hardening migration ran REVOKE SELECT ON public.profiles FROM anon,
// authenticated and granted it back to authenticated only. Every public page loads its
// author in the same query as the artefact, and PostgREST fails the whole query when
// one embedded table is denied, so the missing grant did not hide the byline: it made
// every prompt, skill and workflow page render "Not Found" with noindex,nofollow, and
// left /discover listing nothing. Signed in it all looked normal, and the suite went
// green, because nothing here asked as an anonymous visitor.
//
// So these tests hold two things open and two things shut, and the pairing is the
// point. A guard that blocks too much is the likelier regression, and this file exists
// because that is exactly what happened.

import { test, expect } from "@playwright/test";
import { restAsAnon, restAsService } from "./helpers/api";

interface AuthorRef {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ArtefactWithAuthor {
  id: string;
  slug: string | null;
  title: string;
  profiles: AuthorRef | null;
}

// Exactly the shape every public detail page asks for.
const AUTHOR_EMBED = "profiles:author_id(id,display_name,avatar_url)";

test.describe("a logged-out visitor can read the public surface", () => {
  test("a public prompt loads with its author embedded", async () => {
    const res = await restAsAnon<ArtefactWithAuthor[]>(
      `prompts?select=id,slug,title,${AUTHOR_EMBED}&is_public=eq.true&limit=1`,
    );

    // A denied embed is a 401/42501 here, and a "Prompt Not Found" page out there.
    expect(
      res.ok,
      `an anonymous read of a public prompt failed: ${JSON.stringify(res.error)}`,
    ).toBe(true);

    const rows = res.data ?? [];
    test.skip(rows.length === 0, "no public prompts to read");
    expect(rows[0].title.length, "the prompt came back without a title").toBeGreaterThan(0);
  });

  test("published skills and workflows load with their authors too", async () => {
    for (const table of ["skills", "workflows"] as const) {
      const res = await restAsAnon<ArtefactWithAuthor[]>(
        `${table}?select=id,slug,title,${AUTHOR_EMBED}&published=eq.true&limit=1`,
      );
      expect(
        res.ok,
        `an anonymous read of published ${table} failed: ${JSON.stringify(res.error)}`,
      ).toBe(true);
    }
  });

  test("the author's name and avatar come back, not just an empty embed", async () => {
    const res = await restAsAnon<ArtefactWithAuthor[]>(
      `prompts?select=id,${AUTHOR_EMBED}&is_public=eq.true&limit=20`,
    );
    expect(res.ok, `anonymous read failed: ${JSON.stringify(res.error)}`).toBe(true);

    const rows = res.data ?? [];
    test.skip(rows.length === 0, "no public prompts to read");

    // Not every public prompt has an author row, but at least one must, or the byline
    // is gone everywhere and nobody would notice until someone looked at the page.
    const withAuthor = rows.filter((r) => r.profiles?.display_name);
    expect(
      withAuthor.length,
      "no public prompt returned an author name; the byline is invisible to logged-out visitors",
    ).toBeGreaterThan(0);
  });
});

test.describe("and cannot read anything else about those people", () => {
  test("the privileged profile columns stay refused", async () => {
    for (const column of ["role", "plan_type", "plan_source"]) {
      const res = await restAsAnon(`profiles?select=${column}&limit=1`);
      expect(res.ok, `anon could read profiles.${column}`).toBe(false);
      expect(res.error?.code, `profiles.${column} was refused for the wrong reason`).toBe("42501");
    }
  });

  test("the github sync settings stay refused", async () => {
    const res = await restAsAnon("profiles?select=github_repo,github_sync_enabled&limit=1");
    expect(res.ok, "anon could read the github sync settings").toBe(false);
    expect(res.error?.code).toBe("42501");
  });

  test("only people who published something are visible at all", async () => {
    const seen = await restAsAnon<Array<{ id: string }>>("profiles?select=id");
    expect(seen.ok, `anonymous profile read failed: ${JSON.stringify(seen.error)}`).toBe(true);
    const visible = (seen.data ?? []).map((r) => r.id);

    // Anyone anon can see must have published something. If this ever fails, a policy
    // was widened past "authors of public content" and the whole user table is out.
    const publishers = new Set<string>();
    for (const [table, flag] of [
      ["prompts", "is_public"],
      ["skills", "published"],
      ["workflows", "published"],
      ["prompt_kits", "published"],
    ] as const) {
      const res = await restAsService<Array<{ author_id: string | null }>>(
        `${table}?select=author_id&${flag}=eq.true`,
      );
      expect(res.ok, `service read of ${table} failed: ${JSON.stringify(res.error)}`).toBe(true);
      for (const row of res.data ?? []) if (row.author_id) publishers.add(row.author_id);
    }

    const leaked = visible.filter((id) => !publishers.has(id));
    expect(
      leaked,
      `${leaked.length} profile(s) are readable by an anonymous visitor without having published anything`,
    ).toEqual([]);
  });
});
