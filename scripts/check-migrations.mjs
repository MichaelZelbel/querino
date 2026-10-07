#!/usr/bin/env node
//
// Four rules about migrations, enforced before they are applied.
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
//   4. A SECURITY DEFINER function says who may call it (migrations from
//      2026-09-30 on). A new function in public is executable by three
//      grantees at once: PUBLIC, which Postgres grants by default, and anon and
//      authenticated by name, which Supabase's default privileges for postgres
//      add. So a definer function is callable with the anon key from the
//      moment it exists. That is how enqueue_github_sync was open to anyone
//      until 2026-09-09. Revoking from one of the three leaves the others:
//      20260909010000 revoked from anon while PUBLIC still had it, and
//      20260427121349 revoked from PUBLIC while anon and authenticated kept
//      lookup_mcp_token until 2026-09-30. So the file that creates one must
//      revoke from PUBLIC and from anon, and either revoke from or grant to
//      authenticated; or grant it to PUBLIC or anon on purpose. Older files
//      predate the rule and are judged live by tests/security/28 instead.
//
// Each rule is about the state a migration leaves behind, so an ALTER that
// takes the property away counts as much as a CREATE that never had it. Until
// 2026-10-07 only CREATE headers were read, and four statements walked past
// the rules: ALTER TABLE ... DISABLE ROW LEVEL SECURITY (or NO FORCE), ALTER
// FUNCTION ... SECURITY DEFINER with no search_path, ALTER VIEW ... SET
// (security_invoker = off), and a SECURITY DEFINER function whose body was a
// single-quoted string, because the attribute scan stopped at the quote. Each
// is caught now, and PROCEDURE and ROUTINE are read wherever FUNCTION is.
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
 * A dollar-quote tag: $$, $body$, $fn1$. A tag may contain digits after its
 * first character; `$1` is a parameter, not a tag.
 */
const DOLLAR_TAG = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/;

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

    const dollar = DOLLAR_TAG.exec(sql.slice(i, i + 70));
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
        if (sql[i] === "'" && sql[i + 1] !== "'") {
          i++;
          break;
        }
        if (sql[i] === "'" && sql[i + 1] === "'") {
          out += sql[++i];
        }
        i++;
      }
      continue;
    }

    out += sql[i++];
  }
  return out;
}

/**
 * The index just past the end of the string literal that opens at `open`
 * (which points at its quote). '' is an escaped quote; in an E'' string a
 * backslash escapes the next character too.
 */
function endOfQuoted(sql, open, backslashEscapes) {
  let i = open + 1;
  while (i < sql.length) {
    if (backslashEscapes && sql[i] === "\\") {
      i += 2;
      continue;
    }
    if (sql[i] === "'") {
      if (sql[i + 1] === "'") {
        i += 2;
        continue;
      }
      return i + 1;
    }
    i++;
  }
  return sql.length;
}

/**
 * The attributes of every CREATE FUNCTION (or PROCEDURE) in the file:
 * everything from CREATE up to where the body starts, plus whatever follows
 * the body up to the statement's semicolon. Postgres accepts SECURITY DEFINER
 * and SET search_path on either side of the body, and three migrations in
 * this repository write them after it (`$$ LANGUAGE plpgsql SECURITY
 * DEFINER;`). Until 2026-09-08 only the part before the body was read, so a
 * function written that way with no search_path passed this check as "not
 * SECURITY DEFINER at all". Until 2026-10-07 the same was true of a body
 * written as a quoted string (`AS 'select 1' LANGUAGE sql SECURITY DEFINER`):
 * only a dollar-quoted body had its far side read.
 */
function functionHeaders(sql) {
  const headers = [];
  const re =
    /CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+([A-Za-z0-9_."]+)/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const rest = sql.slice(m.index);
    // The body begins at AS $tag$ or AS '...' (or E'...'); also stop at the
    // next CREATE so a function with no body at all cannot swallow the file.
    const body = /\bAS\s+(\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$|E'|')/i.exec(rest);
    const bodyAt = body ? body.index : -1;
    const nextCreate = rest
      .slice(1)
      .search(/\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\b/i);
    const ends = [
      bodyAt,
      nextCreate === -1 ? -1 : nextCreate + 1,
      rest.length,
    ].filter((n) => n > 0);
    let text = rest.slice(0, Math.min(...ends));

    // The trailing attributes: from the end of the body to the semicolon that
    // ends the statement. Comments are already stripped and the body is
    // skipped whole, so the first semicolon after it is the statement's own.
    if (body) {
      let after = -1;
      if (body[1].startsWith("$")) {
        const tag = body[1];
        const close = rest.indexOf(tag, body.index + body[0].length);
        if (close !== -1) after = close + tag.length;
      } else {
        // A quoted body, and for a C function a second string, the link
        // symbol: AS 'obj_file', 'link_symbol'.
        const quote = body.index + body[0].length - 1;
        after = endOfQuoted(rest, quote, body[1].length === 2);
        const link = /^\s*,\s*([Ee]?)'/.exec(rest.slice(after));
        if (link) {
          after = endOfQuoted(rest, after + link[0].length - 1, link[1] !== "");
        }
      }
      if (after !== -1) {
        const tail = rest.slice(after);
        const semi = tail.indexOf(";");
        text += " " + (semi === -1 ? tail : tail.slice(0, semi));
      }
    }

    headers.push({ name: m[1], text, index: m.index });
  }
  return headers;
}

/** public.foo, "public"."foo", foo  ->  foo (lower case). */
function bareName(name) {
  return name
    .replace(/"/g, "")
    .replace(/^public\./i, "")
    .toLowerCase();
}

/** Whether a possibly qualified name lives outside `public`. */
function outsidePublic(name) {
  const parts = name.replace(/"/g, "").split(".");
  return parts.length > 1 && parts[0].toLowerCase() !== "public";
}

/**
 * Every ALTER FUNCTION / PROCEDURE / ROUTINE statement in the file, with the
 * text up to its semicolon. An ALTER has no body, so the first semicolon ends
 * it.
 */
function alteredFunctions(sql) {
  const found = [];
  const re =
    /ALTER\s+(?:FUNCTION|PROCEDURE|ROUTINE)\s+(?:IF\s+EXISTS\s+)?([A-Za-z0-9_."]+)/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const semi = sql.indexOf(";", m.index);
    const text = sql.slice(m.index, semi === -1 ? sql.length : semi);
    found.push({ name: m[1], text, index: m.index });
  }
  return found;
}

/**
 * Every ALTER TABLE / ALTER VIEW statement in the file, with the object it
 * names and the text up to its semicolon.
 */
function alteredRelations(sql) {
  const found = [];
  const re =
    /ALTER\s+(TABLE|VIEW)\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?([A-Za-z0-9_."]+)/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const semi = sql.indexOf(";", m.index);
    const text = sql.slice(m.index, semi === -1 ? sql.length : semi);
    found.push({ name: m[2], text, index: m.index });
  }
  return found;
}

/**
 * What an ALTER VIEW (or an ALTER TABLE naming a view) does to
 * security_invoker: "on", "off" (set off, or RESET to the default, which is
 * off), or null when it does not touch it.
 */
function securityInvokerChange(text) {
  let change = null;
  for (const m of text.matchAll(/\b(SET|RESET)\s*\(([^)]*)\)/gi)) {
    for (const option of m[2].split(",")) {
      const [key, value] = option.split("=").map((part) => part.trim());
      if (key.replace(/"/g, "").toLowerCase() !== "security_invoker") continue;
      if (m[1].toUpperCase() === "RESET") {
        change = "off";
        continue;
      }
      // Postgres takes any unambiguous prefix of a boolean word: of, f, n.
      const v = (value ?? "true").replace(/'/g, "").toLowerCase();
      change = [
        "off",
        "of",
        "false",
        "fals",
        "fal",
        "fa",
        "f",
        "no",
        "n",
        "0",
      ].includes(v)
        ? "off"
        : "on";
    }
  }
  return change;
}

/**
 * What one ALTER TABLE does to row-level security, in statement order:
 * "enable", "disable", "force", "noforce". Several actions may share one
 * statement, separated by commas.
 */
function rlsChanges(text) {
  const changes = [];
  const re = /\b(ENABLE|DISABLE|NO\s+FORCE|FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/gi;
  for (const m of text.matchAll(re)) {
    changes.push(m[1].replace(/\s+/g, "").toLowerCase());
  }
  return changes;
}

function lineOf(sql, index) {
  return sql.slice(0, index).split("\n").length;
}

// Rule 4 applies to migrations with this version or later; see the header.
const CALLERS_STATED_FROM = "20260930000000";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "PUBLIC, anon CASCADE" -> {"public", "anon"}. */
function roleNames(list) {
  return list
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0].replace(/"/g, "").toLowerCase())
    .filter(Boolean);
}

/**
 * Whether the file states who may execute the named function. Either it is
 * granted to PUBLIC or anon on purpose, or it is revoked from PUBLIC and from
 * anon and the file also says what authenticated gets (a revoke or a grant).
 * REVOKE/GRANT ... ON ALL FUNCTIONS IN SCHEMA public count too. `name` is as
 * written after CREATE FUNCTION, maybe schema-qualified.
 */
function callersAreStated(sql, name) {
  const bare = name.replace(/"/g, "").replace(/^public\./i, "");
  const privilege = `(?:ALL(?:\\s+PRIVILEGES)?|EXECUTE)\\s+`;
  const onThis =
    `ON\\s+(?:(?:FUNCTION|PROCEDURE|ROUTINE)\\s+(?:"?public"?\\.)?"?${escapeRegExp(bare)}"?\\s*(?:\\([^;]*?\\))?` +
    `|ALL\\s+(?:FUNCTIONS|PROCEDURES|ROUTINES)\\s+IN\\s+SCHEMA\\s+"?public"?)\\s+`;

  const revokedFrom = new Set();
  const grantedTo = new Set();
  for (const m of sql.matchAll(
    new RegExp(`REVOKE\\s+${privilege}${onThis}FROM\\s+([^;]*)`, "gi"),
  )) {
    for (const role of roleNames(m[1])) revokedFrom.add(role);
  }
  for (const m of sql.matchAll(
    new RegExp(`GRANT\\s+${privilege}${onThis}TO\\s+([^;]*)`, "gi"),
  )) {
    for (const role of roleNames(m[1])) grantedTo.add(role);
  }

  if (grantedTo.has("public") || grantedTo.has("anon")) return true;
  return (
    revokedFrom.has("public") &&
    revokedFrom.has("anon") &&
    (revokedFrom.has("authenticated") || grantedTo.has("authenticated"))
  );
}

/**
 * Every CREATE VIEW header in the file, keyed by view name. Only the header
 * matters: WITH (security_invoker = ...) lives between the name and the AS.
 */
function createdViews(sql) {
  const views = [];
  const re =
    /CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?([A-Za-z0-9_]+)"?/gi;
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
  const re =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?([A-Za-z0-9_]+)"?/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const before = sql.slice(Math.max(0, m.index - 30), m.index);
    // Temporary tables live for one transaction and have no RLS story.
    if (/\b(TEMP|TEMPORARY|UNLOGGED)\s*$/i.test(before)) continue;
    // Only `public` is exposed through PostgREST.
    const qualified =
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)\./i.exec(
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
  : readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => join(MIGRATIONS, f));

// RLS may be switched on by a later migration than the one that made the
// table, so every file is read before anything is judged. Files named on the
// command line are included too, so checking one file in isolation still sees
// its own ALTER TABLE.
const allSql = [
  ...new Set([
    ...readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => join(MIGRATIONS, f)),
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

// Every migration in the order it is applied, then any file named on the
// command line that is not among them. Stripped once.
const ordered = [
  ...new Set([
    ...readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => join(MIGRATIONS, f)),
    ...targets,
  ]),
];
const strippedSql = new Map(
  ordered.map((path) => [path, stripComments(readFileSync(path, "utf8"))]),
);

/** Whether event `b` comes after event `a` in application order. */
const isLater = (a, b) =>
  b.order > a.order || (b.order === a.order && b.index > a.index);

// A view is whatever its most recent statement says, so only the last one
// about each view is judged: its latest CREATE OR REPLACE, or an ALTER VIEW
// after it that sets or resets security_invoker. That way an old migration
// carrying an old mistake is not reported for ever after a later migration
// fixed it, and a later ALTER cannot quietly undo what the CREATE stated.
const latestViewStatement = new Map();
// What each statement in order does to a table's row-level security.
const rlsEvents = new Map();
ordered.forEach((path, order) => {
  const sql = strippedSql.get(path);
  const events = [];
  for (const view of createdViews(sql)) {
    events.push({ kind: "create", name: view.name.toLowerCase(), ...view });
  }
  for (const alter of alteredRelations(sql)) {
    if (outsidePublic(alter.name)) continue;
    const name = bareName(alter.name);
    const invoker = securityInvokerChange(alter.text);
    if (invoker)
      events.push({ kind: "alter", name, invoker, index: alter.index });
    for (const change of rlsChanges(alter.text)) {
      const list = rlsEvents.get(name) ?? [];
      list.push({ change, order, index: alter.index, path, sql });
      rlsEvents.set(name, list);
    }
  }
  events.sort((a, b) => a.index - b.index);
  for (const event of events) {
    latestViewStatement.set(event.name, { ...event, order, path, sql });
  }
});

const problems = [];
let functionsChecked = 0;
let callersChecked = 0;
let tablesChecked = 0;
let viewsChecked = 0;

for (const [name, view] of latestViewStatement) {
  // Only judge views this run was actually asked about.
  if (!targets.includes(view.path)) continue;
  viewsChecked++;
  const where = `${basename(view.path)}:${lineOf(view.sql, view.index)}`;
  if (view.kind === "alter") {
    if (view.invoker === "off") {
      problems.push(
        `${where}  public.${name} has security_invoker switched off by an ALTER.\n` +
          `    The view now runs as its OWNER, who is not subject to row-level security, so every row of\n` +
          `    its base tables reaches anyone who can reach the view. Its CREATE VIEW still reads as safe,\n` +
          `    which is why this is not allowed: if it really must run as its owner, say so in the\n` +
          `    CREATE VIEW itself, WITH (security_invoker = off), where the next reader looks.`,
      );
    }
    continue;
  }
  if (!/\bsecurity_invoker\b/i.test(view.header)) {
    problems.push(
      `${where}  public.${name} is created without security_invoker.\n` +
        `    A view runs as its OWNER by default, and the owner is not subject to row-level security,\n` +
        `    so this hands every row of its base tables to anyone who can reach the view.\n` +
        `    Add:  WITH (security_invoker = on)   right after the view name, or say = off deliberately.`,
    );
  }
}

// Switching row-level security off, or FORCE off, is judged wherever it
// happens: it is allowed only when a later statement switches it on again
// (a migration that turns it off for a bulk update and back on in the same
// file, say).
for (const [table, events] of rlsEvents) {
  for (const event of events) {
    if (event.change !== "disable" && event.change !== "noforce") continue;
    if (!targets.includes(event.path)) continue;
    const undo = event.change === "disable" ? "enable" : "force";
    if (events.some((e) => e.change === undo && isLater(event, e))) continue;
    const where = `${basename(event.path)}:${lineOf(event.sql, event.index)}`;
    problems.push(
      event.change === "disable"
        ? `${where}  public.${table} has row-level security switched off, and nothing switches it back on.\n` +
            `    Every table in public is reachable with the anon key, which ships in the browser bundle,\n` +
            `    and without RLS its policies stop applying: every row is readable and writable by the grants alone.\n` +
            `    Keep:  ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
        : `${where}  public.${table} has FORCE ROW LEVEL SECURITY switched off, and nothing switches it back on.\n` +
            `    Without FORCE the table's owner, and every SECURITY DEFINER function it owns, skips the policies.\n` +
            `    If that is really intended, it needs saying in a migration that does not also hide it; remove this.`,
    );
  }
}

for (const path of targets) {
  const sql = strippedSql.get(path);
  const file = basename(path);
  const version = /^(\d{14})/.exec(file)?.[1] ?? "";
  const statesCallers = version >= CALLERS_STATED_FROM;
  const headers = functionHeaders(sql);
  const alters = alteredFunctions(sql);

  const callersProblem = (where, name) =>
    `${where}  ${name} is SECURITY DEFINER and never says who may call it.\n` +
    `    A new function is executable by PUBLIC (Postgres) and by anon and authenticated by name\n` +
    `    (Supabase's default privileges), so the anon key can call it. Revoking from one leaves the others.\n` +
    `    Add:  REVOKE ALL ON FUNCTION ${name}(<argument types>) FROM PUBLIC, anon, authenticated;\n` +
    `          GRANT EXECUTE ON FUNCTION ${name}(<argument types>) TO <the roles that call it>;\n` +
    `    or, if every visitor really may call it:  GRANT EXECUTE ... TO PUBLIC;`;

  for (const fn of headers) {
    if (!/\bSECURITY\s+DEFINER\b/i.test(fn.text)) continue;
    functionsChecked++;
    if (!/\bSET\s+search_path\b/i.test(fn.text)) {
      problems.push(
        `${file}:${lineOf(sql, fn.index)}  ${fn.name} is SECURITY DEFINER with no SET search_path.\n` +
          `    It runs as its owner, so the caller decides what its unqualified names mean.\n` +
          `    Add:  SET search_path = public, pg_temp`,
      );
    }
    if (!statesCallers) continue;
    callersChecked++;
    if (!callersAreStated(sql, fn.name)) {
      problems.push(
        callersProblem(`${file}:${lineOf(sql, fn.index)}`, fn.name),
      );
    }
  }

  // An ALTER FUNCTION can make a function SECURITY DEFINER, or take its
  // search_path away, without any CREATE in sight.
  for (const alter of alters) {
    const where = `${file}:${lineOf(sql, alter.index)}`;
    if (/\bRESET\s+(?:search_path|ALL)\b/i.test(alter.text)) {
      problems.push(
        `${where}  ${alter.name} has its search_path reset by an ALTER.\n` +
          `    On a SECURITY DEFINER function that hands the caller the choice of what its unqualified\n` +
          `    names mean, and this file cannot show whether it is one. Set it instead:\n` +
          `    ALTER FUNCTION ${alter.name}(<argument types>) SET search_path = public, pg_temp;`,
      );
    }
    if (!/\bSECURITY\s+DEFINER\b/i.test(alter.text)) continue;
    functionsChecked++;
    const name = bareName(alter.name);
    const pathIsSet =
      /\bSET\s+search_path\b/i.test(alter.text) ||
      alters.some(
        (other) =>
          bareName(other.name) === name &&
          /\bSET\s+search_path\b/i.test(other.text),
      ) ||
      headers.some(
        (fn) =>
          bareName(fn.name) === name && /\bSET\s+search_path\b/i.test(fn.text),
      );
    if (!pathIsSet) {
      problems.push(
        `${where}  ${alter.name} is made SECURITY DEFINER by an ALTER, and this file never sets its search_path.\n` +
          `    It runs as its owner, so the caller decides what its unqualified names mean.\n` +
          `    Add to the same statement:  SET search_path = public, pg_temp`,
      );
    }
    if (!statesCallers) continue;
    callersChecked++;
    if (!callersAreStated(sql, alter.name)) {
      problems.push(callersProblem(where, alter.name));
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
  console.error(
    `Migration check failed, ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`,
  );
  for (const p of problems) console.error(`  ${p}\n`);
  process.exit(1);
}

console.log(
  `Migrations OK: ${functionsChecked} SECURITY DEFINER function${functionsChecked === 1 ? "" : "s"} all set search_path, ` +
    `${callersChecked} of them from 2026-09-30 on all say who may call them, ` +
    `${tablesChecked} table${tablesChecked === 1 ? "" : "s"} all have row-level security, ` +
    `${viewsChecked} view${viewsChecked === 1 ? "" : "s"} all state security_invoker, ` +
    `and no ALTER takes any of it back.`,
);
