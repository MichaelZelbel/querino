#!/usr/bin/env node
// The factory's private test copy of Querino. Run through harness/test-copy.sh;
// harness/RUNTIME.md says when, and harness/test-copy/README.md says why it is
// built the way it is.
//
//   up      start this checkout's copy: a local Supabase stack from this
//           checkout's supabase/migrations, seeded with made-up accounts and
//           items, its edge functions served; prints shell exports
//   env     print the exports again (the copy must be up)
//   down    remove this checkout's containers, volumes and network
//   status  say whether this checkout's copy is up
//   list    every copy on this machine and the checkout it belongs to
//   prune   remove the copies whose checkout folder no longer exists
//
// Exports go to stdout and everything else to stderr, so a lap runs
//   eval "$(harness/test-copy.sh up)"

import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLI_ASSET,
  CLI_SHA256,
  CLI_VERSION,
  EXCLUDED_SERVICES,
  LIVE_REF,
  liveReferences,
  portBlockFor,
  portsFor,
  projectIdFor,
  renderConfig,
  rewriteMigration,
  shellExports,
  sqlLiteral,
} from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const STATE = path.join(ROOT, "harness", ".results", "test-copy");
const WORKDIR = STATE; // the CLI's --workdir: it holds the generated supabase/ folder
const STATE_FILE = path.join(STATE, "state.json");
const HOME = os.homedir();
const CACHE = path.join(process.env.XDG_CACHE_HOME || path.join(HOME, ".cache"), "querino-test-copy");
const REGISTRY = path.join(CACHE, "stacks");
const OPENROUTER_KEY_FILE = path.join(HOME, ".config", "querino-test-copy", "openrouter.key");
const ACCOUNTS = JSON.parse(fs.readFileSync(path.join(HERE, "accounts.json"), "utf8")).accounts;
const PROJECT_ID = projectIdFor(ROOT);
const LABEL = "com.supabase.cli.project";

const started = Date.now();
function log(msg) {
  const s = ((Date.now() - started) / 1000).toFixed(1).padStart(6);
  process.stderr.write(`[test-copy ${s}s] ${msg}\n`);
}
function fail(msg) {
  process.stderr.write(`[test-copy] FAILED: ${msg}\n`);
  process.exit(1);
}

// ── Processes ────────────────────────────────────────────────────────────────

/**
 * The environment every child gets: the caller's, without anything that could
 * point the CLI or the functions somewhere else. The CLI reads SUPABASE_*
 * variables as config overrides (SUPABASE_PROJECT_ID would rename the stack,
 * SUPABASE_ACCESS_TOKEN reaches the Management API), and an AI key in the
 * lap's environment must never reach the copy by accident.
 */
function childEnv(extra = {}) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^(SUPABASE_|VITE_SUPABASE_|OPENROUTER|OPENAI|LOVABLE_API|RESEND|QTC_)/i.test(k)) continue;
    env[k] = v;
  }
  if (!env.DOCKER_HOST) {
    const sock = path.join(process.env.XDG_RUNTIME_DIR || `/run/user/${os.userInfo().uid}`, "docker.sock");
    if (fs.existsSync(sock)) env.DOCKER_HOST = `unix://${sock}`;
  }
  env.DO_NOT_TRACK = "1";
  return { ...env, ...extra };
}

function run(cmd, args, { input, env, quiet = false, allowFail = false, timeout = 15 * 60_000 } = {}) {
  const res = spawnSync(cmd, args, {
    input,
    env: env ?? childEnv(),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
  if (res.error) {
    if (allowFail) return { status: -1, stdout: "", stderr: String(res.error) };
    fail(`${cmd} ${args[0] ?? ""}: ${res.error.message}`);
  }
  if (!quiet && res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0 && !allowFail) {
    if (quiet && res.stderr) process.stderr.write(res.stderr);
    fail(`${cmd} ${args.slice(0, 2).join(" ")} exited with ${res.status}`);
  }
  return res;
}

function docker(args, opts = {}) {
  return run("docker", args, { quiet: true, ...opts });
}

function psql(sql, { allowFail = false } = {}) {
  return docker(
    ["exec", "-i", `supabase_db_${PROJECT_ID}`, "psql", "-U", "supabase_admin", "-d", "postgres",
      "-v", "ON_ERROR_STOP=1", "-X", "-q", "-At"],
    { input: sql, allowFail },
  );
}

// ── The CLI, pinned ──────────────────────────────────────────────────────────

/**
 * The Supabase CLI at CLI_VERSION. On Linux it is the release tarball,
 * checked against the checksum written in lib.mjs and kept in the user's
 * cache, so the repository's bun.lock never changes and two laps never race
 * an npx install. Elsewhere it is `npx --yes supabase@<version>`.
 */
async function supabaseCommand() {
  const platform = `${process.platform}-${process.arch}`;
  const asset = CLI_ASSET[platform];
  if (!asset) return ["npx", ["--yes", `supabase@${CLI_VERSION}`]];
  const dir = path.join(CACHE, `supabase-${CLI_VERSION}`);
  const bin = path.join(dir, "supabase");
  if (fs.existsSync(bin)) return [bin, []];

  log(`downloading the Supabase CLI ${CLI_VERSION}`);
  const url = `https://github.com/supabase/cli/releases/download/v${CLI_VERSION}/${asset}`;
  const res = await fetch(url);
  if (!res.ok) fail(`download of ${url} answered ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  const sum = createHash("sha256").update(body).digest("hex");
  if (sum !== CLI_SHA256[platform]) fail(`the CLI download's checksum is ${sum}, expected ${CLI_SHA256[platform]}`);

  // Unpack beside the final folder and rename it into place: a second lap
  // doing the same at the same moment loses the rename and uses the winner's.
  const tmp = `${dir}.${process.pid}`;
  fs.mkdirSync(tmp, { recursive: true });
  const tgz = path.join(tmp, asset);
  fs.writeFileSync(tgz, body);
  run("tar", ["-xzf", tgz, "-C", tmp], { quiet: true });
  fs.rmSync(tgz);
  try {
    fs.renameSync(tmp, dir);
  } catch {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (!fs.existsSync(bin)) fail(`the CLI is not at ${bin} after unpacking`);
  return [bin, []];
}

async function supabase(args, opts = {}) {
  const [cmd, pre] = await supabaseCommand();
  return run(cmd, [...pre, ...args], opts);
}

// ── Ports ────────────────────────────────────────────────────────────────────

function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.listen({ port, host: "0.0.0.0", exclusive: true }, () => srv.close(() => resolve(true)));
  });
}

function registryEntries() {
  if (!fs.existsSync(REGISTRY)) return [];
  return fs
    .readdirSync(REGISTRY)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(REGISTRY, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function choosePorts() {
  const claimed = new Set(
    registryEntries().filter((e) => e.projectId !== PROJECT_ID).map((e) => e.ports?.api),
  );
  for (let attempt = 0; attempt < 50; attempt++) {
    const base = portBlockFor(ROOT, attempt);
    if (claimed.has(base)) continue;
    const ports = portsFor(base);
    const free = await Promise.all(Object.values(ports).map(portFree));
    if (free.every(Boolean)) return ports;
  }
  fail("no free block of ten ports between 20000 and 29999");
}

// ── The copy's supabase/ folder ──────────────────────────────────────────────

function buildWorkdir(ports, secrets) {
  const out = path.join(WORKDIR, "supabase");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "migrations"), { recursive: true });

  const src = path.join(ROOT, "supabase", "migrations");
  let urls = 0, keys = 0, refs = 0;
  const files = fs.readdirSync(src).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const r = rewriteMigration(fs.readFileSync(path.join(src, f), "utf8"));
    const left = liveReferences(r.sql);
    if (left.length) fail(`${f} still names the live project after the rewrite (${left.join(", ")})`);
    urls += r.urls; keys += r.keys; refs += r.refs;
    fs.writeFileSync(path.join(out, "migrations", f), r.sql);
  }
  log(`${files.length} migrations copied; pointed ${urls} live addresses at the local gateway, replaced ${keys} live keys and ${refs} other mentions of the live project`);

  fs.cpSync(path.join(ROOT, "supabase", "functions"), path.join(out, "functions"), { recursive: true });

  const toml = renderConfig(fs.readFileSync(path.join(ROOT, "supabase", "config.toml"), "utf8"), {
    projectId: PROJECT_ID,
    ports,
    secrets,
  });
  const left = liveReferences(toml);
  if (left.length) fail(`the generated config.toml names the live project (${left.join(", ")})`);
  fs.writeFileSync(path.join(out, "config.toml"), toml);
}

function writeSecret(name, value) {
  const file = path.join(STATE, name);
  fs.writeFileSync(file, value, { mode: 0o600 });
  fs.chmodSync(file, 0o600);
}
function readSecret(name) {
  const file = path.join(STATE, name);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : null;
}

// ── Inspecting the stack ─────────────────────────────────────────────────────

function containersOf(projectId) {
  return docker(["ps", "-a", "--filter", `label=${LABEL}=${projectId}`, "--format", "{{.Names}}"], { allowFail: true })
    .stdout.split("\n").filter(Boolean);
}
function volumesOf(projectId) {
  const byLabel = docker(["volume", "ls", "-q", "--filter", `label=${LABEL}=${projectId}`], { allowFail: true })
    .stdout.split("\n").filter(Boolean);
  const byName = docker(["volume", "ls", "-q"], { allowFail: true })
    .stdout.split("\n").filter((v) => v.startsWith("supabase_") && v.endsWith(`_${projectId}`));
  return [...new Set([...byLabel, ...byName])];
}
function networksOf(projectId) {
  return docker(["network", "ls", "--format", "{{.Name}}"], { allowFail: true })
    .stdout.split("\n").filter((n) => n === `supabase_network_${projectId}`);
}
function running() {
  const out = docker(["ps", "--filter", `label=${LABEL}=${PROJECT_ID}`, "--format", "{{.Names}}"], { allowFail: true });
  return out.stdout.split("\n").filter(Boolean);
}

async function statusEnv() {
  const res = await supabase(["status", "--workdir", WORKDIR, "-o", "env"], { quiet: true, allowFail: true });
  if (res.status !== 0) return null;
  const vars = {};
  for (const line of res.stdout.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars.API_URL && vars.ANON_KEY && vars.SERVICE_ROLE_KEY ? vars : null;
}

function exportsFor(state, keys) {
  const api = `http://127.0.0.1:${state.ports.api}`;
  const vars = {
    VITE_SUPABASE_URL: api,
    VITE_SUPABASE_PUBLISHABLE_KEY: keys.ANON_KEY,
    QUERINO_TEST_COPY: "1",
    QUERINO_TEST_COPY_PROJECT_ID: PROJECT_ID,
    QUERINO_TEST_COPY_API_URL: api,
    QUERINO_TEST_COPY_FUNCTIONS_URL: `${api}/functions/v1`,
    QUERINO_TEST_COPY_DB_URL: `postgresql://postgres:postgres@127.0.0.1:${state.ports.db}/postgres`,
    QUERINO_TEST_COPY_ANON_KEY: keys.ANON_KEY,
    QUERINO_TEST_COPY_SERVICE_ROLE_KEY: keys.SERVICE_ROLE_KEY,
    QUERINO_TEST_COPY_INTERNAL_JOB_SECRET: readSecret("internal-job-secret"),
    QUERINO_TEST_COPY_AI: state.ai ? "on" : "off",
  };
  for (const a of ACCOUNTS) {
    vars[`QUERINO_TEST_COPY_${a.key}_ID`] = a.id;
    vars[`QUERINO_TEST_COPY_${a.key}_EMAIL`] = a.email;
    vars[`QUERINO_TEST_COPY_${a.key}_PASSWORD`] = a.password;
  }
  vars.QUERINO_TEST_COPY_AUTHOR_MCP_TOKEN = readSecret("author-mcp-token");
  vars.QUERINO_TEST_COPY_MCP_URL = `${api}/functions/v1/mcp-server`;
  return shellExports(vars);
}

// ── up ───────────────────────────────────────────────────────────────────────

async function waitFor(what, fn, seconds) {
  const deadline = Date.now() + seconds * 1000;
  let last = "";
  while (Date.now() < deadline) {
    try {
      const r = await fn();
      if (r === true) return;
      last = String(r);
    } catch (e) {
      last = e.message;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  fail(`${what} did not answer within ${seconds}s (last: ${last})`);
}

async function up() {
  if (!fs.existsSync(path.join(ROOT, "supabase", "migrations"))) fail(`${ROOT} is not a Querino checkout`);
  if (docker(["info", "--format", "{{.ServerVersion}}"], { allowFail: true }).status !== 0) {
    fail("Docker does not answer. In the factory account, DOCKER_HOST comes from ~/.factory-env.");
  }

  if (running().length && fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    const keys = await statusEnv();
    if (keys) {
      log(`already up (${PROJECT_ID}); printing its exports`);
      process.stdout.write(exportsFor(state, keys) + "\n");
      return;
    }
  }
  if (containersOf(PROJECT_ID).length || volumesOf(PROJECT_ID).length) {
    log("a half-started copy of this checkout is left over; removing it first");
    await down({ quietIfNothing: true });
  }

  await prune({ onlyKnownGone: true });
  const [cmd] = await supabaseCommand();
  log(`checkout ${ROOT}`);
  log(`project ${PROJECT_ID}, Supabase CLI ${CLI_VERSION} (${cmd})`);
  fs.mkdirSync(STATE, { recursive: true });
  fs.mkdirSync(REGISTRY, { recursive: true });

  const ports = await choosePorts();
  const entry = { projectId: PROJECT_ID, root: ROOT, ports, startedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(REGISTRY, `${PROJECT_ID}.json`), JSON.stringify(entry, null, 2));
  log(`ports ${ports.api} (API) and ${ports.db} (database), block ${ports.api}-${ports.inspector}`);

  const internalSecret = randomBytes(32).toString("hex");
  writeSecret("internal-job-secret", internalSecret);
  const extraEnv = { QTC_INTERNAL_JOB_SECRET: internalSecret };
  const secrets = {
    INTERNAL_JOB_SECRET: "env(QTC_INTERNAL_JOB_SECRET)",
    ADMIN_EMAIL: "admin@querino.test",
    PUBLIC_SITE_URL: "http://127.0.0.1:8080",
  };
  let ai = false;
  if (fs.existsSync(OPENROUTER_KEY_FILE)) {
    const key = fs.readFileSync(OPENROUTER_KEY_FILE, "utf8").trim();
    if (key) {
      secrets.OPENROUTER_API_KEY = "env(QTC_OPENROUTER_API_KEY)";
      extraEnv.QTC_OPENROUTER_API_KEY = key;
      ai = true;
    }
  }
  log(ai ? `AI on: the OpenRouter key from ${OPENROUTER_KEY_FILE}` : `AI off: no ${OPENROUTER_KEY_FILE}, so the AI features fail closed`);

  buildWorkdir(ports, secrets);

  log(`starting the stack (without ${EXCLUDED_SERVICES.join(", ")})`);
  const start = await supabase(
    ["start", "--workdir", WORKDIR, "-x", EXCLUDED_SERVICES.join(",")],
    { env: childEnv(extraEnv), quiet: true, allowFail: true, timeout: 20 * 60_000 },
  );
  if (start.status !== 0) {
    process.stderr.write(start.stdout.slice(-4000) + start.stderr.slice(-4000));
    log("start failed; removing what it left");
    await down({ quietIfNothing: true });
    fail("supabase start failed (its output is above)");
  }
  log("stack started, migrations applied");

  const keys = await statusEnv();
  if (!keys) fail("supabase status did not report the copy's keys");

  // The machine key the scheduled jobs send; the functions got the same value.
  psql(`
    do $$
    declare v_id uuid;
    begin
      select id into v_id from vault.secrets where name = 'internal_job_secret';
      if v_id is null then
        perform vault.create_secret(${sqlLiteral(internalSecret)}, 'internal_job_secret');
      else
        perform vault.update_secret(v_id, ${sqlLiteral(internalSecret)});
      end if;
    end $$;`);

  verifyNoLiveProject();

  log("creating the made-up accounts");
  for (const a of ACCOUNTS) {
    const res = await fetch(`${keys.API_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: keys.SERVICE_ROLE_KEY,
        Authorization: `Bearer ${keys.SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: a.id,
        email: a.email,
        password: a.password,
        email_confirm: true,
        user_metadata: { full_name: a.display_name },
      }),
    });
    if (!res.ok) fail(`creating ${a.email} answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  log("seeding prompts, skills, workflows, a prompt kit and a collection");
  psql(fs.readFileSync(path.join(HERE, "seed.sql"), "utf8"));

  // An MCP token for test-author, stored as the app stores one: its SHA-256.
  const token = `qrn_mcp_${randomBytes(32).toString("base64url")}`;
  writeSecret("author-mcp-token", token);
  const author = ACCOUNTS.find((a) => a.key === "AUTHOR");
  psql(`insert into public.mcp_api_tokens (user_id, name, token_hash, token_prefix)
        values (${sqlLiteral(author.id)}, 'test copy', ${sqlLiteral(createHash("sha256").update(token).digest("hex"))}, ${sqlLiteral(token.slice(0, 16))});`);

  await waitFor("the REST API with the visitor key", async () => {
    const r = await fetch(`${keys.API_URL}/rest/v1/prompts?select=id&is_public=eq.true`, {
      headers: { apikey: keys.ANON_KEY },
    });
    const rows = r.ok ? await r.json() : [];
    return rows.length >= 4 || `${r.status}, ${rows.length} public prompts`;
  }, 60);
  await waitFor("the edge functions (llm-models)", async () => {
    const r = await fetch(`${keys.API_URL}/functions/v1/llm-models`, { headers: { apikey: keys.ANON_KEY } });
    return r.status === 200 || r.status;
  }, 120);

  const state = { projectId: PROJECT_ID, root: ROOT, ports, ai, cli: CLI_VERSION, upAt: new Date().toISOString() };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  log(`up in ${((Date.now() - started) / 1000).toFixed(0)}s: ${keys.API_URL}`);
  process.stdout.write(exportsFor(state, keys) + "\n");
}

/**
 * Proof, from inside the copy's database, that nothing in it can call the
 * live project: no scheduled job and no function body names it, and every
 * address a job posts to is the local gateway. A failure stops the copy.
 */
function verifyNoLiveProject() {
  const out = psql(`
    select 'job ' || jobname || ': ' || left(regexp_replace(command, '\\s+', ' ', 'g'), 200)
      from cron.job
     where command ilike '%${LIVE_REF}%' or command ilike '%supabase.co%'
        or (command ilike '%net.http_%' and command not ilike '%http://kong:8000/%')
    union all
    select 'function ' || p.oid::regprocedure::text
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname not in ('pg_catalog', 'information_schema')
       and p.prosrc ilike '%${LIVE_REF}%'
    union all
    select 'queued request to ' || url from net.http_request_queue where url not like 'http://kong:8000/%';`).stdout.trim();
  if (out) {
    fail(`the copy can still reach the live project:\n${out}`);
  }
  const jobs = psql(`select count(*) from cron.job where command ilike '%net.http_%';`).stdout.trim();
  log(`checked: ${jobs} scheduled jobs call the copy's own functions, none names the live project`);
}

// ── down, status, list, prune ────────────────────────────────────────────────

async function removeStack(projectId, { workdir } = {}) {
  const args = ["stop", "--no-backup"];
  if (workdir && fs.existsSync(path.join(workdir, "supabase", "config.toml"))) args.push("--workdir", workdir);
  else args.push("--project-id", projectId);
  await supabase(args, { quiet: true, allowFail: true, timeout: 5 * 60_000 });

  // What `supabase stop` left, removed by its labels and names.
  const containers = containersOf(projectId);
  if (containers.length) docker(["rm", "-f", "-v", ...containers], { allowFail: true });
  const volumes = volumesOf(projectId);
  if (volumes.length) docker(["volume", "rm", "-f", ...volumes], { allowFail: true });
  const networks = networksOf(projectId);
  if (networks.length) docker(["network", "rm", ...networks], { allowFail: true });

  const left = [...containersOf(projectId), ...volumesOf(projectId), ...networksOf(projectId)];
  fs.rmSync(path.join(REGISTRY, `${projectId}.json`), { force: true });
  return left;
}

async function down({ quietIfNothing = false } = {}) {
  const had = containersOf(PROJECT_ID).length + volumesOf(PROJECT_ID).length + networksOf(PROJECT_ID).length;
  const left = await removeStack(PROJECT_ID, { workdir: WORKDIR });
  fs.rmSync(STATE, { recursive: true, force: true });
  if (left.length) fail(`still there after down: ${left.join(", ")}`);
  if (!quietIfNothing || had) log(`down: ${PROJECT_ID} removed (no container, volume or network left)`);
}

async function status() {
  const names = running();
  if (!names.length) {
    process.stdout.write(`down: ${PROJECT_ID} (${ROOT})\n`);
    process.exit(3);
  }
  const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : null;
  process.stdout.write(
    `up: ${PROJECT_ID}, ${names.length} containers` +
      (state ? `, API http://127.0.0.1:${state.ports.api}, AI ${state.ai ? "on" : "off"}, since ${state.upAt}` : "") +
      "\n",
  );
}

/**
 * Every test copy on this machine and the checkout it belongs to: from the
 * registry, or else from the workdir label the CLI puts on each container
 * (<checkout>/harness/.results/test-copy), so a copy whose registry entry is
 * gone is still found and still traced to its checkout.
 */
function stacksOnMachine() {
  const fromWorkdir = new Map();
  const ps = docker(["ps", "-a", "--format", `{{.Label "${LABEL}"}}|{{.Label "com.supabase.cli.workdir"}}`], { allowFail: true });
  for (const line of ps.stdout.split("\n")) {
    const [id, workdir] = line.split("|");
    if (!id?.startsWith("querino-tc-")) continue;
    const suffix = path.join("harness", ".results", "test-copy");
    fromWorkdir.set(id, workdir && workdir.endsWith(suffix) ? workdir.slice(0, -suffix.length - 1) : null);
  }
  const fromVolumes = docker(["volume", "ls", "--format", `{{.Label "${LABEL}"}}`], { allowFail: true })
    .stdout.split("\n").filter((p) => p.startsWith("querino-tc-"));
  const reg = new Map(registryEntries().map((e) => [e.projectId, e]));
  const ids = new Set([...fromWorkdir.keys(), ...fromVolumes, ...reg.keys()]);
  return [...ids].sort().map((id) => ({
    projectId: id,
    root: reg.get(id)?.root ?? fromWorkdir.get(id) ?? null,
    ports: reg.get(id)?.ports,
  }));
}

function list() {
  const stacks = stacksOnMachine();
  if (!stacks.length) process.stdout.write("no test copies on this machine\n");
  for (const s of stacks) {
    const exists = s.root && fs.existsSync(s.root);
    process.stdout.write(
      `${s.projectId}  ${s.ports ? `api ${s.ports.api}` : "ports unknown"}  ${s.root ?? "checkout unknown"}${exists ? "" : "  (checkout gone)"}\n`,
    );
  }
}

/**
 * Remove the copies nobody can use any more: their checkout folder is gone (a
 * lap's worktree was deleted before its `down` ran). `up` runs this first, so
 * a lap that died never leaves a stack running for long. A copy whose
 * checkout cannot be told at all is removed only by an explicit `prune`.
 */
async function prune({ onlyKnownGone = false } = {}) {
  let removed = 0;
  for (const s of stacksOnMachine()) {
    if (s.projectId === PROJECT_ID) continue;
    if (s.root && fs.existsSync(s.root)) continue;
    if (!s.root && onlyKnownGone) continue;
    const left = await removeStack(s.projectId);
    if (left.length) log(`could not remove all of ${s.projectId}: ${left.join(", ")}`);
    else removed += 1;
    log(`pruned ${s.projectId} (${s.root ?? "checkout unknown"})`);
  }
  if (removed || !onlyKnownGone) log(`${removed} copies pruned`);
}

// ── main ─────────────────────────────────────────────────────────────────────

const command = process.argv[2];
const commands = {
  up,
  env: async () => {
    if (!running().length || !fs.existsSync(STATE_FILE)) fail(`${PROJECT_ID} is not up; run harness/test-copy.sh up`);
    const keys = await statusEnv();
    if (!keys) fail("supabase status did not report the copy's keys");
    process.stdout.write(exportsFor(JSON.parse(fs.readFileSync(STATE_FILE, "utf8")), keys) + "\n");
  },
  down: () => down(),
  status,
  list,
  prune: () => prune(),
};
if (!commands[command]) {
  process.stderr.write("usage: harness/test-copy.sh up|env|down|status|list|prune\n");
  process.exit(2);
}
await commands[command]();
