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

const COUNT = { Prefer: "count=exact" };

/**
 * How many rows of `table` are public, counted by the service role, and how
 * many of them a logged-out visitor gets back in the query the public pages
 * make, author embedded.
 *
 * Until 2026-10-07 the tests below read one row as the visitor and skipped
 * when there was none. A policy that hid every public row from logged-out
 * visitors therefore turned them into skips, and the run stayed green: the
 * failure of 2026-08-23 that this file was written for, passing. The service
 * role cannot be hidden from, so its count says how many there must be.
 */
async function publicRowsSeenLoggedOut(
  table: "prompts" | "skills" | "workflows",
  flag: "is_public" | "published",
): Promise<{ all: number; seen: number }> {
  for (let attempt = 1; ; attempt++) {
    const all = await restAsService(
      `${table}?select=id&${flag}=eq.true&limit=1`,
      { headers: COUNT },
    );
    expect(
      all.ok && all.count !== null,
      `the service role could not count public ${table}: ${JSON.stringify(all.error)}`,
    ).toBe(true);

    // A denied embed is a 401/42501 here, and a "Not Found" page out there.
    const seen = await restAsAnon(
      `${table}?select=id,slug,title,${AUTHOR_EMBED}&${flag}=eq.true&limit=1`,
      { headers: COUNT },
    );
    expect(
      seen.ok && seen.count !== null,
      `an anonymous read of public ${table} failed: ${JSON.stringify(seen.error)}`,
    ).toBe(true);

    // Somebody may have published or unpublished between the two reads. A
    // policy that hides rows hides them on the second look as well.
    if (all.count === seen.count || attempt === 2) {
      return { all: all.count!, seen: seen.count! };
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

test.describe("a logged-out visitor can read the public surface", () => {
  test("every public prompt loads for a visitor, with its author embedded", async () => {
    const { all, seen } = await publicRowsSeenLoggedOut("prompts", "is_public");

    // The site has had public prompts since its first week; the sitemap lists
    // them. None at all is an empty or broken table, not a quiet day.
    expect(
      all,
      "the service role counts no public prompts at all",
    ).toBeGreaterThan(0);
    expect(
      seen,
      `a logged-out visitor sees ${seen} of the ${all} public prompts; the rest render "Not Found"`,
    ).toBe(all);

    const res = await restAsAnon<ArtefactWithAuthor[]>(
      `prompts?select=id,slug,title,${AUTHOR_EMBED}&is_public=eq.true&limit=1`,
    );
    expect(
      res.data?.[0]?.title?.length ?? 0,
      "the prompt came back without a title",
    ).toBeGreaterThan(0);
  });

  test("published skills and workflows load with their authors too", async () => {
    for (const table of ["skills", "workflows"] as const) {
      const { all, seen } = await publicRowsSeenLoggedOut(table, "published");
      // Zero published is allowed here (there was one published workflow on
      // 2026-10-07); what is never allowed is seeing fewer than there are.
      expect(
        seen,
        `a logged-out visitor sees ${seen} of the ${all} published ${table}`,
      ).toBe(all);
    }
  });

  test("the author's name and avatar come back, not just an empty embed", async () => {
    const { all } = await publicRowsSeenLoggedOut("prompts", "is_public");
    expect(
      all,
      "the service role counts no public prompts at all",
    ).toBeGreaterThan(0);

    const res = await restAsAnon<ArtefactWithAuthor[]>(
      `prompts?select=id,${AUTHOR_EMBED}&is_public=eq.true&limit=20`,
    );
    expect(res.ok, `anonymous read failed: ${JSON.stringify(res.error)}`).toBe(
      true,
    );

    const rows = res.data ?? [];
    expect(
      rows.length,
      `there are ${all} public prompts and a logged-out visitor got none of them back`,
    ).toBeGreaterThan(0);

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
      expect(
        res.error?.code,
        `profiles.${column} was refused for the wrong reason`,
      ).toBe("42501");
    }
  });

  test("the github sync settings stay refused", async () => {
    const res = await restAsAnon(
      "profiles?select=github_repo,github_sync_enabled&limit=1",
    );
    expect(res.ok, "anon could read the github sync settings").toBe(false);
    expect(res.error?.code).toBe("42501");
  });

  test("only people who published something are visible at all", async () => {
    const seen = await restAsAnon<Array<{ id: string }>>("profiles?select=id");
    expect(
      seen.ok,
      `anonymous profile read failed: ${JSON.stringify(seen.error)}`,
    ).toBe(true);
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
      expect(
        res.ok,
        `service read of ${table} failed: ${JSON.stringify(res.error)}`,
      ).toBe(true);
      for (const row of res.data ?? [])
        if (row.author_id) publishers.add(row.author_id);
    }

    const leaked = visible.filter((id) => !publishers.has(id));
    expect(
      leaked,
      `${leaked.length} profile(s) are readable by an anonymous visitor without having published anything`,
    ).toEqual([]);
  });
});
