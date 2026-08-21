// Phase 2 of the 2026-08-20 audit: there is one implementation of the credit
// path, and it reads one source of truth for who is premium.
//
//   M1  profiles.plan_type used to decide how many AI credits a user got,
//       while user_roles decided everything else. A free user who could write
//       their own profile row could therefore buy credits with a column. The
//       Phase 0 trigger stopped the write; this stops the column mattering.
//
//   M5  v_ai_allowance_current returned every active period, and llm.ts reads
//       it with maybeSingle(), which ERRORS on a second row. Two overlapping
//       periods disabled AI for that account until a human fixed the table.
//
//   M6  tokens_per_credit fell back to 2000 in the charge path and 200 in the
//       grant path, so a missing settings row would have granted and charged
//       on scales ten times apart.
//
// These run against the deployed project, and they put back anything they
// move.

import { test, expect } from "@playwright/test";
import { restAsService, restAsUser, signInTestUser, sqlProbe } from "./helpers/api";

interface Allowance {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  tokens_granted: number;
  tokens_used: number;
  source: string;
  metadata: Record<string, unknown>;
  created: boolean;
}

async function ensure(userId: string, extra: Record<string, unknown> = {}): Promise<Allowance> {
  const res = await restAsService<Allowance[]>("rpc/ensure_ai_allowance", {
    method: "POST",
    body: { _user_id: userId, _created_by: "security-suite", ...extra },
  });
  if (!res.ok) throw new Error(`ensure_ai_allowance failed: ${JSON.stringify(res.error)}`);
  return res.data![0];
}

async function periodsOf(userId: string) {
  const res = await restAsService<Array<{ id: string }>>(
    `ai_allowance_periods?user_id=eq.${userId}&select=id,period_start,period_end,tokens_granted,tokens_used,source,metadata`,
  );
  return res.data ?? [];
}

test.describe("M6 — one conversion rate, and it refuses to guess", () => {
  test("tokens_per_credit() is a single positive number", async () => {
    const res = await restAsService<number>("rpc/tokens_per_credit", { method: "POST", body: {} });
    expect(res.ok, `tokens_per_credit() failed: ${JSON.stringify(res.error)}`).toBe(true);
    expect(Number(res.data)).toBeGreaterThan(0);
  });

  test("the settings row cannot be emptied to a guess", async () => {
    const res = await restAsService("ai_credit_settings?key=eq.tokens_per_credit", {
      method: "PATCH",
      body: { value_int: null },
    });
    expect(
      res.ok,
      "tokens_per_credit was set to NULL, which is what put the grant path and the charge path ten times apart",
    ).toBe(false);
  });

  test("the grant path and the charge path agree on the rate", async () => {
    const rate = Number(
      (await restAsService<number>("rpc/tokens_per_credit", { method: "POST", body: {} })).data,
    );

    const view = await restAsUser<Array<{ tokens_per_credit: number }>>(
      "v_ai_allowance_current?select=tokens_per_credit&limit=1",
    );
    expect(view.ok).toBe(true);
    if (view.data?.length) {
      expect(Number(view.data[0].tokens_per_credit)).toBe(rate);
    }
  });
});

test.describe("M5 — one active allowance period per user, enforced", () => {
  test("the view never returns a user twice", async () => {
    const rows = await restAsService<Array<{ user_id: string }>>(
      "v_ai_allowance_current?select=user_id",
    );
    expect(rows.ok).toBe(true);
    const ids = (rows.data ?? []).map((r) => r.user_id);
    expect(
      ids.length - new Set(ids).size,
      "a user has two current periods, which makes assertCredits fail closed for them for ever",
    ).toBe(0);
  });

  test("an overlapping period cannot be inserted", async () => {
    const { userId } = await signInTestUser();
    const existing = (await periodsOf(userId)).length;

    const res = await restAsService("ai_allowance_periods", {
      method: "POST",
      body: {
        user_id: userId,
        period_start: new Date(Date.now() - 86_400_000).toISOString(),
        period_end: new Date(Date.now() + 86_400_000).toISOString(),
        tokens_granted: 1,
        tokens_used: 0,
        source: "security_suite_overlap_probe",
      },
    });

    expect(res.ok, "an overlapping allowance period was accepted").toBe(false);
    expect(JSON.stringify(res.error)).toMatch(/exclu|overlap|conflicting key/i);

    // Nothing was left behind.
    expect((await periodsOf(userId)).length).toBe(existing);
  });

  test("a period that would overlap comes back as the existing one, not an error", async () => {
    const { userId } = await signInTestUser();
    const before = await periodsOf(userId);

    const row = await ensure(userId, {
      _period_start: new Date(Date.now() - 86_400_000).toISOString(),
      _period_end: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(row.created, "a second overlapping period was created").toBe(false);
    expect((await periodsOf(userId)).length).toBe(before.length);
  });
});

test.describe("M1 — user_roles decides who is premium, not a profile column", () => {
  // Showing this needs the drifted state the Phase 0 trigger exists to prevent:
  // a profile that says premium while user_roles does not. Staging it through
  // PostgREST would mean deleting the account's live allowance period and
  // putting it back, and a suite that can leave the test account with no
  // credits is worse than the bug it is checking for. It runs inside a
  // transaction that is rolled back instead.
  test("plan_type='premium' without the role buys nothing", async () => {
    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        u uuid;
        r record;
        log text := '';
      BEGIN
        SELECT p.id INTO u FROM public.profiles p
         WHERE NOT public.is_premium_user(p.id)
         LIMIT 1;
        IF u IS NULL THEN
          RAISE EXCEPTION 'PROBE SKIP no non-premium account exists';
        END IF;

        UPDATE public.profiles SET plan_type = 'premium' WHERE id = u;
        IF public.is_premium_user(u) THEN
          RAISE EXCEPTION 'PROBE FAILED is_premium_user followed the column';
        END IF;
        log := log || 'is_premium_user ignored plan_type; ';

        DELETE FROM public.ai_allowance_periods WHERE user_id = u;
        SELECT * INTO r FROM public.ensure_ai_allowance(u);
        log := log || format('grant source=%s base=%s', r.source, r.metadata->>'base_tokens');

        IF r.source <> 'free_tier' THEN
          RAISE EXCEPTION 'PROBE FAILED profiles.plan_type still decides the grant: %', log;
        END IF;

        RAISE EXCEPTION 'PROBE OK %', log;
      END $probe$;
    `);

    expect(out, `the second source of truth is still alive: ${out}`).toContain("PROBE OK");
    expect(out).toContain("source=free_tier");
  });

  test("a premium role grants the premium amount", async () => {
    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        u uuid;
        r record;
        v_prem bigint;
      BEGIN
        SELECT p.id INTO u FROM public.profiles p
         WHERE NOT public.is_premium_user(p.id)
         LIMIT 1;
        IF u IS NULL THEN
          RAISE EXCEPTION 'PROBE SKIP no non-premium account exists';
        END IF;

        SELECT value_int::bigint * public.tokens_per_credit() INTO v_prem
          FROM public.ai_credit_settings WHERE key = 'credits_premium_per_month';

        UPDATE public.user_roles SET role = 'premium' WHERE user_id = u;
        INSERT INTO public.user_roles (user_id, role)
        SELECT u, 'premium'
        WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = u);

        DELETE FROM public.ai_allowance_periods WHERE user_id = u;
        SELECT * INTO r FROM public.ensure_ai_allowance(u);

        IF r.source <> 'subscription' OR (r.metadata->>'base_tokens')::bigint <> v_prem THEN
          RAISE EXCEPTION 'PROBE FAILED premium role got source=% base=%, expected subscription and %',
            r.source, r.metadata->>'base_tokens', v_prem;
        END IF;

        RAISE EXCEPTION 'PROBE OK a premium role granted % tokens', r.metadata->>'base_tokens';
      END $probe$;
    `);

    expect(out, `a premium role did not buy the premium grant: ${out}`).toContain("PROBE OK");
  });

  test("unused tokens roll over, capped at one month", async () => {
    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        u uuid;
        r record;
        v_base bigint;
      BEGIN
        SELECT p.id INTO u FROM public.profiles p
         WHERE NOT public.is_premium_user(p.id)
         LIMIT 1;

        SELECT value_int::bigint * public.tokens_per_credit() INTO v_base
          FROM public.ai_credit_settings WHERE key = 'credits_free_per_month';

        DELETE FROM public.ai_allowance_periods WHERE user_id = u;
        INSERT INTO public.ai_allowance_periods
          (user_id, period_start, period_end, tokens_granted, tokens_used, source)
        VALUES (u, now() - interval '2 month', now() - interval '1 month', v_base, v_base / 2, 'free_tier');

        SELECT * INTO r FROM public.ensure_ai_allowance(u);
        IF (r.metadata->>'rollover_tokens')::bigint <> v_base / 2 THEN
          RAISE EXCEPTION 'PROBE FAILED rollover was % not %', r.metadata->>'rollover_tokens', v_base / 2;
        END IF;

        DELETE FROM public.ai_allowance_periods WHERE user_id = u;
        INSERT INTO public.ai_allowance_periods
          (user_id, period_start, period_end, tokens_granted, tokens_used, source)
        VALUES (u, now() - interval '2 month', now() - interval '1 month', v_base * 99, 0, 'free_tier');

        SELECT * INTO r FROM public.ensure_ai_allowance(u);
        IF (r.metadata->>'rollover_tokens')::bigint <> v_base THEN
          RAISE EXCEPTION 'PROBE FAILED rollover was not capped at one month, got %',
            r.metadata->>'rollover_tokens';
        END IF;

        RAISE EXCEPTION 'PROBE OK rollover carries and caps at %', v_base;
      END $probe$;
    `);

    expect(out, `rollover is not behaving: ${out}`).toContain("PROBE OK");
  });
});

test.describe("S4 — the implementation is in one place", () => {
  test("ensure_ai_allowance is not reachable by an ordinary user", async () => {
    const { userId } = await signInTestUser();
    const res = await restAsUser("rpc/ensure_ai_allowance", {
      method: "POST",
      body: { _user_id: userId, _force_tokens: 999_999_999 },
    });
    expect(
      res.status,
      "a logged-in user could grant themselves an allowance directly in the database",
    ).toBe(403);
  });

  test("calling it twice creates one period", async () => {
    const { userId } = await signInTestUser();
    const before = await periodsOf(userId);
    const a = await ensure(userId);
    const b = await ensure(userId);
    expect(a.id).toBe(b.id);
    expect(a.created).toBe(false);
    expect(b.created).toBe(false);
    expect((await periodsOf(userId)).length).toBe(before.length);
  });
});
