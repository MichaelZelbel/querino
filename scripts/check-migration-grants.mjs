#!/usr/bin/env node
//
// Every new table, view and materialized view in `public` says who may use it.
//
// On 2026-10-30 Supabase changed the default privileges of every existing
// project (changelog 45329, "tables not exposed to Data and GraphQL API
// automatically"):
//
//   alter default privileges for role postgres in schema public
//     revoke select, insert, update, delete on tables from anon, authenticated, service_role;
//   alter default privileges for role postgres in schema public
//     revoke usage, select on sequences from anon, authenticated, service_role;
//
// Tables that existed before keep their grants. A table created after it, by a
// migration, by the Lovable agent or in the SQL editor, gets NO grant for the
// three API roles, so supabase-js and PostgREST answer "permission denied":
// the browser, the edge functions on the service_role key, and Querino's MCP
// server alike. A rebuild from these migrations (a local reset, a preview
// branch, disaster recovery) lands in the same place for every table whose
// migration relied on the old automatic grant.
//
// So the migration that creates a relation in public must say, in the same
// file, either who gets it (GRANT ... ON x TO ...) or that nobody does on
// purpose (REVOKE ... ON x FROM ...). Some tables are private by design
// (menerio_integration, profiles, user_credentials, security_suite_lock,
// prompt_copy_events, prompt_copy_salts); the REVOKE is how a file says so.
//
// A serial / bigserial / smallserial column also makes a sequence, and an
// INSERT by a role needs USAGE on it. When the file grants the table to anon,
// authenticated or service_role, it must grant the sequence too. Identity
// columns need nothing: their sequence is used on the table's own privileges.
//
// A CREATE OR REPLACE VIEW, or a CREATE TABLE IF NOT EXISTS, of a relation an
// earlier migration already made (and nothing dropped since) keeps the grants
// it had, so it is not judged.
//
// Migrations from GRANTS_STATED_FROM on fail the check. Older ones relied on
// the automatic grant, which the live database still had when they ran; they
// are counted and reported, never failed.
//
// Usage:
//   node scripts/check-migration-grants.mjs                 supabase/migrations
//   node scripts/check-migration-grants.mjs --dir <folder>  another folder (tests)

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

export const GRANTS_STATED_FROM = "20261020000000";

const API_ROLES = new Set(["anon", "authenticated", "service_role"]);

const DOLLAR_TAG = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/;

/**
 * Remove -- and block comments, leaving dollar-quoted bodies and string
 * literals alone (the same rules as scripts/check-migrations.mjs). Function
 * bodies are then blanked, because a CREATE TABLE written inside one is not a
 * migration creating a table.
 */
export function stripCommentsAndBodies(sql) {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const dollar = DOLLAR_TAG.exec(sql.slice(i, i + 70));
    if (dollar) {
      const tag = dollar[0];
      const close = sql.indexOf(tag, i + tag.length);
      const end = close === -1 ? sql.length : close + tag.length;
      out += " "
        .repeat(end - i)
        .replace(/ /g, (_, k) => (sql[i + k] === "\n" ? "\n" : " "));
      i = end;
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
        if (sql[i] === "'" && sql[i + 1] === "'") {
          out += sql[++i];
          i++;
          continue;
        }
        if (sql[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    out += sql[i++];
  }
  return out;
}

const NAME = `(?:"?[A-Za-z0-9_]+"?\\.)?"?[A-Za-z0-9_]+"?`;

/** public.foo, "public"."foo", foo  ->  foo; other schemas -> null. */
function publicName(name) {
  const parts = name.replace(/"/g, "").split(".");
  if (parts.length > 1 && parts[0].toLowerCase() !== "public") return null;
  return parts[parts.length - 1].toLowerCase();
}

function lineOf(sql, index) {
  return sql.slice(0, index).split("\n").length;
}

/** The text between the parenthesis at `open` and its partner. */
function parenthesised(sql, open) {
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")" && --depth === 0) return sql.slice(open + 1, i);
  }
  return sql.slice(open + 1);
}

/** Split on commas that are not inside parentheses. */
function topLevelParts(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

const SERIAL = /^(?:small|big)?serial[248]?$/i;

/** Columns of a CREATE TABLE (...) body whose type is a serial. */
function serialColumns(body) {
  const columns = [];
  for (const part of topLevelParts(body)) {
    const m = /^"?([A-Za-z0-9_]+)"?\s+([A-Za-z0-9_]+)/.exec(part);
    if (!m) continue;
    if (/^(constraint|primary|unique|check|foreign|exclude|like)$/i.test(m[1]))
      continue;
    if (SERIAL.test(m[2])) columns.push(m[1].toLowerCase());
  }
  return columns;
}

/** Every statement in the file that creates or drops a relation in public, in order. */
function relationEvents(sql) {
  const events = [];
  const create = new RegExp(
    `CREATE\\s+(OR\\s+REPLACE\\s+)?((?:(?:GLOBAL|LOCAL)\\s+)?(?:TEMP|TEMPORARY)\\s+|UNLOGGED\\s+)?` +
      `(TABLE|VIEW|MATERIALIZED\\s+VIEW|RECURSIVE\\s+VIEW)\\s+(IF\\s+NOT\\s+EXISTS\\s+)?(${NAME})`,
    "gi",
  );
  for (const m of sql.matchAll(create)) {
    if (m[2] && /TEMP/i.test(m[2])) continue;
    const name = publicName(m[5]);
    if (!name) continue;
    const kind = /TABLE/i.test(m[3])
      ? "table"
      : /MATERIALIZED/i.test(m[3])
        ? "materialized view"
        : "view";
    let serials = [];
    if (kind === "table") {
      const after = sql.slice(m.index + m[0].length);
      const open = /^\s*\(/.exec(after);
      if (open)
        serials = serialColumns(
          parenthesised(sql, m.index + m[0].length + open[0].length - 1),
        );
    }
    events.push({
      type: "create",
      kind,
      name,
      orReplace: Boolean(m[1]),
      ifNotExists: Boolean(m[4]),
      serials,
      index: m.index,
    });
  }
  const drop = new RegExp(
    `DROP\\s+(?:TABLE|VIEW|MATERIALIZED\\s+VIEW)\\s+(?:IF\\s+EXISTS\\s+)?((?:${NAME}\\s*,\\s*)*${NAME})`,
    "gi",
  );
  for (const m of sql.matchAll(drop)) {
    for (const raw of m[1].split(",")) {
      const name = publicName(raw.trim());
      if (name) events.push({ type: "drop", name, index: m.index });
    }
  }
  const rename = new RegExp(
    `ALTER\\s+(?:TABLE|VIEW|MATERIALIZED\\s+VIEW)\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(${NAME})\\s+RENAME\\s+TO\\s+("?[A-Za-z0-9_]+"?)`,
    "gi",
  );
  for (const m of sql.matchAll(rename)) {
    const from = publicName(m[1]);
    if (from)
      events.push({
        type: "rename",
        name: from,
        to: publicName(m[2]),
        index: m.index,
      });
  }
  const addSerial = new RegExp(
    `ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(${NAME})\\s+ADD\\s+(?:COLUMN\\s+)?(?:IF\\s+NOT\\s+EXISTS\\s+)?"?([A-Za-z0-9_]+)"?\\s+((?:small|big)?serial[248]?)\\b`,
    "gi",
  );
  for (const m of sql.matchAll(addSerial)) {
    const name = publicName(m[1]);
    if (name)
      events.push({
        type: "addSerial",
        name,
        column: m[2].toLowerCase(),
        index: m.index,
      });
  }
  return events.sort((a, b) => a.index - b.index);
}

function roleNames(list) {
  return list
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0].replace(/"/g, "").toLowerCase())
    .filter(Boolean);
}

/**
 * Which relations the file grants or revokes, and to whom. `ON ALL TABLES IN
 * SCHEMA public` counts for every relation, `ON ALL SEQUENCES IN SCHEMA
 * public` for every sequence.
 */
function privilegeStatements(sql) {
  const tables = new Map(); // name -> { grantedTo: Set, revoked: bool }
  const sequences = new Set();
  let allTables = { grantedTo: new Set(), revoked: false };
  let allSequences = false;
  const entry = (name) => {
    if (!tables.has(name))
      tables.set(name, { grantedTo: new Set(), revoked: false });
    return tables.get(name);
  };

  const re =
    /\b(GRANT|REVOKE)\s+((?:GRANT\s+OPTION\s+FOR\s+)?[^;]*?)\s+ON\s+([^;]*?)\s+(TO|FROM)\s+([^;]*)/gi;
  for (const m of sql.matchAll(re)) {
    const isGrant = m[1].toUpperCase() === "GRANT";
    const target = m[3].trim();
    const roles = roleNames(
      m[5].replace(
        /\bWITH\s+GRANT\s+OPTION\b|\bGRANTED\s+BY\b.*$|\b(CASCADE|RESTRICT)\b/gi,
        "",
      ),
    );
    if (/^ALL\s+TABLES\s+IN\s+SCHEMA\s+"?public"?$/i.test(target)) {
      if (isGrant) roles.forEach((r) => allTables.grantedTo.add(r));
      else allTables.revoked = true;
      continue;
    }
    if (/^ALL\s+SEQUENCES\s+IN\s+SCHEMA\s+"?public"?$/i.test(target)) {
      if (isGrant) allSequences = true;
      continue;
    }
    if (/^SEQUENCE\s+/i.test(target)) {
      if (!isGrant) continue;
      for (const raw of target.replace(/^SEQUENCE\s+/i, "").split(",")) {
        const name = publicName(raw.trim());
        if (name) sequences.add(name);
      }
      continue;
    }
    if (
      /^(FUNCTION|PROCEDURE|ROUTINE|SCHEMA|ALL\s|TYPE|DOMAIN|DATABASE|LANGUAGE|FOREIGN|LARGE|TABLESPACE)\b/i.test(
        target,
      )
    )
      continue;
    for (const raw of target.replace(/^TABLE\s+/i, "").split(",")) {
      const name = publicName(raw.trim());
      if (!name) continue;
      const e = entry(name);
      if (isGrant) roles.forEach((r) => e.grantedTo.add(r));
      else e.revoked = true;
    }
  }
  return {
    stated: (name) =>
      tables.has(name) || allTables.revoked || allTables.grantedTo.size > 0,
    grantedToApi: (name) =>
      [...(tables.get(name)?.grantedTo ?? []), ...allTables.grantedTo].some(
        (r) => API_ROLES.has(r) || r === "public",
      ),
    sequenceGranted: (name) => allSequences || sequences.has(name),
  };
}

/**
 * Judge a list of migrations, given in the order they are applied.
 * Returns the problems (new migrations, these fail) and the older relations
 * that rely on the automatic grant (reported only).
 */
export function checkGrants(migrations, { from = GRANTS_STATED_FROM } = {}) {
  const exists = new Set();
  const problems = [];
  const older = [];
  let judged = 0;

  for (const { file, sql: raw } of migrations) {
    const sql = stripCommentsAndBodies(raw);
    const version = /^(\d{14})/.exec(file)?.[1] ?? "";
    const strict = version >= from;
    const privileges = privilegeStatements(sql);

    for (const event of relationEvents(sql)) {
      const where = `${file}:${lineOf(sql, event.index)}`;
      if (event.type === "drop") {
        exists.delete(event.name);
        continue;
      }
      if (event.type === "rename") {
        exists.delete(event.name);
        if (event.to) exists.add(event.to);
        continue;
      }
      if (event.type === "addSerial") {
        const seq = `${event.name}_${event.column}_seq`;
        if (strict && !privileges.sequenceGranted(seq)) {
          problems.push(
            `${where}  public.${event.name} gets a serial column ${event.column}, and the file never grants its sequence.\n` +
              `    Since 2026-10-30 a new sequence gets no grant for anon, authenticated or service_role, so every\n` +
              `    INSERT through the API fails with "permission denied for sequence ${seq}".\n` +
              `    Add:  grant usage, select on sequence public.${seq} to authenticated, service_role;\n` +
              `    or use  generated always as identity  instead, which needs no grant.`,
          );
        }
        continue;
      }

      const preexisting = exists.has(event.name);
      exists.add(event.name);
      if (preexisting && (event.orReplace || event.ifNotExists)) continue;

      if (!privileges.stated(event.name)) {
        if (strict) {
          judged++;
          problems.push(
            `${where}  public.${event.name} (${event.kind}) is created and the file never says who may use it.\n` +
              `    Since 2026-10-30 Supabase no longer grants new relations in public to anon, authenticated and\n` +
              `    service_role, so the browser, the edge functions and the MCP server all get "permission denied".\n` +
              `    Add in this file:\n` +
              `      grant select on public.${event.name} to anon;   -- only if visitors may read it\n` +
              `      grant select, insert, update, delete on public.${event.name} to authenticated;\n` +
              `      grant select, insert, update, delete on public.${event.name} to service_role;\n` +
              `    or, if it is private on purpose:  revoke all on public.${event.name} from anon, authenticated;`,
          );
        } else {
          older.push(`${file}  public.${event.name} (${event.kind})`);
        }
        continue;
      }
      if (strict) judged++;

      if (
        strict &&
        event.serials.length &&
        privileges.grantedToApi(event.name)
      ) {
        for (const column of event.serials) {
          const seq = `${event.name}_${column}_seq`;
          if (privileges.sequenceGranted(seq)) continue;
          problems.push(
            `${where}  public.${event.name}.${column} is a serial, the table is granted to an API role, and its sequence is not.\n` +
              `    Every INSERT through the API then fails with "permission denied for sequence ${seq}".\n` +
              `    Add:  grant usage, select on sequence public.${seq} to authenticated, service_role;\n` +
              `    or use  generated always as identity  instead, which needs no grant.`,
          );
        }
      }
    }
  }
  return { problems, older, judged };
}

export function readMigrations(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({ file, sql: readFileSync(join(dir, file), "utf8") }));
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const args = process.argv.slice(2);
  const dirAt = args.indexOf("--dir");
  const dir =
    dirAt !== -1 ? args[dirAt + 1] : join(here, "..", "supabase", "migrations");

  const { problems, older, judged } = checkGrants(readMigrations(dir));
  const olderFiles = new Set(older.map((line) => line.split(/\s+/)[0]));

  if (older.length) {
    console.log(
      `Grants, report only: ${older.length} relation${older.length === 1 ? "" : "s"} in ${olderFiles.size} ` +
        `migration${olderFiles.size === 1 ? "" : "s"} before ${GRANTS_STATED_FROM} rely on Supabase's old automatic grant. ` +
        `They keep their grants on the live project; a rebuild from migrations would not give them any.`,
    );
    if (args.includes("--verbose"))
      for (const line of older) console.log(`  ${line}`);
  }

  if (problems.length) {
    console.error(
      `Grant check failed, ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`,
    );
    for (const p of problems) console.error(`  ${p}\n`);
    process.exit(1);
  }
  console.log(
    `Grants OK: ${judged} relation${judged === 1 ? "" : "s"} created from ${GRANTS_STATED_FROM} on, ` +
      `each with an explicit grant or revoke in its own migration.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
