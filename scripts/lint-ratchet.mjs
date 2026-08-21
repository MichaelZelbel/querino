#!/usr/bin/env node
//
// The `any` count may fall. It may never rise.
//
// Finding S3 of the 2026-08-20 audit: 215 ESLint errors, 209 of them
// no-explicit-any, so `npm run lint` always failed and nobody read it, and the
// six real errors sat in the noise for months. Turning no-explicit-any into a
// warning makes the real errors visible again, but on its own it also makes
// 209 `any`s permanent and invites the 210th.
//
// This is the other half. It counts the warnings, compares them with the
// recorded ceiling, and:
//
//   * fails if the count went UP, naming the files that gained one
//   * fails if the count went DOWN and the ceiling was not lowered, printing
//     the one command that lowers it, so the win is banked instead of leaking
//     back
//
// Usage:
//   node scripts/lint-ratchet.mjs            check against the ceiling
//   node scripts/lint-ratchet.mjs --update   lower the ceiling to today's count

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CEILING_FILE = join(ROOT, "scripts", "lint-ceiling.json");

const RATCHETED = ["@typescript-eslint/no-explicit-any"];

function runEslint() {
  // ESLint's own entry point rather than npx: on Windows, spawning npx.cmd
  // without a shell fails with EINVAL, and spawning it WITH a shell means
  // quoting arguments by hand.
  const eslintBin = join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
  if (!existsSync(eslintBin)) {
    console.error("ESLint is not installed. Run: npm ci");
    process.exit(2);
  }

  let raw;
  try {
    raw = execFileSync(process.execPath, [eslintBin, ".", "-f", "json"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    // ESLint exits non-zero when it reports errors. The JSON is still on stdout,
    // and errors are handled below rather than here.
    raw = e.stdout ?? "";
    if (!raw) {
      console.error("ESLint produced no output.");
      console.error(e.stderr ?? e.message);
      process.exit(2);
    }
  }
  const start = raw.indexOf("[");
  if (start === -1) {
    console.error("ESLint produced no JSON report.");
    process.exit(2);
  }
  return JSON.parse(raw.slice(start));
}

const report = runEslint();

const perFile = {};
let ratcheted = 0;
const errors = [];

for (const file of report) {
  const relative = file.filePath.replace(ROOT, ".").replaceAll("\\", "/");
  for (const message of file.messages) {
    if (RATCHETED.includes(message.ruleId)) {
      ratcheted++;
      perFile[relative] = (perFile[relative] ?? 0) + 1;
    } else if (message.severity === 2) {
      errors.push(`${relative}:${message.line}:${message.column}  [${message.ruleId ?? "?"}]  ${message.message}`);
    }
  }
}

// An outright error is never acceptable, ceiling or no ceiling. This is the
// thing the noise used to hide.
if (errors.length > 0) {
  console.error(`ESLint reports ${errors.length} error${errors.length === 1 ? "" : "s"}:\n`);
  for (const line of errors) console.error(`  ${line}`);
  console.error("\nThese are errors, not `any`s. Fix them.");
  process.exit(1);
}

const ceiling = existsSync(CEILING_FILE)
  ? JSON.parse(readFileSync(CEILING_FILE, "utf8"))
  : { total: Number.POSITIVE_INFINITY, perFile: {} };

if (process.argv.includes("--update")) {
  if (ratcheted > (ceiling.total ?? Infinity)) {
    console.error(
      `Refusing to raise the ceiling from ${ceiling.total} to ${ratcheted}. The count may only go down.`,
    );
    process.exit(1);
  }
  writeFileSync(
    CEILING_FILE,
    JSON.stringify(
      {
        rule: RATCHETED,
        note: "The ceiling on `any`. It may be lowered, never raised. See scripts/lint-ratchet.mjs.",
        total: ratcheted,
        perFile: Object.fromEntries(Object.entries(perFile).sort(([a], [b]) => a.localeCompare(b))),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Ceiling lowered to ${ratcheted}.`);
  process.exit(0);
}

if (ratcheted > ceiling.total) {
  console.error(`\`any\` count rose from ${ceiling.total} to ${ratcheted}.\n`);
  const worse = Object.entries(perFile)
    .map(([file, count]) => [file, count, ceiling.perFile?.[file] ?? 0])
    .filter(([, now, before]) => now > before)
    .sort((a, b) => b[1] - b[2] - (a[1] - a[2]));

  for (const [file, now, before] of worse) {
    console.error(`  ${file}  ${before} -> ${now}`);
  }
  console.error("\nGive those a real type. If one genuinely cannot have one, say why in a comment");
  console.error("and lower some other file's count to pay for it.");
  process.exit(1);
}

if (ratcheted < ceiling.total) {
  console.error(`\`any\` count fell from ${ceiling.total} to ${ratcheted}, and the ceiling still says ${ceiling.total}.`);
  console.error("Bank it, so it cannot leak back:\n");
  console.error("  node scripts/lint-ratchet.mjs --update\n");
  process.exit(1);
}

console.log(`ESLint: 0 errors, ${ratcheted} \`any\` (at the ceiling).`);
