// Tests for scripts/check-migration-grants.mjs, run by `npm run test:scripts`.
// One fixture folder must pass, the other must fail for exactly the reasons
// written into it, and an old migration without grants is reported, not failed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  checkGrants,
  readMigrations,
} from "../../scripts/check-migration-grants.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "..", "..", "scripts", "check-migration-grants.mjs");
const PASS = join(HERE, "fixtures", "grants-pass");
const FAIL = join(HERE, "fixtures", "grants-fail");

test("a migration that grants or revokes every relation it creates passes", () => {
  const { problems, judged } = checkGrants(readMigrations(PASS));
  assert.deepEqual(problems, []);
  assert.equal(judged, 4); // widgets, widget_secrets, widget_events, widget_names
  const run = spawnSync(process.execPath, [SCRIPT, "--dir", PASS], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
});

test("a missing grant and an ungranted serial sequence fail; an old file is only reported", () => {
  const { problems, older } = checkGrants(readMigrations(FAIL));
  assert.equal(problems.length, 2, problems.join("\n"));
  assert.match(problems.join("\n"), /public\.gadgets\.id is a serial/);
  assert.match(
    problems.join("\n"),
    /public\.gadget_counts \(materialized view\) is created/,
  );
  assert.deepEqual(older, [
    "20251201000000_an_old_table.sql  public.legacy_things (table)",
  ]);
  const run = spawnSync(process.execPath, [SCRIPT, "--dir", FAIL], {
    encoding: "utf8",
  });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /1 relation in 1 migration before/);
});

test("re-creating an existing view with OR REPLACE keeps its grants and is not judged", () => {
  const { problems } = checkGrants([
    {
      file: "20261101000000_a.sql",
      sql: "create view public.v as select 1; grant select on public.v to anon;",
    },
    {
      file: "20261102000000_b.sql",
      sql: "create or replace view public.v as select 2;",
    },
  ]);
  assert.deepEqual(problems, []);
});

test("a view dropped and created again needs its grant again", () => {
  const { problems } = checkGrants([
    {
      file: "20261101000000_a.sql",
      sql: "create view public.v as select 1; grant select on public.v to anon;",
    },
    {
      file: "20261102000000_b.sql",
      sql: "drop view public.v; create or replace view public.v as select 2;",
    },
  ]);
  assert.equal(problems.length, 1);
});

test("tables outside public, and temporary tables, are not judged", () => {
  const { problems } = checkGrants([
    {
      file: "20261101000000_a.sql",
      sql: 'create table private.x (id int); create temp table t (id int); create table "auth"."y" (id int);',
    },
  ]);
  assert.deepEqual(problems, []);
});

test("an older relation is covered once a later migration grants or revokes it", () => {
  const old = {
    file: "20251201000000_old.sql",
    sql: "create table public.a (id int); create table public.b (id int); create table public.c (id int);",
  };
  const before = checkGrants([old]);
  assert.equal(before.older.length, 3);
  const after = checkGrants([
    old,
    {
      file: "20261101000000_catch_up.sql",
      sql: "grant all on public.a to service_role; revoke all on public.b from anon;",
    },
  ]);
  assert.deepEqual(after.older, ["20251201000000_old.sql  public.c (table)"]);
  assert.equal(after.coveredLater, 2);
  assert.deepEqual(after.problems, []);
});

test("a schema-wide partial revoke does not count as stating a table's grants", () => {
  const { older, problems } = checkGrants([
    { file: "20251201000000_old.sql", sql: "create table public.a (id int);" },
    {
      file: "20251202000000_tighten.sql",
      sql: "revoke truncate, trigger on all tables in schema public from anon;",
    },
    {
      file: "20261101000000_new.sql",
      sql: "create table public.n (id int); revoke truncate on all tables in schema public from anon;",
    },
  ]);
  assert.equal(older.length, 1);
  assert.equal(problems.length, 1);
});
