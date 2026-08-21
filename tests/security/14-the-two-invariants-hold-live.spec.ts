// The structural rules the August 2026 audit found already right, kept right,
// plus the one this audit broke itself and had to put back.
//
// scripts/check-migrations.mjs enforces the same rules by reading the migration
// files, which fails in the pull request and needs no credentials at all. This
// is the other end: it asks the running database, so it also catches a change
// made in the Supabase dashboard, by Lovable's agent, or by anything else that
// never passed through a migration file.
//
//   Every SECURITY DEFINER function sets search_path. Without it the function
//   runs as its owner while the CALLER decides what its unqualified names
//   resolve to. It is the standard Postgres privilege escalation.
//
//   Every table in `public` has row-level security. Everything in public is
//   reachable with the anon key, and the anon key ships in the browser bundle.
//
//   Every view in `public` sets security_invoker, for the same reason: a view
//   runs as its owner, and its owner is not subject to RLS. Test 15 shows what
//   losing that costs.
//
// It reads them through public.security_invariants(), a service-role-only
// function, rather than through the Management API. The Management API needs
// SUPABASE_ACCESS_TOKEN, which is scoped to the whole Supabase account; this
// repository is public and its CI should not hold a credential that reaches
// every project Michael owns. The service role key reaches this project only.

import { test, expect } from "@playwright/test";
import { restAsService } from "./helpers/api";

interface Violation {
  kind: string;
  name: string;
  detail: string;
}

// Tables deliberately closed to every user, because only the service role
// touches them from inside an edge function. RLS on with no policy is the
// correct shape for those, and Supabase's own advisor rates it INFO, not an
// error. Anything NOT listed here that turns up closed is a table somebody
// switched RLS on for to clear a warning and then walked away from.
const DELIBERATELY_SERVICE_ROLE_ONLY = ["github_sync_state"];

async function violations(): Promise<Violation[]> {
  const res = await restAsService<Violation[]>("rpc/security_invariants", {
    method: "POST",
    body: {},
  });
  expect(res.ok, `security_invariants() failed: ${JSON.stringify(res.error)}`).toBe(true);
  return res.data ?? [];
}

function describeAll(rows: Violation[]): string[] {
  return rows.map((r) => `${r.name} (${r.detail})`);
}

test.describe("The structural rules, asked of the running database", () => {
  test("every SECURITY DEFINER function sets search_path", async () => {
    const bad = (await violations()).filter((v) => v.kind === "function_without_search_path");
    expect(
      describeAll(bad),
      "these run as their owner while the caller picks what their unqualified names mean",
    ).toEqual([]);
  });

  test("every table in public has row-level security", async () => {
    const bad = (await violations()).filter((v) => v.kind === "table_without_rls");
    expect(
      describeAll(bad),
      "these are readable by anyone holding the anon key, which is in every visitor's browser",
    ).toEqual([]);
  });

  test("every view in public runs as its caller", async () => {
    const bad = (await violations()).filter((v) => v.kind === "view_without_security_invoker");
    expect(
      describeAll(bad),
      "a view without security_invoker runs as its owner, which row-level security does not " +
        "apply to, so it hands every row of its base tables to anyone who can reach it",
    ).toEqual([]);
  });

  test("no NEW table is closed to everyone by accident", async () => {
    const bad = (await violations())
      .filter((v) => v.kind === "table_closed_to_everyone")
      .filter((v) => !DELIBERATELY_SERVICE_ROLE_ONLY.includes(v.name));

    expect(
      describeAll(bad),
      "row-level security is on with no policy, so these are closed to every user. If that is " +
        "deliberate because only an edge function touches them, add them to " +
        "DELIBERATELY_SERVICE_ROLE_ONLY with the reason.",
    ).toEqual([]);
  });

  test("and there is enough schema for any of that to mean something", async () => {
    const res = await restAsService<
      Array<{ security_definer_functions: number; public_tables: number; public_views: number }>
    >("rpc/security_invariants_scope", { method: "POST", body: {} });
    expect(res.ok, `the scope query failed: ${JSON.stringify(res.error)}`).toBe(true);

    const scope = res.data![0];
    expect(scope.security_definer_functions, "no SECURITY DEFINER functions, so the check is vacuous")
      .toBeGreaterThan(40);
    expect(scope.public_tables, "no tables in public, so the check is vacuous").toBeGreaterThan(40);
    expect(scope.public_views, "no views in public, so the check is vacuous").toBeGreaterThan(0);
  });

  test("the invariants function is not reachable by a browser session", async () => {
    const { restAsUser } = await import("./helpers/api");
    const res = await restAsUser("rpc/security_invariants", { method: "POST", body: {} });
    expect(
      res.status,
      "a logged-in user can enumerate this project's security posture",
    ).toBe(403);
  });

  test("Supabase's own advisor reports no error-level finding", async () => {
    // The only check here that needs the account-scoped token, so it is skipped
    // in CI rather than putting that token in a public repository's secrets.
    const token = process.env.SUPABASE_ACCESS_TOKEN;
    test.skip(!token, "SUPABASE_ACCESS_TOKEN is not set, so the advisor cannot be asked");

    const ref = process.env.QUERINO_PROJECT_REF ?? "zvuwkffneqxqsihlnfsd";
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/advisors/security`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok, `the advisor endpoint answered ${res.status}`).toBe(true);

    const body = (await res.json()) as {
      lints?: Array<{ level: string; name: string; detail: string }>;
    };
    const errors = (body.lints ?? []).filter((l) => l.level === "ERROR");
    expect(
      errors.map((l) => `${l.name}: ${l.detail}`),
      "an error-level advisor finding also gates publishing from Lovable",
    ).toEqual([]);
  });
});
