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
// A count is only worth comparing when it is the same for the same code
// (issue #12). On 2026-11-18 CI counted 53 on main and 9 on a pull request
// that touched no edge function, 22 minutes apart, and the ratchet asked to
// bank the 9. Six files imported supabase-js@2, a range that every run on an
// empty Deno cache resolved again, and 2.119.1 was published between the two
// runs. When a remote module's type file does not load, `deno check` says
// nothing and exits 0, so the errors that type file would have produced simply
// vanish. Four things follow from that:
//
//   - every remote import names an exact release, and this script refuses to
//     run while one does not (scripts/floating-imports.mjs);
//   - each function is checked with the config it is deployed with, plus the
//     strict compiler options of supabase/functions/deno.json (issue #24). A
//     function with its own deno.json deploys with that file, so it is checked
//     with it, its import map applies, and it must repeat every shared
//     compiler option or this script fails. The others deploy with no config
//     and are checked with supabase/functions/deno.json, which adds only
//     compiler options. Deploying never reads compiler options;
//   - a module that could not be resolved, loaded or typed is a failure (exit
//     2), never a count: a hole in the module graph that `deno info` reports
//     for an entry point;
//   - every version the module graph resolved on its own, below the imports
//     the code names, is recorded in scripts/deno-check-graph.json: each
//     esm.sh redirect (supabase-js@2.119.0 imports ws@^8.18.0, which esm.sh
//     answers with whatever release is newest) and each npm or jsr package
//     version. A run that resolves differently is a failure (exit 2), never a
//     count. Deno's lockfile cannot do this: it records no esm.sh module.
//
// Usage:
//   node scripts/deno-check.mjs            check against the baseline
//   node scripts/deno-check.mjs --update   record today's counts
//   node scripts/deno-check.mjs --dir <functions>   measure another folder
//                                          (the tests' fixtures); its baseline
//                                          and graph record live in
//                                          <functions>/../scripts/
//   --allow-import=<host>                  passed to deno (the tests' server)
//
// Deno is a devDependency, so `bun install` provides it on every machine and
// in CI. $DENO_BIN overrides it if you want a different one.

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, relative, resolve } from "node:path";
import { findFloatingImports } from "./floating-imports.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

export function denoBinary() {
  if (process.env.DENO_BIN) return process.env.DENO_BIN;

  // Deno is a devDependency, so the install puts a real binary here on every
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

  // Under bun the binary is not there yet. npm ran the deno package's
  // postinstall, which copies the platform binary next to it; bun blocks
  // lifecycle scripts of packages it does not trust, and deno is not trusted
  // on purpose: on a musl system that script throws and would fail the whole
  // install, which on Lovable is the build (2026-10-07, when CI moved to
  // bun.lock). The package's own fallback does the same copy on first use, so
  // ask it rather than give up.
  const installApi = join(ROOT, "node_modules", "deno", "install_api.cjs");
  if (existsSync(installApi)) {
    try {
      const installed = createRequire(import.meta.url)(installApi).runInstall();
      if (installed && existsSync(installed)) return installed;
    } catch (error) {
      console.error(
        `The deno package could not place its binary: ${error.message}`,
      );
    }
  }

  const probe = spawnSync("deno", ["--version"], {
    encoding: "utf8",
    shell: true,
  });
  if (probe.status === 0) return "deno";

  console.error("Deno was not found.\n");
  console.error("  It is a devDependency, so this usually means: bun install");
  console.error("  Or point DENO_BIN at a binary you already have.");
  process.exit(2);
}

// Deno prints each diagnostic as a `TSnnnn [ERROR]: message` line, followed
// by the source excerpt and an `at file:///...:L:C` line. The tally is Deno's
// own count, for the cross-check: `Found N errors.`, except that with exactly
// one error Deno prints only `error: Type checking failed.`. A non-zero exit
// with neither is a run that never got to type checking (`tally: null`).
export function parseCheckOutput(text, status) {
  const clean = text.replace(/\x1b\[[0-9;]*m/g, "");
  const diagnostics = [];
  let pending = null;
  for (const line of clean.split(/\r?\n/)) {
    const head = /^(TS\d+) \[ERROR\]: (.*)$/.exec(line);
    if (head) {
      pending = { code: head[1], message: head[2] };
      continue;
    }
    const at = /^\s*at (file:\/\/\/.+?:\d+:\d+)\s*$/.exec(line);
    if (at && pending) {
      diagnostics.push({ ...pending, location: at[1] });
      pending = null;
    }
  }
  const found = /Found (\d+) errors?\./.exec(clean);
  let tally = null;
  if (found) tally = Number(found[1]);
  else if (/error: Type checking failed\./.test(clean)) tally = 1;
  else if (status === 0) tally = 0;
  return { diagnostics, tally, clean };
}

const UNTYPED = new Set(["JavaScript", "Mjs", "Cjs", "Jsx"]);

// What `deno info --json` shows for a module `deno check` could not see. It
// exits 0 in every one of these cases, and `deno check` reports nothing for
// the last two, so this is the only place they surface:
//   - an import of one of our own files that did not resolve (an unmapped
//     bare specifier);
//   - a module in the graph, at any depth, that failed to load (a remote 404
//     or timeout, a missing local file, a type file that is gone);
//   - a remote JavaScript module we import that comes with no types at all.
export function graphProblems(info) {
  const problems = [];
  const bySpecifier = new Map(info.modules.map((m) => [m.specifier, m]));
  for (const m of info.modules) {
    if (m.error) {
      problems.push(`${m.specifier}: ${m.error}`);
    }
    if (!m.specifier.startsWith("file:")) continue;
    for (const dep of m.dependencies ?? []) {
      if (dep.code?.error) problems.push(`${dep.specifier}: ${dep.code.error}`);
      if (dep.type?.error) problems.push(`${dep.specifier}: ${dep.type.error}`);
      const target = bySpecifier.get(dep.code?.specifier);
      if (
        target &&
        !target.specifier.startsWith("file:") &&
        UNTYPED.has(target.mediaType) &&
        !target.typesDependency &&
        !dep.type
      ) {
        problems.push(
          `${target.specifier}: JavaScript with no type definitions, so nothing that uses it is type checked`,
        );
      }
    }
  }
  return problems;
}

// Every version this module graph resolved that the code does not name: the
// redirects a server chose (a ranged esm.sh URL to an exact one) and the npm
// and jsr package versions Deno picked.
export function graphResolutions(info) {
  return {
    redirects: { ...info.redirects },
    packages: [
      ...new Set([
        ...Object.keys(info.npmPackages ?? {}),
        ...Object.values(info.packages ?? {}),
      ]),
    ].sort(),
  };
}

// What this run resolved that the record does not hold. A recorded entry this
// run did not reach is not drift; --update drops it.
export function resolutionDrift(resolved, recorded) {
  const drift = [];
  for (const [from, to] of Object.entries(resolved.redirects)) {
    const before = recorded.redirects?.[from];
    if (before === undefined) {
      drift.push(
        `${from} resolved to ${to}, which scripts/deno-check-graph.json does not record`,
      );
    } else if (before !== to) {
      drift.push(`${from} now resolves to ${to}; recorded ${before}`);
    }
  }
  const packages = new Set(recorded.packages ?? []);
  for (const id of resolved.packages) {
    if (!packages.has(id)) drift.push(`${id} is resolved but not recorded`);
  }
  return drift;
}

function functionOf(location, functionsDir) {
  const file = fileURLToPath(location.replace(/:\d+:\d+$/, ""));
  const rel = relative(functionsDir, file).replaceAll("\\", "/");
  return rel.startsWith("..") ? file : rel.split("/")[0];
}

// Runs `deno check` the way each function is deployed, then `deno info` for
// every entry point. `problems` lists everything that makes the count
// meaningless; when it is not empty, nothing else in the result may be used.
export function measure({ functionsDir, cwd, deno, extraArgs = [] }) {
  const names = readdirSync(functionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((name) => existsSync(join(functionsDir, name, "index.ts")))
    .sort();
  const entryPoints = names.map((name) => join(functionsDir, name, "index.ts"));

  // Functions without a deno.json deploy with no config and are checked
  // together with the shared deno.json, which adds only compiler options. A
  // function with its own deno.json deploys with it, so it is checked with
  // it, and that file must repeat the shared compiler options: Deno does not
  // merge a parent deno.json into one passed with --config. --no-lock, because
  // with --config Deno would otherwise write a deno.lock next to that config.
  const sharedConfig = join(functionsDir, "deno.json");
  const sharedOptions = existsSync(sharedConfig)
    ? (readJson(sharedConfig).compilerOptions ?? {})
    : {};
  const groups = [
    {
      shared: true,
      config: existsSync(sharedConfig) ? ["--config", sharedConfig] : [],
      names: [],
    },
  ];
  const problems = [];
  for (const name of names) {
    const config = join(functionsDir, name, "deno.json");
    if (!existsSync(config)) {
      groups[0].names.push(name);
      continue;
    }
    groups.push({ shared: false, config: ["--config", config], names: [name] });
    const own = readJson(config).compilerOptions ?? {};
    for (const [key, value] of Object.entries(sharedOptions)) {
      if (own[key] !== value) {
        problems.push(
          `${name}: deno.json does not set "${key}": ${JSON.stringify(value)} as the shared deno.json does, so this function is checked with weaker options`,
        );
      }
    }
  }

  const run = (args) =>
    spawnSync(deno, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      shell: deno === "deno",
      env: { ...process.env, NO_COLOR: "1" },
    });

  const diagnostics = new Map();
  for (const group of groups.filter((g) => g.names.length > 0)) {
    const entries = group.names.map((name) =>
      join(functionsDir, name, "index.ts"),
    );
    const result = run([
      "check",
      "--no-lock",
      ...group.config,
      ...extraArgs,
      ...entries,
    ]);
    const label = group.shared ? "deno check" : group.names[0];
    if (result.error) {
      problems.push(
        `${label}: could not run \`${deno} check\`: ${result.error.message}`,
      );
      continue;
    }
    const {
      diagnostics: found,
      tally,
      clean,
    } = parseCheckOutput(
      `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
      result.status,
    );
    // A non-zero exit with no tally is a run that never got to type checking:
    // on 2026-09-11 CI failed with "Type errors fell from 71 to 0. Bank it"
    // because esm.sh answered 408 while Deno fetched a type file, and the same
    // thing happened twice on a developer machine on 2026-09-16. Zero locations
    // and no "Found N errors" line meant "nothing wrong" to the code below. It
    // means "nothing was checked", and that is neither a pass nor a bankable
    // number.
    if (tally === null) {
      problems.push(
        `${label}: \`deno check\` exited with ${result.status} before reporting a tally; nothing was type checked.\n${clean.slice(0, 4000)}`,
      );
      continue;
    }
    // Cross-check against Deno's own tally, so a change in its output format
    // shows up as a loud mismatch rather than as a silently passing ratchet.
    if (tally !== found.length) {
      problems.push(
        `${label}: parsed ${plural(found.length, "error location")} but Deno reported ${tally}. ` +
          `The output format has probably changed. Fix this script before trusting it.\n${clean.slice(0, 4000)}`,
      );
      continue;
    }
    for (const d of found) {
      const fn = functionOf(d.location, functionsDir);
      // mcp-server imports _shared modules the first group also checks, so
      // the same diagnostic can come from two groups. It is one error.
      diagnostics.set(`${d.code} ${d.location} ${d.message}`, { ...d, fn });
    }
  }

  const resolved = { redirects: {}, packages: new Set() };
  for (const group of groups) {
    for (const name of group.names) {
      const entry = join(functionsDir, name, "index.ts");
      const result = run([
        "info",
        "--json",
        "--no-lock",
        ...group.config,
        ...extraArgs,
        entry,
      ]);
      let info;
      try {
        info = JSON.parse(result.stdout);
      } catch {
        problems.push(
          `${name}: \`deno info\` gave no module graph.\n${(result.stderr ?? "").slice(0, 2000)}`,
        );
        continue;
      }
      for (const problem of graphProblems(info)) {
        problems.push(`${name}: ${problem}`);
      }
      const { redirects, packages } = graphResolutions(info);
      Object.assign(resolved.redirects, redirects);
      for (const id of packages) resolved.packages.add(id);
    }
  }

  const perFunction = {};
  for (const { fn } of diagnostics.values()) {
    perFunction[fn] = (perFunction[fn] ?? 0) + 1;
  }

  return {
    entryPoints,
    perFunction,
    total: diagnostics.size,
    diagnostics: [...diagnostics.values()],
    problems: [...new Set(problems)],
    resolved: {
      redirects: Object.fromEntries(
        Object.entries(resolved.redirects).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      ),
      packages: [...resolved.packages].sort(),
    },
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function main() {
  const args = process.argv.slice(2);
  const dirAt = args.indexOf("--dir");
  const functionsDir =
    dirAt !== -1
      ? resolve(args[dirAt + 1])
      : join(ROOT, "supabase", "functions");
  const cwd = dirAt !== -1 ? dirname(functionsDir) : ROOT;
  const baselineFile = join(cwd, "scripts", "deno-check-baseline.json");
  const graphFile = join(cwd, "scripts", "deno-check-graph.json");

  if (!existsSync(functionsDir)) {
    console.error(`No edge functions found under ${functionsDir}`);
    process.exit(2);
  }

  const floating = findFloatingImports(functionsDir);
  if (floating.length > 0) {
    console.error(
      "These imports name a version range, so the types behind them change without the code changing:\n",
    );
    for (const line of floating) console.error(`  ${line}`);
    console.error(
      "\nPin each one to an exact release (supabase-js@2.119.0, not @2). Until then the count is not comparable with the baseline.",
    );
    process.exit(2);
  }

  const { entryPoints, perFunction, total, diagnostics, problems, resolved } =
    measure({
      functionsDir,
      cwd,
      deno: denoBinary(),
      extraArgs: args.filter((arg) => arg.startsWith("--allow-import=")),
    });

  if (entryPoints.length === 0) {
    console.error(`No edge functions found under ${functionsDir}`);
    process.exit(2);
  }

  if (problems.length > 0) {
    console.error(
      "Some functions could not be checked as they are deployed, or some modules could not be resolved, loaded or type checked:\n",
    );
    for (const problem of problems) console.error(`  ${problem}`);
    console.error(
      "\nNothing was counted, so this is not a lower count. Fix the import or the deno.json, or run it again if a download failed.",
    );
    process.exit(2);
  }

  if (!args.includes("--update")) {
    if (!existsSync(graphFile)) {
      console.error(
        "The versions the module graph resolves have not been recorded. Record them:\n\n  node scripts/deno-check.mjs --update\n",
      );
      process.exit(2);
    }
    const drift = resolutionDrift(resolved, readJson(graphFile));
    if (drift.length > 0) {
      console.error(
        "These imports resolved to a different release than scripts/deno-check-graph.json records, so the types behind them may have changed without the code changing:\n",
      );
      for (const line of drift) console.error(`  ${line}`);
      console.error(
        "\nNothing was counted. If the new release is intended, record it with\n\n  node scripts/deno-check.mjs --update\n\nwhich still refuses to raise the count.",
      );
      process.exit(2);
    }
  }

  const baseline = existsSync(baselineFile) ? readJson(baselineFile) : null;

  if (args.includes("--update")) {
    if (baseline && total > baseline.total) {
      console.error(
        `Refusing to raise the baseline from ${baseline.total} to ${total}. The count may only go down.`,
      );
      process.exit(1);
    }
    mkdirSync(dirname(baselineFile), { recursive: true });
    writeJson(baselineFile, {
      note: "Type errors per edge function under `deno check`. May be lowered, never raised. See scripts/deno-check.mjs.",
      total,
      perFunction: Object.fromEntries(
        Object.entries(perFunction).sort(([a], [b]) => a.localeCompare(b)),
      ),
    });
    writeJson(graphFile, {
      note: "Every version the edge functions' module graph resolved when the baseline was recorded, below the imports the code names. A run that resolves differently does not count. See scripts/deno-check.mjs.",
      ...resolved,
    });
    console.log(`Baseline recorded: ${plural(total, "type error")}.`);
    process.exit(0);
  }

  if (!baseline) {
    console.error(
      "No baseline yet. Record one:\n\n  node scripts/deno-check.mjs --update\n",
    );
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
      diagnostics
        .filter((d) => worse.some(([name]) => name === d.fn))
        .slice(0, 30)
        .map((d) => `${d.code} [ERROR]: ${d.message}\n    at ${d.location}`)
        .join("\n"),
    );
    process.exit(1);
  }

  if (total < baseline.total) {
    console.log(`Type errors fell from ${baseline.total} to ${total}:\n`);
    for (const [name, before] of Object.entries(baseline.perFunction ?? {})) {
      const now = perFunction[name] ?? 0;
      if (now < before) console.log(`  ${name}  ${before} -> ${now}`);
    }
    console.log("\nIf the code behind each drop changed, bank it:\n");
    console.log("  node scripts/deno-check.mjs --update\n");
    process.exit(1);
  }

  console.log(
    `deno check: ${plural(total, "type error")} across ${entryPoints.length} edge functions, none of them new.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
