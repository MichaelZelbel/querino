// The pure part of the factory's test copy (harness/test-copy.sh): naming, ports,
// the generated config and the rewrite that keeps the copy off the live project.
// No process, no network, no file system, so tests/scripts/test-copy.test.mjs
// can check every decision here without Docker.

import { createHash } from "node:crypto";
import path from "node:path";

/** The live project. Nothing in a test copy may name it. */
export const LIVE_REF = "zvuwkffneqxqsihlnfsd";

/**
 * Where the copy's own database sends what the migrations aimed at the live
 * project: the local gateway, by the name it has on the stack's Docker network.
 */
export const LOCAL_GATEWAY = "http://kong:8000";

/** What a bare mention of the live project ref becomes in the copy. */
export const REF_STAND_IN = "test-copy-no-live-project";

/** What a live project key written into a migration becomes in the copy. */
export const KEY_STAND_IN = "test-copy-no-live-key";

/**
 * The Supabase CLI, pinned. 2.122.1 is the last release of the 2.x line
 * (2026-11-02); 3.x is a new major that nothing here has been tried against.
 * The checksums are the release's own checksums.txt, written down here so a
 * replaced download is refused rather than run.
 */
export const CLI_VERSION = "2.122.1";
export const CLI_SHA256 = {
  "linux-x64":
    "3e54b98e5ead7be0a3b0753526833d4cc9a55304e4d57da0d72f1efc342738ea",
  "linux-arm64":
    "f672614c2cb876b37d63a28d9ab4442406cdcae9843e15ddc7a4a1538785b30f",
};
export const CLI_ASSET = {
  "linux-x64": `supabase_${CLI_VERSION}_linux_amd64.tar.gz`,
  "linux-arm64": `supabase_${CLI_VERSION}_linux_arm64.tar.gz`,
};

/**
 * The services a lap needs: the database, the gateway, sign-in, the REST API,
 * storage (the avatars bucket) and the edge functions. Everything else is left
 * out to keep the images and the memory small; nothing in src/ uses realtime.
 */
export const EXCLUDED_SERVICES = [
  "realtime",
  "imgproxy",
  "mailpit",
  "postgres-meta",
  "studio",
  "logflare",
  "vector",
  "supavisor",
];

/**
 * Port blocks start at 20000, below Linux's ephemeral range (32768 and up),
 * so a block never collides with the free port a lap's app server or a
 * browser picks. 1000 blocks of 10.
 */
export const PORT_FIRST = 20000;
export const PORT_BLOCKS = 1000;
export const PORT_BLOCK_SIZE = 10;

/** The checkout's identity: its absolute path, normalised. */
export function checkoutHash(root) {
  const normal = path.resolve(root).replace(/[\\/]+$/, "");
  return createHash("sha256").update(normal).digest("hex");
}

/** One project id per checkout, so two laps never share containers or volumes. */
export function projectIdFor(root) {
  return `querino-tc-${checkoutHash(root).slice(0, 10)}`;
}

/**
 * The checkout's port block. `attempt` moves to the next block when the
 * preferred one is taken, so the first choice is stable and a clash still
 * finds a free block.
 */
export function portBlockFor(root, attempt = 0) {
  const start = parseInt(checkoutHash(root).slice(0, 8), 16) % PORT_BLOCKS;
  const block = (start + attempt) % PORT_BLOCKS;
  return PORT_FIRST + block * PORT_BLOCK_SIZE;
}

/** What each port in a block is for. Only api and db are bound by default. */
export function portsFor(base) {
  return {
    api: base,
    db: base + 1,
    shadow: base + 2,
    pooler: base + 3,
    studio: base + 4,
    smtpWeb: base + 5,
    smtp: base + 6,
    pop3: base + 7,
    analytics: base + 8,
    inspector: base + 9,
  };
}

function b64urlDecode(part) {
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(
    b64 + "=".repeat((4 - (b64.length % 4)) % 4),
    "base64",
  ).toString("utf8");
}

const JWT_RE =
  /eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{10,}/g;

/** The project ref a Supabase JWT was issued for, or null. */
export function jwtRef(token) {
  try {
    const payload = JSON.parse(b64urlDecode(token.split(".")[1]));
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

/**
 * A migration as the test copy applies it. The repository's file is never
 * changed (it is what the live project ran); the copy's database gets a
 * version in which:
 *
 *   1. every https://<live>.supabase.co address points at the local gateway,
 *      so the scheduled jobs and the signup trigger call the copy's own edge
 *      functions;
 *   2. every key issued for the live project is replaced by a stand-in;
 *   3. any other mention of the live ref is replaced by a stand-in, so an
 *      address built in pieces cannot reach the live project either.
 *
 * This happens BEFORE the migrations run, not after: one job ticks every 30
 * seconds the moment its migration is applied, and pg_net would send that
 * request long before any clean-up afterwards could remove it.
 */
export function rewriteMigration(
  sql,
  { liveRef = LIVE_REF, gateway = LOCAL_GATEWAY } = {},
) {
  let urls = 0;
  let keys = 0;
  let refs = 0;
  const urlRe = new RegExp(`https?://${liveRef}\\.supabase\\.(co|in)`, "gi");
  let out = sql.replace(urlRe, () => {
    urls += 1;
    return gateway;
  });
  out = out.replace(JWT_RE, (token) => {
    if (jwtRef(token) !== liveRef) return token;
    keys += 1;
    return KEY_STAND_IN;
  });
  out = out.replace(new RegExp(liveRef, "gi"), () => {
    refs += 1;
    return REF_STAND_IN;
  });
  return { sql: out, urls, keys, refs };
}

/** Every way `text` still names the live project: its ref, or a key issued for it. */
export function liveReferences(text, liveRef = LIVE_REF) {
  const found = [];
  if (text.toLowerCase().includes(liveRef.toLowerCase()))
    found.push(`the ref ${liveRef}`);
  for (const token of text.match(JWT_RE) ?? []) {
    if (jwtRef(token) === liveRef)
      found.push("a key issued for the live project");
  }
  return found;
}

function tomlValue(v) {
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return `[${v.map(tomlValue).join(", ")}]`;
  return JSON.stringify(String(v));
}

const HEADER_RE = /^\s*\[([^\[\]]+)\]\s*(#.*)?$/;

/**
 * Set keys in a TOML document without a TOML library (the harness adds no
 * dependency). `settings` maps a table name ("" for the top level) to the keys
 * it must hold. A key already in that table is replaced in place, a missing
 * key goes directly under the table's header, and a missing table is appended.
 * Every other line, comments included, stays as it was, so the repository's
 * [functions.*] settings reach the copy unchanged.
 */
export function setTomlKeys(toml, settings) {
  const lines = toml.replace(/\r\n/g, "\n").split("\n");
  const tableOf = [];
  const headerAt = new Map([["", -1]]);
  let current = "";
  lines.forEach((line, i) => {
    const m = line.match(HEADER_RE);
    if (m) {
      current = m[1].trim();
      if (!headerAt.has(current)) headerAt.set(current, i);
    }
    tableOf.push(current);
  });

  const replace = new Map();
  const insertAfter = new Map();
  const appended = [];
  for (const [table, keys] of Object.entries(settings)) {
    for (const [key, value] of Object.entries(keys)) {
      const line = `${key} = ${tomlValue(value)}`;
      const keyRe = new RegExp(
        `^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=`,
      );
      const at = lines.findIndex(
        (l, i) => tableOf[i] === table && keyRe.test(l),
      );
      if (at >= 0) {
        replace.set(at, line);
      } else if (headerAt.has(table)) {
        const h = headerAt.get(table);
        insertAfter.set(h, [...(insertAfter.get(h) ?? []), line]);
      } else {
        let block = appended.find((b) => b.table === table);
        if (!block) {
          block = { table, lines: [] };
          appended.push(block);
        }
        block.lines.push(line);
      }
    }
  }

  const out = [...(insertAfter.get(-1) ?? [])];
  lines.forEach((line, i) => {
    out.push(replace.has(i) ? replace.get(i) : line);
    if (insertAfter.has(i)) out.push(...insertAfter.get(i));
  });
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  for (const block of appended) {
    out.push("", `[${block.table}]`, ...block.lines);
  }
  return out.join("\n") + "\n";
}

/**
 * The copy's config.toml: the repository's own file (its [functions.*]
 * verify_jwt settings decide the gateway's behaviour as they do on the live
 * project) with this checkout's project id and ports, the services it needs,
 * and its edge function secrets as env() references, so no value is written
 * into a file.
 */
export function renderConfig(repoToml, { projectId, ports, secrets = {} }) {
  const settings = {
    "": { project_id: projectId },
    api: {
      port: ports.api,
      // The live project stopped granting new tables to the API roles on
      // 2026-10-30 (CLAUDE.md). The copy does the same, so a migration that
      // forgets its grants fails here the way it would fail there.
      auto_expose_new_tables: false,
    },
    db: { port: ports.db, shadow_port: ports.shadow, major_version: 17 },
    "db.pooler": { enabled: false, port: ports.pooler },
    "db.seed": { enabled: false },
    realtime: { enabled: false },
    studio: { enabled: false, port: ports.studio },
    local_smtp: { enabled: false, port: ports.smtpWeb },
    storage: { enabled: true },
    "storage.vector": { enabled: false },
    analytics: { enabled: false, port: ports.analytics },
    auth: {
      enabled: true,
      site_url: "http://127.0.0.1:8080",
      additional_redirect_urls: [
        "http://127.0.0.1:8080",
        "http://localhost:8080",
      ],
      enable_signup: true,
    },
    "auth.email": { enable_signup: true, enable_confirmations: false },
    edge_runtime: {
      enabled: true,
      policy: "per_worker",
      inspector_port: ports.inspector,
    },
  };
  if (Object.keys(secrets).length) settings["edge_runtime.secrets"] = secrets;
  return setTomlKeys(repoToml, settings);
}

/** One POSIX shell word. */
export function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/** `export NAME='value'` lines, for `eval "$(harness/test-copy.sh env)"`. */
export function shellExports(vars) {
  return Object.entries(vars)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(k))
        throw new Error(`not a shell variable name: ${k}`);
      return `export ${k}=${shellQuote(v)}`;
    })
    .join("\n");
}

/** SQL string literal. */
export function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}
