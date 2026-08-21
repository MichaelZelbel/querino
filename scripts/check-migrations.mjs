#!/usr/bin/env node
//
// Two rules about migrations, enforced before they are applied.
//
// Phase 3 item 1 of the 2026-08-20 audit. That audit's one piece of genuinely
// good news was that all 71 SECURITY DEFINER functions set search_path and all
// 51 tables had row-level security switched on. Nobody had made that true by
// accident, and nothing was keeping it true. This is what keeps it true for
// free.
//
//   1. A SECURITY DEFINER function runs as its owner. Without SET search_path
//      the caller chooses which schema its unqualified names resolve to, and
//      can point them at a table they control. It is the classic Postgres
//      privilege escalation, and Supabase's own advisor flags it.
//
//   2. A table in `public` with no row-level security is readable by anyone
//      holding the anon key, which ships in the browser bundle. There is no
//      such thing as a private table without RLS.
//
//   3. A view in `public` runs as its OWNER unless it says security_invoker,
//      and its owner is not subject to row-level security. This audit made that
//      exact mistake on 21 August: a CREATE OR REPLACE VIEW that only meant to
//      add DISTINCT ON silently dropped the security_invoker option the view
//      had carried since January, and for about an hour every user's AI credit
//      balance was readable with the public anon key. The default is the
//      dangerous one and the mistake is invisible in a diff, so the option has
//      to be stated either way.
//
// This reads the migration files rather than the database, so it fails in the
// pull request rather than after deployment. tests/security/14 asserts the same
// two things against the running project, which is the version that cannot be
// fooled by a change made outside a migration.
//
// Usage:
//   node scripts/check-migrations.mjs             every migration
//   node scripts/check-migrations.mjs <file...>   just these

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MIGRATIONS = join(ROOT, "supabase", "migrations");

/**
 * Remove -- line comments and block comments, but leave dollar-quoted bodies
 * alone: a function body legitimately contains both, and cutting inside one
 * would change what the scan below sees.
 */
function stripComments(sql) {
  let out = "";
  let i = 0;
  let dollarTag = null;

  while (i < sql.length) {
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        out += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
      } else {
        out += sql[i++];
      }
      continue;
    }

    const dollar = /^\$[A-Za-z_]*\$/.exec(sql.slice(i, i + 40));
    if (dollar) {
      dollarTag = dollar[0];
      out += dollarTag;
      i += dollarTag.length;
      continue;
    }

    if (sql.startsWith("--", i)) {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? sql.length : nl;
      continue;
    }

    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }

    if (sql[i] === "'") {
      out += sql[i++];
      while (i < sql.length) {
        out += sql[i];
        if (sql[i] === "'" && sql[i + 1] !== "'") { i++; break; }
        if (sql[i] === "'" && sql[i + 1] === "'") { out += sql[++i]; }
        i++;
      }
      continue;
    }

    out += sql[i++];
  }
  return out;
}

/**
 * The header of every CREATE FUNCTION in the file: everything from CREATE up
 * to where the body starts. SECURITY DEFINER and SET search_path both live
 * there, so there is no need to parse a function body at all.
 */
function functionHeaders(sql) {
  const headers = [];
  const re = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([A-Za-z0-9_."]+)/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const rest = sql.slice(m.index);
    // The body begins at AS $tag$ or AS '...'; also stop at the next CREATE so
    // a function with no body at all cannot swallow the file.
    const bodyAt = rest.search(/\bAS\s+(?:\$[A-Za-z_]*\$|')/i);
    const nextCreate = rest.slice(1).search(/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/i);
    const ends = [bodyAt, nextCreate === -1 ? -1 : nextCreate + 1, rest.length]
      .filter((n) => n > 0);
    headers.push({ name: m[1], text: rest.slice(0, Math.min(...ends)), index: m.index });
  }
  return headers;
}

function lineOf(sql, index) {
  return sql.slice(0, index).split("\n").length;
}

/**
 * Every CREATE VIEW header in the file, keyed by view name. Only the header
 * matters: WITH (security_invoker = ...) lives between the name and the AS.
 */
function createdViews(sql) {
  const views = [];
  const re = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?([A-Za-z0-9_]+)"?/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const qualified = /VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)\./i.exec(
      sql.slice(m.index, m.index + 120),
    );
    if (qualified && qualified[1].toLowerCase() !== "public") continue;
    const rest = sql.slice(m.index);
    // Stop at the AS that introduces the query, not at an "as" inside a name.
    const asAt = rest.search(/\bAS\b/i);
    views.push({
      name: m[1],
      header: rest.slice(0, asAt === -1 ? Math.min(rest.length, 400) : asAt),
      index: m.index,
    });
  }
  return views;
}

function createdTables(sql) {
  const tables = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?([A-Za-z0-9_]+)"?/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const before = sql.slice(Math.max(0, m.index - 30), m.index);
    // Temporary tables live for one transaction and have no RLS story.
    if (/\b(TEMP|TEMPORARY|UNLOGGED)\s*$/i.test(before)) continue;
    // Only `public` is exposed through PostgREST.
    const qualified = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)\./i.exec(
      sql.slice(m.index, m.index + 120),
    );
    if (qualified && qualified[1].toLowerCase() !== "public") continue;
    tables.push({ name: m[1], index: m.index });
  }
  return tables;
}

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = files.length
  ? files
  : readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort().map((f) => join(MIGRATIONS, f));

// RLS may be switched on by a later migration than the one that made the
// table, so every file is read before anything is judged. Files named on the
// command line are included too, so checking one file in isolation still sees
// its own ALTER TABLE.
const allSql = [
  ...new Set([
    ...readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).map((f) => join(MIGRATIONS, f)),
    ...targets,
  ]),
]
  .map((path) => stripComments(readFileSync(path, "utf8")))
  .join("\n");

function rlsIsEnabledFor(table) {
  const re = new RegExp(
    `ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(?:public\\.)?"?${table}"?\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
    "i",
  );
  return re.test(allSql);
}

// A view is whatever its most recent CREATE OR REPLACE says, so only the last
// definition of each one is judged. That way an old migration carrying an old
// mistake is not reported for ever after a later migration fixed it.
const latestViewDefinition = new Map();
for (const path of [...new Set([
  ...readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort().map((f) => join(MIGRATIONS, f)),
  ...targets,
])]) {
  const sql = stripComments(readFileSync(path, "utf8"));
  for (const view of createdViews(sql)) {
    latestViewDefinition.set(view.name, { ...view, path, sql });
  }
}

const problems = [];
let functionsChecked = 0;
let tablesChecked = 0;
let viewsChecked = 0;

for (const [name, view] of latestViewDefinition) {
  // Only judge views this run was actually asked about.
  if (targets.length && !targets.includes(view.path)) continue;
  viewsChecked++;
  if (!/\bsecurity_invoker\b/i.test(view.header)) {
    problems.push(
      `${basename(view.path)}:${lineOf(view.sql, view.index)}  public.${name} is created without security_invoker.
` +
        `    A view runs as its OWNER by default, and the owner is not subject to row-level security,
` +
        `    so this hands every row of its base tables to anyone who can reach the view.
` +
        `    Add:  WITH (security_invoker = on)   right after the view name, or say = off deliberately.`,
    );
  }
}

for (const path of targets) {
  const raw = readFileSync(path, "utf8");
  const sql = stripComments(raw);
  const file = basename(path);

  for (const fn of functionHeaders(sql)) {
    if (!/\bSECURITY\s+DEFINER\b/i.test(fn.text)) continue;
    functionsChecked++;
    if (!/\bSET\s+search_path\b/i.test(fn.text)) {
      problems.push(
        `${file}:${lineOf(sql, fn.index)}  ${fn.name} is SECURITY DEFINER with no SET search_path.\n` +
          `    It runs as its owner, so the caller decides what its unqualified names mean.\n` +
          `    Add:  SET search_path = public, pg_temp`,
      );
    }
  }

  for (const table of createdTables(sql)) {
    tablesChecked++;
    if (!rlsIsEnabledFor(table.name)) {
      problems.push(
        `${file}:${lineOf(sql, table.index)}  public.${table.name} is created with no row-level security.\n` +
          `    Every table in public is reachable with the anon key, which ships in the browser bundle.\n` +
          `    Add:  ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;  and the policies it needs.`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`Migration check failed, ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  process.exit(1);
}

console.log(
  `Migrations OK: ${functionsChecked} SECURITY DEFINER function${functionsChecked === 1 ? "" : "s"} all set search_path, ` +
    `${tablesChecked} table${tablesChecked === 1 ? "" : "s"} all have row-level security, ` +
    `${viewsChecked} view${viewsChecked === 1 ? "" : "s"} all state security_invoker.`,
);
