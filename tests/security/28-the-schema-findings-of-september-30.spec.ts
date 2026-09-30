// The database findings of the 2026-09-30 audit, migrations 20260930100000 to
// 20260930100900. Each test names the hole it closes. Nothing here writes a
// row that survives the test: the REST tests use the test account's own
// private fixture or clean up after a write that should have been refused,
// and everything that has to act as another person runs inside a rolled-back
// SQL probe.

import { test, expect } from "@playwright/test";
import {
  hasManagementToken,
  restAsAnon,
  restAsService,
  restAsUser,
  signInTestUser,
  sqlProbe,
  sqlQuery,
} from "./helpers/api";
import { createSearchablePrompt } from "./helpers/fixtures";

const NEEDS_TOKEN = "needs SUPABASE_ACCESS_TOKEN; skipped in CI on purpose";

test.describe("A team's GitHub token needs a seat on that team", () => {
  test("a user cannot attach a credential to a team they are not in", async () => {
    const { userId } = await signInTestUser();
    const teams = await restAsService<Array<{ id: string }>>(
      "teams?select=id&limit=50",
    );
    const mine = await restAsService<Array<{ team_id: string }>>(
      `team_members?select=team_id&user_id=eq.${userId}`,
    );
    const memberOf = new Set((mine.data ?? []).map((m) => m.team_id));
    const foreign = (teams.data ?? []).find((t) => !memberOf.has(t.id));
    test.skip(!foreign, "every team on the project includes the test account");

    // A credential type the GitHub worker never reads, so even an open hole
    // cannot put this row in anybody's push.
    const write = await restAsUser("user_credentials", {
      method: "POST",
      body: {
        user_id: userId,
        credential_type: "security_suite_probe",
        credential_value: "not-a-token",
        team_id: foreign!.id,
      },
    });
    if (write.ok) {
      await restAsService(
        `user_credentials?user_id=eq.${userId}&credential_type=eq.security_suite_probe`,
        { method: "DELETE" },
      );
    }
    expect(
      write.ok,
      "a user with no seat on a team attached a credential to it (the loose policies of 20260129173152 are back)",
    ).toBe(false);
  });
});

test.describe("The moderation stopword list is for admins", () => {
  test("a signed-in non-admin reads none of it", async () => {
    const res = await restAsUser<Array<{ id: string }>>(
      "moderation_stopwords?select=id&limit=5",
    );
    expect(res.ok, JSON.stringify(res.error)).toBe(true);
    expect(
      res.data,
      "the stopword list is readable by any account",
    ).toHaveLength(0);
  });
});

test.describe("Ratings, copy counts and updated_at are not the browser's to write", () => {
  test("an author cannot rate their own prompt or set its copy count", async () => {
    const fixture = await createSearchablePrompt();
    try {
      const patch = await restAsUser(`prompts?id=eq.${fixture.id}`, {
        method: "PATCH",
        body: { rating_avg: 5, rating_count: 9999, copies_count: 12345 },
        headers: { Prefer: "return=minimal" },
      });
      // Silently kept, like the profile columns: an edit page that sends back
      // the rating it loaded must still save.
      expect(patch.ok, JSON.stringify(patch.error)).toBe(true);

      const row = await restAsService<
        Array<{
          rating_avg: number;
          rating_count: number;
          copies_count: number;
        }>
      >(
        `prompts?id=eq.${fixture.id}&select=rating_avg,rating_count,copies_count`,
      );
      expect(
        row.data?.[0]?.rating_count,
        "an author wrote their own review count",
      ).toBe(0);
      expect(
        Number(row.data?.[0]?.rating_avg),
        "an author wrote their own rating",
      ).toBe(0);
      expect(
        row.data?.[0]?.copies_count,
        "an author wrote their own copy count",
      ).toBe(0);
    } finally {
      await fixture.remove();
    }
  });

  test("a sync job's write leaves updated_at alone, an edit moves it", async () => {
    const fixture = await createSearchablePrompt();
    try {
      const read = async () =>
        (
          await restAsService<Array<{ updated_at: string }>>(
            `prompts?id=eq.${fixture.id}&select=updated_at`,
          )
        ).data?.[0]?.updated_at;

      const before = await read();
      // What process-menerio-sync-queue writes after a successful sync.
      await restAsService(`prompts?id=eq.${fixture.id}`, {
        method: "PATCH",
        body: { menerio_synced_at: new Date().toISOString() },
        headers: { Prefer: "return=minimal" },
      });
      expect(
        await read(),
        "recording a Menerio sync moved updated_at, so every synced artifact looks changed",
      ).toBe(before);

      await restAsUser(`prompts?id=eq.${fixture.id}`, {
        method: "PATCH",
        body: {
          description: "Security suite fixture, edited. Safe to delete.",
        },
        headers: { Prefer: "return=minimal" },
      });
      expect(
        await read(),
        "an edit by the author no longer moves updated_at",
      ).not.toBe(before);
    } finally {
      await fixture.remove();
    }
  });
});

test.describe("An invite link names its team, for a signed-in caller only", () => {
  test("a logged-out visitor cannot ask, a signed-in one learns nothing from a wrong token", async () => {
    const anon = await restAsAnon("rpc/get_team_invite_preview", {
      method: "POST",
      body: { p_token: "not-a-real-token" },
    });
    expect(anon.ok, "a logged-out visitor can call the invite preview").toBe(
      false,
    );

    const user = await restAsUser<unknown[]>("rpc/get_team_invite_preview", {
      method: "POST",
      body: { p_token: "not-a-real-token" },
    });
    expect(user.ok, JSON.stringify(user.error)).toBe(true);
    expect(user.data, "a wrong token named a team").toEqual([]);
  });

  test("a valid token names the team to a non-member and joins nobody", async () => {
    test.skip(!hasManagementToken(), NEEDS_TOKEN);
    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        v_team uuid; v_owner uuid; v_stranger uuid; v_token text; v_name text;
      BEGIN
        SELECT t.id, t.owner_id INTO v_team, v_owner FROM public.teams t LIMIT 1;
        IF v_team IS NULL THEN RAISE EXCEPTION 'PROBE SKIP no team exists'; END IF;
        SELECT p.id INTO v_stranger FROM public.profiles p
         WHERE NOT EXISTS (SELECT 1 FROM public.team_members tm
                            WHERE tm.team_id = v_team AND tm.user_id = p.id) LIMIT 1;
        INSERT INTO public.team_invites (team_id, created_by, role)
        VALUES (v_team, v_owner, 'member') RETURNING token INTO v_token;

        PERFORM set_config('request.jwt.claims',
          json_build_object('sub', v_stranger, 'role', 'authenticated')::text, true);
        SET LOCAL ROLE authenticated;
        SELECT team_name INTO v_name FROM public.get_team_invite_preview(v_token);
        RESET ROLE;

        IF v_name IS DISTINCT FROM (SELECT name FROM public.teams WHERE id = v_team) THEN
          RAISE EXCEPTION 'PROBE FAILED the preview did not name the team';
        END IF;
        IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = v_team AND user_id = v_stranger) THEN
          RAISE EXCEPTION 'PROBE FAILED previewing an invite joined the team';
        END IF;
        RAISE EXCEPTION 'PROBE OK the preview names the team and joins nobody';
      END $probe$;
    `);
    test.skip(out.includes("PROBE SKIP"), out);
    expect(out, out).toContain("PROBE OK");
  });
});

test.describe("Suggestions and comments keep their author and their artifact", () => {
  test("an owner cannot re-sign a suggestion, an author can answer a change request", async () => {
    test.skip(!hasManagementToken(), NEEDS_TOKEN);
    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        v_prompt uuid; v_owner uuid; v_writer uuid; v_other uuid; v_sugg uuid;
        v_rows integer; v_refused boolean := false; log text := '';
      BEGIN
        SELECT p.id, p.author_id INTO v_prompt, v_owner FROM public.prompts p
         WHERE p.is_public AND p.author_id IS NOT NULL ORDER BY p.created_at LIMIT 1;
        SELECT pr.id INTO v_writer FROM public.profiles pr WHERE pr.id <> v_owner LIMIT 1;
        SELECT pr.id INTO v_other FROM public.profiles pr
         WHERE pr.id NOT IN (v_owner, v_writer) LIMIT 1;
        INSERT INTO public.suggestions (item_type, item_id, author_id, content, status, reviewer_id)
        VALUES ('prompt', v_prompt, v_writer, 'probe', 'changes_requested', v_owner)
        RETURNING id INTO v_sugg;

        PERFORM set_config('request.jwt.claims',
          json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
        SET LOCAL ROLE authenticated;
        UPDATE public.suggestions
           SET content = 'probe, revised', status = 'open',
               reviewer_id = NULL, review_comment = NULL, requested_changes = NULL
         WHERE id = v_sugg AND author_id = v_writer;
        GET DIAGNOSTICS v_rows = ROW_COUNT;
        RESET ROLE;
        IF v_rows <> 1 THEN
          RAISE EXCEPTION 'PROBE FAILED the author could not answer a change request';
        END IF;
        log := log || 'author resubmits; ';

        PERFORM set_config('request.jwt.claims',
          json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
        SET LOCAL ROLE authenticated;
        <<resign>>
        BEGIN
          UPDATE public.suggestions SET author_id = v_other WHERE id = v_sugg;
        EXCEPTION WHEN insufficient_privilege THEN
          v_refused := true;
        END resign;
        RESET ROLE;
        IF NOT v_refused THEN
          RAISE EXCEPTION 'PROBE FAILED the artifact owner put another name on a suggestion: %', log;
        END IF;
        log := log || 'owner cannot re-sign it';

        RAISE EXCEPTION 'PROBE OK %', log;
      END $probe$;
    `);
    expect(out, out).toContain("PROBE OK");
  });
});

test.describe("What the browser roles can reach in the catalogue", () => {
  test("anon and authenticated hold no TRUNCATE, REFERENCES, TRIGGER or MAINTAIN in public", async () => {
    test.skip(!hasManagementToken(), NEEDS_TOKEN);
    const rows = await sqlQuery<{ held: string }>(`
      select c.relname || ' ' || r.rolname || ' ' || p.priv as held
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       cross join (values ('anon'), ('authenticated')) r(rolname)
       cross join (values ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN')) p(priv)
       where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
         and has_table_privilege(r.rolname, c.oid, p.priv)
       order by 1
    `);
    expect(
      rows.map((r) => r.held),
      "a browser role can empty or alter a table, which row-level security does not stop",
    ).toEqual([]);
  });

  test("every SECURITY DEFINER function the anon key can call is one we chose", async () => {
    test.skip(!hasManagementToken(), NEEDS_TOKEN);
    // Each is either read by a policy that a logged-out visitor evaluates, or
    // serves a public page. Adding a name here is a decision, not a fix.
    const expected = [
      "active_creators_last_7_days",
      "check_signup_allowed",
      "get_similar_prompt_kits",
      "get_similar_prompts",
      "get_similar_skills",
      "get_similar_workflows",
      "is_admin",
      "is_item_owner",
      "is_item_public",
      "is_premium_user",
      "is_team_admin_or_owner",
      "is_team_member",
      "is_team_member_for_item",
      "is_team_owner",
      "search_prompt_kits_semantic",
      "search_prompts_semantic",
      "search_skills_semantic",
      "search_workflows_semantic",
      "tokens_per_credit",
    ];
    const rows = await sqlQuery<{ proname: string }>(`
      select p.proname
        from pg_proc p
       where p.pronamespace = 'public'::regnamespace
         and p.prosecdef
         and p.prokind = 'f'
         and p.prorettype <> 'trigger'::regtype
         and has_function_privilege('anon', p.oid, 'EXECUTE')
       order by 1
    `);
    expect(
      rows.map((r) => r.proname),
      "a SECURITY DEFINER function became callable with the anon key (Postgres grants EXECUTE to PUBLIC by default)",
    ).toEqual(expected);
  });
});
