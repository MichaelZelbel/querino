// Tests for harness/test-copy/lib.mjs, run by `npm run test:scripts`: the
// naming, the ports, the generated config and the rewrite that keeps the
// factory's test copy off the live project.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  KEY_STAND_IN,
  LIVE_REF,
  LOCAL_GATEWAY,
  PORT_BLOCK_SIZE,
  PORT_FIRST,
  REF_STAND_IN,
  jwtRef,
  liveReferences,
  portBlockFor,
  portsFor,
  projectIdFor,
  renderConfig,
  rewriteMigration,
  setTomlKeys,
  shellExports,
  shellQuote,
} from "../../harness/test-copy/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function jwt(payload) {
  const part = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${part({ alg: "HS256", typ: "JWT" })}.${part(payload)}.c2lnbmF0dXJlLXRoYXQtaXMtbG9uZw`;
}

test("one checkout always gets the same project id and port block", () => {
  const a = "/home/godspeed-forge/worktrees/querino/lap-1";
  assert.equal(projectIdFor(a), projectIdFor(a));
  assert.equal(projectIdFor(a + "/"), projectIdFor(a));
  assert.equal(portBlockFor(a), portBlockFor(a));
  assert.match(projectIdFor(a), /^querino-tc-[0-9a-f]{10}$/);
});

test("two checkouts get different project ids", () => {
  const ids = new Set();
  for (let i = 0; i < 200; i++) ids.add(projectIdFor(`/home/godspeed-forge/worktrees/querino/lap-${i}`));
  assert.equal(ids.size, 200);
});

test("a port block lies below the ephemeral range and holds ten distinct ports", () => {
  for (let i = 0; i < 300; i++) {
    const base = portBlockFor(`/w/${i}`);
    assert.ok(base >= PORT_FIRST && base + PORT_BLOCK_SIZE - 1 < 32768, `block ${base}`);
    assert.equal((base - PORT_FIRST) % PORT_BLOCK_SIZE, 0);
    const ports = Object.values(portsFor(base));
    assert.equal(new Set(ports).size, PORT_BLOCK_SIZE);
    assert.ok(ports.every((p) => p >= base && p < base + PORT_BLOCK_SIZE));
  }
});

test("a taken block moves to the next one, and the blocks wrap around", () => {
  const root = "/w/lap";
  const index = (base) => (base - PORT_FIRST) / PORT_BLOCK_SIZE;
  assert.equal(index(portBlockFor(root, 1)), (index(portBlockFor(root, 0)) + 1) % 1000);
  assert.equal(portBlockFor(root, 1000), portBlockFor(root, 0));
});

test("a live address in a migration points at the local gateway", () => {
  const sql = `select net.http_post(url := 'https://${LIVE_REF}.supabase.co/functions/v1/ai-moderate-content');`;
  const r = rewriteMigration(sql);
  assert.equal(r.sql, `select net.http_post(url := '${LOCAL_GATEWAY}/functions/v1/ai-moderate-content');`);
  assert.equal(r.urls, 1);
  assert.deepEqual(liveReferences(r.sql), []);
});

test("a key issued for the live project is replaced, any other token is kept", () => {
  const live = jwt({ iss: "supabase", ref: LIVE_REF, role: "anon" });
  const other = jwt({ iss: "supabase", ref: "someoneelse000000000", role: "anon" });
  const sql = `headers := '{"Authorization": "Bearer ${live}"}', other := '${other}'`;
  assert.equal(jwtRef(live), LIVE_REF);
  assert.deepEqual(liveReferences(sql), ["a key issued for the live project"]);
  const r = rewriteMigration(sql);
  assert.equal(r.keys, 1);
  assert.ok(r.sql.includes(`Bearer ${KEY_STAND_IN}`));
  assert.ok(r.sql.includes(other));
  assert.deepEqual(liveReferences(r.sql), []);
});

test("an address built in pieces cannot name the live project either", () => {
  const sql = `url := 'https://' || '${LIVE_REF}' || '.supabase.co/functions/v1/x'; -- (${LIVE_REF}) in a comment`;
  const r = rewriteMigration(sql);
  assert.equal(r.refs, 2);
  assert.ok(r.sql.includes(`'${REF_STAND_IN}'`));
  assert.deepEqual(liveReferences(r.sql), []);
});

test("every migration in the repository comes out without a live reference", () => {
  const dir = path.join(ROOT, "supabase", "migrations");
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".sql"))) {
    const r = rewriteMigration(fs.readFileSync(path.join(dir, f), "utf8"));
    assert.deepEqual(liveReferences(r.sql), [], f);
  }
});

test("setting TOML keys replaces in place, adds under a header, appends a missing table", () => {
  const toml = [
    'project_id = "old"',
    "",
    "[api]",
    "enabled = true",
    "port = 1",
    "",
    "[functions.mcp-server]",
    "verify_jwt = false  # keep me",
    "",
  ].join("\n");
  const out = setTomlKeys(toml, {
    "": { project_id: "new" },
    api: { port: 2, auto_expose_new_tables: false },
    "edge_runtime.secrets": { INTERNAL_JOB_SECRET: "env(QTC_INTERNAL_JOB_SECRET)" },
  });
  assert.equal(
    out,
    [
      'project_id = "new"',
      "",
      "[api]",
      "auto_expose_new_tables = false",
      "enabled = true",
      "port = 2",
      "",
      "[functions.mcp-server]",
      "verify_jwt = false  # keep me",
      "",
      "[edge_runtime.secrets]",
      'INTERNAL_JOB_SECRET = "env(QTC_INTERNAL_JOB_SECRET)"',
      "",
    ].join("\n"),
  );
});

test("a key is matched only inside its own table", () => {
  const toml = '[db]\nport = 1\n\n[api]\nenabled = true\n';
  const out = setTomlKeys(toml, { api: { port: 9 } });
  assert.equal(out, "[db]\nport = 1\n\n[api]\nport = 9\nenabled = true\n");
});

test("the repository's config becomes this checkout's, with no live reference", () => {
  const repo = fs.readFileSync(path.join(ROOT, "supabase", "config.toml"), "utf8");
  const ports = portsFor(21000);
  const out = renderConfig(repo, {
    projectId: "querino-tc-0123456789",
    ports,
    secrets: { INTERNAL_JOB_SECRET: "env(QTC_INTERNAL_JOB_SECRET)" },
  });
  assert.deepEqual(liveReferences(out), []);
  assert.match(out, /^project_id = "querino-tc-0123456789"$/m);
  assert.match(out, /^\[api\]\n(?:.*\n)*?port = 21000$/m);
  assert.match(out, /^\[db\]\nport = 21001\nshadow_port = 21002\nmajor_version = 17$/m);
  assert.match(out, /^\[realtime\]\nenabled = false$/m);
  assert.match(out, /^auto_expose_new_tables = false$/m);
  // The repository's per-function gateway settings reach the copy unchanged.
  assert.match(out, /^\[functions\.mcp-server\]\nverify_jwt = false/m);
  assert.match(out, /^\[functions\.prompt-coach\]\nverify_jwt = true/m);
  // Each table appears once: a duplicate table makes the CLI refuse the file.
  const headers = out.split("\n").filter((l) => /^\s*\[[^\]]+\]\s*$/.test(l)).map((l) => l.trim());
  assert.equal(new Set(headers).size, headers.length);
});

test("exports are single-quoted shell words", () => {
  assert.equal(shellQuote("it's"), `'it'\\''s'`);
  assert.equal(
    shellExports({ A: "x y", B: undefined, C: "$HOME" }),
    "export A='x y'\nexport C='$HOME'",
  );
  assert.throws(() => shellExports({ "bad-name": "x" }));
});
