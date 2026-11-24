// Tests for scripts/deno-check.mjs, run by `npm run test:scripts`.
// Issue #12: the ratchet counted 9 instead of 53 because type files it could
// not load made errors vanish without a word. Every fixture here is a small
// functions folder written to a temp directory and checked with the real
// Deno, against a local server for the remote cases; nothing leaves the
// machine.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  denoBinary,
  graphProblems,
  measure,
  resolutionDrift,
} from "../../scripts/deno-check.mjs";

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "scripts",
  "deno-check.mjs",
);

// measure() blocks on spawnSync, so the server lives in its own process.
const SERVER = `
const js = "export function add(a, b) { return a + b; }\\n";
const server = require("node:http").createServer((req, res) => {
  const base = "http://127.0.0.1:" + server.address().port;
  const send = (headers, body) => { res.writeHead(200, headers); res.end(body); };
  const javascript = { "content-type": "application/javascript" };
  if (req.url === "/untyped.js") return send(javascript, js);
  if (req.url === "/typed.js")
    return send({ ...javascript, "x-typescript-types": base + "/typed.d.ts" }, js);
  if (req.url === "/typed.d.ts")
    return send({ "content-type": "application/typescript" },
      "export declare function add(a: number, b: number): number;\\n");
  if (req.url === "/latest.js") {
    res.writeHead(302, { location: base + "/typed.js" });
    return res.end();
  }
  if (req.url === "/types-gone.js")
    return send({ ...javascript, "x-typescript-types": base + "/gone.d.ts" }, js);
  res.writeHead(404);
  res.end("not here");
});
server.listen(0, "127.0.0.1", () => console.log(server.address().port));
`;

let work;
let server;
let host;
const deno = denoBinary();

before(async () => {
  work = mkdtempSync(join(tmpdir(), "deno-check-test-"));
  process.env.DENO_DIR = join(work, "deno-dir");
  server = spawn(process.execPath, ["-e", SERVER], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const port = await new Promise((resolve, reject) => {
    server.stdout.once("data", (chunk) => resolve(String(chunk).trim()));
    server.once("exit", (code) => reject(new Error(`server exited ${code}`)));
  });
  host = `127.0.0.1:${port}`;
});

after(() => {
  server?.kill();
  if (work) rmSync(work, { recursive: true, force: true });
});

// Writes { "<path>": "<content>" } under a new functions folder.
function fixture(name, files) {
  const functionsDir = join(work, name, "functions");
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(functionsDir, path)), { recursive: true });
    writeFileSync(join(functionsDir, path), content);
  }
  return functionsDir;
}

function measureFixture(functionsDir) {
  return measure({
    functionsDir,
    cwd: dirname(functionsDir),
    deno,
    extraArgs: [`--allow-import=${host}`],
  });
}

const ONE_ERROR = 'export const n: number = "one";\n';

test("counts what it sees, with each function's own deno.json applied", () => {
  const dir = fixture("counts", {
    "_shared/lib.ts": 'export function word(): string {\n  return "w";\n}\n',
    "a/index.ts": ONE_ERROR,
    "mapped/deno.json": JSON.stringify({
      imports: { lib: "../_shared/lib.ts" },
    }),
    "mapped/index.ts":
      'import { word } from "lib";\nexport const n: number = word();\n',
  });
  const result = measureFixture(dir);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.perFunction, { a: 1, mapped: 1 });
  assert.equal(result.total, 2);
});

test("a module that cannot be resolved is a failure, not a count", () => {
  const dir = fixture("unresolved", {
    "bare/index.ts":
      'import { x } from "not-a-mapped-package";\nexport { x };\n',
    "missing/index.ts":
      'import { x } from "../_shared/nope.ts";\nexport { x };\n',
    "remote/index.ts": `import { x } from "http://${host}/nothing.js";\nexport { x };\n`,
  });
  const { problems } = measureFixture(dir);
  const text = problems.join("\n");
  assert.match(text, /^bare: .*not-a-mapped-package/m);
  assert.match(text, /^missing: .*_shared\/nope\.ts/m);
  assert.match(text, new RegExp(`^remote: .*${host}/nothing\\.js`, "m"));
});

test("a module with no type source is a failure; the same code with types is a count", () => {
  const uses = (path) =>
    `import { add } from "http://${host}/${path}";\nexport const s: string = add(1, 2);\n`;

  const typed = measureFixture(
    fixture("typed", { "typed/index.ts": uses("typed.js") }),
  );
  assert.deepEqual(typed.problems, []);
  assert.deepEqual(typed.perFunction, { typed: 1 });

  const silent = measureFixture(
    fixture("silent", {
      "gone/index.ts": uses("types-gone.js"),
      "untyped/index.ts": uses("untyped.js"),
    }),
  );
  const text = silent.problems.join("\n");
  assert.match(text, new RegExp(`^gone: .*${host}/gone\\.d\\.ts`, "m"));
  assert.match(text, new RegExp(`^untyped: .*${host}/untyped\\.js`, "m"));
});

test("the CLI refuses to count when a module cannot be resolved", () => {
  const dir = fixture("cli", {
    "bare/index.ts":
      'import { x } from "not-a-mapped-package";\nexport { x };\n',
  });
  const run = spawnSync(process.execPath, [SCRIPT, "--dir", dir], {
    encoding: "utf8",
  });
  assert.equal(run.status, 2, run.stdout + run.stderr);
  assert.match(run.stderr, /not-a-mapped-package/);
  assert.match(run.stderr, /not a lower count/);
  assert.doesNotMatch(run.stdout, /fell|deno check:/);
});

test("the CLI refuses to count while an import floats", () => {
  const dir = fixture("floating", {
    "_shared/nested/client.ts":
      'export { createClient } from "https://esm.sh/@supabase/supabase-js@2";\n',
    "a/index.ts": 'import { z } from "https://esm.sh/zod";\nexport { z };\n',
    "b/deno.json": JSON.stringify({ imports: { x: "npm:x@2" } }),
    "b/index.ts": 'import { x } from "x";\nexport { x };\n',
    "pinned/index.ts":
      'import { z } from "https://esm.sh/zod@3.23.8";\nexport { z };\n',
  });
  const run = spawnSync(process.execPath, [SCRIPT, "--dir", dir], {
    encoding: "utf8",
  });
  assert.equal(run.status, 2, run.stdout + run.stderr);
  assert.match(
    run.stderr,
    /_shared\/nested\/client\.ts {2}https:\/\/esm\.sh\/@supabase\/supabase-js@2$/m,
  );
  assert.match(run.stderr, /a\/index\.ts {2}https:\/\/esm\.sh\/zod$/m);
  assert.match(run.stderr, /b\/deno\.json {2}npm:x@2$/m);
  assert.doesNotMatch(run.stderr, /zod@3\.23\.8/);
  assert.match(run.stderr, /Pin each one to an exact release/);
  assert.doesNotMatch(run.stdout, /deno check:/);
});

test("a module in the graph that failed to load is a problem", () => {
  const specifier = "https://esm.sh/y@1.0.0/dist/module/Gone";
  const entry = "file:///functions/a/index.ts";
  const info = {
    modules: [
      {
        specifier: entry,
        mediaType: "TypeScript",
        dependencies: [
          {
            specifier: "https://esm.sh/x@1.0.0",
            code: { specifier: "https://esm.sh/x@1.0.0" },
          },
        ],
      },
      {
        specifier: "https://esm.sh/x@1.0.0",
        mediaType: "JavaScript",
        typesDependency: { specifier: "https://esm.sh/x@1.0.0/index.d.ts" },
      },
      { specifier: "https://esm.sh/x@1.0.0/index.d.ts", mediaType: "Dts" },
      { specifier, error: `Module not found "${specifier}".` },
    ],
  };
  assert.deepEqual(graphProblems(info), [
    `${specifier}: Module not found "${specifier}".`,
  ]);
});

const FALLTHROUGH =
  "export function f(x: number): number {\n  let y = 0;\n  switch (x) {\n    case 1:\n      y = 1;\n    case 2:\n      y = 2;\n      break;\n  }\n  return y;\n}\n";
const SHARED = JSON.stringify({
  compilerOptions: { noFallthroughCasesInSwitch: true },
});

// Deno does not report a switch fallthrough by default, so each count of 1
// here comes from the shared deno.json's option.
test("the shared deno.json's compiler options apply to every function, and a function's own deno.json must repeat them", () => {
  const strict = measureFixture(
    fixture("shared-config", {
      "deno.json": SHARED,
      "plain/index.ts": FALLTHROUGH,
      "mapped/deno.json": JSON.stringify({
        compilerOptions: { noFallthroughCasesInSwitch: true },
        imports: {},
      }),
      "mapped/index.ts": FALLTHROUGH,
    }),
  );
  assert.deepEqual(strict.problems, []);
  assert.deepEqual(strict.perFunction, { plain: 1, mapped: 1 });

  const weak = measureFixture(
    fixture("weak-config", {
      "deno.json": SHARED,
      "weak/deno.json": JSON.stringify({ imports: {} }),
      "weak/index.ts": FALLTHROUGH,
    }),
  );
  assert.match(
    weak.problems.join("\n"),
    /^weak: deno\.json does not set "noFallthroughCasesInSwitch": true/m,
  );
});

test("every resolution in the module graph is recorded, and a different one is drift", () => {
  const { problems, resolved } = measureFixture(
    fixture("redirect", {
      "a/index.ts": `import { add } from "http://${host}/latest.js";\nexport const n: number = add(1, 2);\n`,
    }),
  );
  assert.deepEqual(problems, []);
  const from = `http://${host}/latest.js`;
  assert.deepEqual(resolved.redirects, { [from]: `http://${host}/typed.js` });

  assert.deepEqual(resolutionDrift(resolved, resolved), []);
  assert.deepEqual(resolutionDrift(resolved, { redirects: {}, packages: [] }), [
    `${from} resolved to http://${host}/typed.js, which scripts/deno-check-graph.json does not record`,
  ]);
  assert.deepEqual(
    resolutionDrift(resolved, {
      redirects: { [from]: `http://${host}/untyped.js` },
      packages: [],
    }),
    [
      `${from} now resolves to http://${host}/typed.js; recorded http://${host}/untyped.js`,
    ],
  );
});

test("a package version the record does not hold is drift; one it no longer reaches is not", () => {
  assert.deepEqual(
    resolutionDrift(
      { redirects: {}, packages: ["yargs@17.7.4"] },
      { redirects: {}, packages: ["yargs@17.7.3", "tslib@2.8.1"] },
    ),
    ["yargs@17.7.4 is resolved but not recorded"],
  );
});

test("the CLI records the module graph with --update and refuses to count when it resolves differently", () => {
  const dir = fixture("cli-graph", {
    "a/index.ts": `import { add } from "http://${host}/latest.js";\nexport const n: number = add(1, 2);\n`,
  });
  const graphFile = join(dirname(dir), "scripts", "deno-check-graph.json");
  const from = `http://${host}/latest.js`;
  const cli = (...extra) =>
    spawnSync(
      process.execPath,
      [SCRIPT, "--dir", dir, `--allow-import=${host}`, ...extra],
      { encoding: "utf8" },
    );

  const unrecorded = cli();
  assert.equal(unrecorded.status, 2, unrecorded.stdout + unrecorded.stderr);
  assert.match(unrecorded.stderr, /have not been recorded/);
  assert.doesNotMatch(unrecorded.stdout, /deno check:/);

  const update = cli("--update");
  assert.equal(update.status, 0, update.stdout + update.stderr);
  const recorded = JSON.parse(readFileSync(graphFile, "utf8"));
  assert.deepEqual(recorded.redirects, { [from]: `http://${host}/typed.js` });

  const same = cli();
  assert.equal(same.status, 0, same.stdout + same.stderr);
  assert.match(same.stdout, /deno check: 0 type errors/);

  writeFileSync(
    graphFile,
    JSON.stringify({
      ...recorded,
      redirects: { [from]: `http://${host}/untyped.js` },
    }),
  );
  const drifted = cli();
  assert.equal(drifted.status, 2, drifted.stdout + drifted.stderr);
  assert.match(drifted.stderr, /resolved to a different release/);
  assert.match(
    drifted.stderr,
    new RegExp(
      `${from} now resolves to http://${host}/typed\\.js; recorded http://${host}/untyped\\.js`,
    ),
  );
  assert.doesNotMatch(drifted.stdout, /deno check:/);
});
