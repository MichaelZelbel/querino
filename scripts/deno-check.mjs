#!/usr/bin/env node
//
// Type errors in the edge functions may fall. They may never rise.
//
// Finding S2 of the 2026-08-20 audit: TypeScript was not really checking
// anything. The app's tsconfig has noImplicitAny off and strictNullChecks off,
// so `tsc --noEmit` passed while saying almost nothing. The audit's advice was
// to turn strict on for supabase/functions first, where the money logic is and
// the file count is small.
//
// Turning it on outright would paint the build red on day one: the existing
// functions have real type errors, mostly supabase-js resolving table
// operations to `never` because the clients are created without a Database
// type. A permanently red check is the same mistake as the 215-error linter it
// is meant to replace.
//
// So this is a ratchet, like scripts/lint-ratchet.mjs. It records how many
// errors each function has today and fails if any of them gains one. Fixing
// them is a separate, ordinary piece of work that this makes visible and
// keeps finished.
//
// Usage:
//   node scripts/deno-check.mjs            check against the baseline
//   node scripts/deno-check.mjs --update   record today's counts
//
// Deno is a devDependency, so npm ci provides it on every machine and in CI.
// $DENO_BIN overrides it if you want a different one.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FUNCTIONS = join(ROOT, "supabase", "functions");
const BASELINE_FILE = join(ROOT, "scripts", "deno-check-baseline.json");

function denoBinary() {
  if (process.env.DENO_BIN) return process.env.DENO_BIN;

  // Deno is a devDependency, so `npm ci` puts a real binary here on every
  // machine and in CI. Nobody has to install a second runtime by hand, and
  // nobody has to remember that this check needs one.
  //
  // The executable itself, not node_modules/.bin/deno.cmd: on Windows a .cmd
  // shim cannot be spawned without a shell, and spawning through a shell means
  // quoting 34 file paths by hand.
  const vendored = join(
    ROOT,
    "node_modules",
    "deno",
    process.platform === "win32" ? "deno.exe" : "deno",
  );
  if (existsSync(vendored)) return vendored;

  const probe = spawnSync("deno", ["--version"], { encoding: "utf8", shell: true });
  if (probe.status === 0) return "deno";

  console.error("Deno was not found.\n");
  console.error("  It is a devDependency, so this usually means: npm ci");
  console.error("  Or point DENO_BIN at a binary you already have.");
  process.exit(2);
}

const entryPoints = readdirSync(FUNCTIONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => join(FUNCTIONS, d.name, "index.ts"))
  .filter((p) => existsSync(p))
  .sort();

if (entryPoints.length === 0) {
  console.error(`No edge functions found under ${FUNCTIONS}`);
  process.exit(2);
}

const deno = denoBinary();
const result = spawnSync(deno, ["check", ...entryPoints], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  shell: deno === "deno",
});

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

if (result.error) {
  console.error(`Could not run \`${deno} check\`: ${result.error.message}`);
  process.exit(2);
}

// Deno prints each diagnostic ending with `at file:///.../<function>/index.ts:L:C`,
// so the function each error belongs to is read off that line. Errors inside a
// _shared module are attributed to _shared, where they belong.
const perFunction = {};
let total = 0;

const ansi = /\[[0-9;]*m/g;
const clean = output.replace(ansi, "");

for (const line of clean.split(/\r?\n/)) {
  const at = /^\s*at file:\/\/\/(.+?):\d+:\d+\s*$/.exec(line);
  if (!at) continue;
  const path = at[1].replaceAll("\\", "/");
  const m = /supabase\/functions\/([^/]+)\//.exec(path);
  if (!m) continue;
  const name = m[1];
  perFunction[name] = (perFunction[name] ?? 0) + 1;
  total++;
}

// Cross-check against Deno's own tally, so a change in its output format shows
// up as a loud mismatch rather than as a silently passing ratchet.
const reported = /Found (\d+) errors?\./.exec(clean);
const denoTotal = reported ? Number(reported[1]) : result.status === 0 ? 0 : null;

if (denoTotal !== null && denoTotal !== total) {
  console.error(
    `Parsed ${total} error location${total === 1 ? "" : "s"} but Deno reported ${denoTotal}.`,
  );
  console.error("The output format has probably changed. Fix this script before trusting it.\n");
  console.error(clean.slice(0, 4000));
  process.exit(2);
}

const baseline = existsSync(BASELINE_FILE)
  ? JSON.parse(readFileSync(BASELINE_FILE, "utf8"))
  : null;

if (process.argv.includes("--update")) {
  if (baseline && total > baseline.total) {
    console.error(
      `Refusing to raise the baseline from ${baseline.total} to ${total}. The count may only go down.`,
    );
    process.exit(1);
  }
  writeFileSync(
    BASELINE_FILE,
    JSON.stringify(
      {
        note: "Type errors per edge function under `deno check`. May be lowered, never raised. See scripts/deno-check.mjs.",
        total,
        perFunction: Object.fromEntries(
          Object.entries(perFunction).sort(([a], [b]) => a.localeCompare(b)),
        ),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Baseline recorded: ${total} type error${total === 1 ? "" : "s"}.`);
  process.exit(0);
}

if (!baseline) {
  console.error("No baseline yet. Record one:\n\n  node scripts/deno-check.mjs --update\n");
  process.exit(1);
}

const worse = Object.entries(perFunction)
  .map(([name, count]) => [name, count, baseline.perFunction?.[name] ?? 0])
  .filter(([, now, before]) => now > before);

if (worse.length > 0) {
  console.error("Edge functions gained type errors:\n");
  for (const [name, now, before] of worse) {
    console.error(`  ${name}  ${before} -> ${now}`);
  }
  console.error("\nThe relevant diagnostics:\n");
  console.error(
    clean
      .split(/\r?\n/)
      .filter((l) => /\[ERROR\]|at file:/.test(l))
      .filter((l) => worse.some(([name]) => l.includes(`/${name}/`)) || /\[ERROR\]/.test(l))
      .slice(0, 60)
      .join("\n"),
  );
  process.exit(1);
}

if (total < baseline.total) {
  console.log(`Type errors fell from ${baseline.total} to ${total}. Bank it:\n`);
  console.log("  node scripts/deno-check.mjs --update\n");
  process.exit(1);
}

console.log(
  `deno check: ${total} type error${total === 1 ? "" : "s"} across ${entryPoints.length} edge functions, none of them new.`,
);
