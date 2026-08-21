// Two bugs found while checking the Lovable publish gate, neither of them in
// the audit's numbered list. Both are the same shape: the product claimed
// something the database had never allowed, and the mismatch read as "there is
// nothing here" rather than as a fault.
//
//   The activity feeds. useActivityEvents treated `team_id IS NULL` events as a
//   public feed. The SELECT policy is "your own events, or your teams'", so a
//   visitor got an empty list under the words "see what's happening across the
//   Querino community", and somebody else's activity page was empty for
//   everyone who looked at it. The decision taken: activity is private. Every
//   event on that table is ai_insights_generated or ai_insights_refreshed and
//   carries the id of the artifact it ran on, most of which are private, so
//   publishing them to fix a feed nobody could see would have been a trade
//   with nothing on the other side.
//
//   The coach conversations. 74 of 80 rows in prompt_coach_messages had a NULL
//   user_id against a `user_id = auth.uid()` read policy, so they were
//   readable by nobody, including the people who had the conversations.

import { test, expect } from "@playwright/test";
import { ANON_KEY, REST_URL } from "./helpers/env";
import { restAsService, restAsUser, signInTestUser } from "./helpers/api";

test.describe("Activity is private, and the app now says so", () => {
  test("a logged-out visitor sees no activity at all", async () => {
    const res = await fetch(
      `${REST_URL}/activity_events?select=id,actor_id,item_id&team_id=is.null&limit=50`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    const body = await res.json();
    expect(
      Array.isArray(body) ? body.length : -1,
      "a stranger can read activity events, which carry the ids of private artifacts",
    ).toBe(0);
  });

  test("a logged-in user sees only their own events", async () => {
    const { userId } = await signInTestUser();
    const res = await restAsUser<Array<{ actor_id: string; team_id: string | null }>>(
      "activity_events?select=actor_id,team_id&limit=100",
    );
    expect(res.ok, `reading activity failed: ${JSON.stringify(res.error)}`).toBe(true);

    for (const row of res.data ?? []) {
      const mine = row.actor_id === userId;
      const teamEvent = row.team_id !== null;
      expect(
        mine || teamEvent,
        "an event that is neither yours nor a team's came back, so the feed is leaking",
      ).toBe(true);
    }
  });

  test("there are events to be wrong about, so the checks above mean something", async () => {
    const res = await restAsService<Array<{ id: string }>>("activity_events?select=id&limit=5");
    expect(
      (res.data ?? []).length,
      "the table is empty, so nothing above proves anything",
    ).toBeGreaterThan(0);
  });

  test("the published site no longer offers a community feed", async () => {
    // The Activity page is a lazily loaded chunk, so searching the main bundle
    // for its copy finds nothing whether the bug is there or not. The main
    // bundle does name every chunk it can import, and Vite names this one after
    // the page, so follow the reference and read the page's own code.
    const html = await (await fetch("https://querino.ai")).text();
    const main = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
    expect(main, "no main bundle in the published HTML").toBeTruthy();

    const mainJs = await (await fetch(`https://querino.ai${main}`)).text();
    const chunks = [...new Set(mainJs.match(/Activity[A-Za-z]*-[A-Za-z0-9_-]+\.js/g) ?? [])];
    expect(chunks.length, "the site names no Activity chunk, so this checks nothing").toBeGreaterThan(0);

    let searched = 0;
    for (const chunk of chunks) {
      const res = await fetch(`https://querino.ai/assets/${chunk}`);
      if (!res.ok) continue;
      const code = await res.text();
      searched++;
      expect(
        code.includes("across the Querino community"),
        `${chunk} still promises a public activity feed that row-level security has never allowed`,
      ).toBe(false);
    }
    expect(searched, "none of the Activity chunks could be fetched").toBeGreaterThan(0);
  });
});

test.describe("A coach conversation belongs to someone", () => {
  test("no message is ownerless", async () => {
    for (const table of ["prompt_coach_messages", "prompt_kit_coach_messages"]) {
      const res = await restAsService<Array<{ id: number }>>(
        `${table}?select=id&user_id=is.null`,
      );
      expect(res.ok, `reading ${table} failed: ${JSON.stringify(res.error)}`).toBe(true);
      expect(
        (res.data ?? []).length,
        `${table} holds conversations that their own authors cannot read`,
      ).toBe(0);
    }
  });

  test("an ownerless message cannot be written", async () => {
    const res = await restAsService("prompt_coach_messages", {
      method: "POST",
      body: { session_id: "security-suite-probe", message: { type: "human", content: "probe" } },
    });
    expect(
      res.ok,
      "a coach message with no owner was accepted, so the invisible-history bug can come back",
    ).toBe(false);
    expect(JSON.stringify(res.error)).toMatch(/null value|not-null/i);
  });

  test("a user cannot read another user's coach conversation", async () => {
    const { userId } = await signInTestUser();
    const res = await restAsUser<Array<{ user_id: string }>>(
      "prompt_coach_messages?select=user_id&limit=100",
    );
    expect(res.ok).toBe(true);
    for (const row of res.data ?? []) {
      expect(row.user_id, "somebody else's coach conversation came back").toBe(userId);
    }
  });

  test("deleting an account takes its coach history with it", async () => {
    // Checked as a constraint rather than by deleting an account: the cascade
    // is the mechanism, and nothing else in the codebase cleans these tables.
    const res = await restAsService<Array<{ count: number }>>(
      "rpc/tokens_per_credit",
      { method: "POST", body: {} },
    );
    expect(res.ok).toBe(true); // the RPC path works, so the probe below is meaningful

    const probe = await fetch(
      `https://api.supabase.com/v1/projects/${process.env.QUERINO_PROJECT_REF ?? "zvuwkffneqxqsihlnfsd"}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          query: `select count(*)::int as fks from pg_constraint
                   where conrelid in ('public.prompt_coach_messages'::regclass,
                                      'public.prompt_kit_coach_messages'::regclass)
                     and contype = 'f'
                     and confdeltype = 'c';`,
        }),
      },
    );
    const rows = (await probe.json()) as Array<{ fks: number }>;
    expect(
      rows?.[0]?.fks,
      "coach history is not cascaded on account deletion, so it outlives the account",
    ).toBe(2);
  });
});
