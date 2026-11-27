import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  authenticateMcpRequestWithLimit,
  callerAddress,
  type FailureWindow,
  hashCallerAddress,
  MCP_AUTH_FAILURE_LIMIT,
  MCP_AUTH_FAILURE_WINDOW_SECONDS,
  type McpAuthFailureStore,
  retryAfterSeconds,
  tooManyFailuresResponse,
} from "./mcpAuthLimit.ts";
import type { TokenLookup } from "./mcpGate.ts";

const GOOD = "qrn_mcp_" + "g".repeat(40);
const BAD = "qrn_mcp_" + "b".repeat(40);
const ADDRESS = "address-1";

function withBearer(token: string | null): Request {
  const headers: Record<string, string> = {};
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  return new Request("https://example.test/mcp", { method: "POST", headers });
}

// The rule record_mcp_auth_failure keeps in the database, with the clock
// the test moves.
class MemoryStore implements McpAuthFailureStore {
  rows = new Map<string, FailureWindow>();
  constructor(private clock: { now: Date }) {}
  read(addressHash: string) {
    return Promise.resolve(this.rows.get(addressHash) ?? null);
  }
  record(addressHash: string, windowSeconds: number) {
    const now = this.clock.now;
    const row = this.rows.get(addressHash);
    if (
      !row ||
      row.startedAt.getTime() <= now.getTime() - windowSeconds * 1000
    ) {
      this.rows.set(addressHash, { failures: 1, startedAt: now });
    } else {
      row.failures += 1;
    }
    return Promise.resolve();
  }
}

function setup() {
  const clock = { now: new Date("2026-11-19T10:00:00Z") };
  const store = new MemoryStore(clock);
  let lookups = 0;
  const lookup: TokenLookup = async (hash) => {
    lookups += 1;
    const goodHash = await sha(GOOD);
    return { userId: hash === goodHash ? "user-1" : null, error: null };
  };
  const attempt = (token: string | null) =>
    authenticateMcpRequestWithLimit(withBearer(token), lookup, {
      store,
      addressHash: ADDRESS,
      now: clock.now,
    });
  return { clock, store, attempt, lookups: () => lookups };
}

async function sha(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function advance(clock: { now: Date }, seconds: number) {
  clock.now = new Date(clock.now.getTime() + seconds * 1000);
}

Deno.test("20 failures are 401, the 21st is 429 with Retry-After", async () => {
  const { clock, attempt } = setup();
  for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT; i++) {
    const out = await attempt(BAD);
    assertEquals(out.ok ? 200 : out.status, 401);
    advance(clock, 10);
  }
  const out = await attempt(BAD);
  assertEquals(out.ok, false);
  if (out.ok || out.status !== 429) throw new Error("expected 429");
  assertEquals(out.reason, "too_many_failures");
  assertEquals(out.retryAfterSeconds, MCP_AUTH_FAILURE_WINDOW_SECONDS - 200);
});

Deno.test(
  "over the limit, a missing or malformed token is 429 with no lookup",
  async () => {
    const { attempt, lookups } = setup();
    for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT; i++) await attempt(BAD);
    const before = lookups();
    for (const token of [null, "eyJhbGciOi.jwt.session"]) {
      const out = await attempt(token);
      assertEquals(out.ok ? 200 : out.status, 429);
    }
    assertEquals(lookups(), before);
  },
);

Deno.test(
  "over the limit, a good token still gets in and refusals are not counted",
  async () => {
    const { store, attempt } = setup();
    for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT; i++) await attempt(BAD);
    assertEquals(await attempt(GOOD), { ok: true, userId: "user-1" });
    const bad = await attempt(BAD);
    assertEquals(bad.ok ? 200 : bad.status, 429);
    assertEquals(await attempt(GOOD), { ok: true, userId: "user-1" });
    assertEquals((await store.read(ADDRESS))?.failures, MCP_AUTH_FAILURE_LIMIT);
  },
);

Deno.test("a good token is never limited below the limit", async () => {
  const { clock, store, attempt } = setup();
  for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT - 1; i++) {
    await attempt(BAD);
    const out = await attempt(GOOD);
    assertEquals(out, { ok: true, userId: "user-1" });
    advance(clock, 1);
  }
  // Successes are not counted: the address is still one failure short.
  assertEquals(
    (await store.read(ADDRESS))?.failures,
    MCP_AUTH_FAILURE_LIMIT - 1,
  );
});

Deno.test("missing and malformed tokens count as failures too", async () => {
  const { attempt } = setup();
  for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT; i++) {
    await attempt(i % 2 ? null : "eyJhbGciOi.jwt.session");
  }
  const out = await attempt(BAD);
  assertEquals(out.ok ? 200 : out.status, 429);
});

Deno.test("the limit ends when the window passes", async () => {
  const { clock, store, attempt } = setup();
  for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT; i++) await attempt(BAD);
  advance(clock, MCP_AUTH_FAILURE_WINDOW_SECONDS - 1);
  const still = await attempt(BAD);
  assertEquals(still.ok ? 0 : still.status, 429);
  if (!still.ok && still.status === 429) {
    assertEquals(still.retryAfterSeconds, 1);
  }

  advance(clock, 1);
  // The next failure is a 401 again and starts a fresh window at one.
  const out = await attempt(BAD);
  assertEquals(out.ok ? 0 : out.status, 401);
  assertEquals((await store.read(ADDRESS))?.failures, 1);
});

Deno.test(
  "failures spread over more than one window never reach the limit",
  async () => {
    const { clock, attempt } = setup();
    for (let i = 0; i < 3 * MCP_AUTH_FAILURE_LIMIT; i++) {
      const out = await attempt(BAD);
      assertEquals(out.ok ? 0 : out.status, 401);
      advance(clock, MCP_AUTH_FAILURE_WINDOW_SECONDS / 10);
    }
  },
);

Deno.test("a failed lookup (503) is not counted", async () => {
  const { store } = setup();
  const broken: TokenLookup = () =>
    Promise.resolve({ userId: null, error: "connection reset" });
  const now = new Date();
  for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT + 1; i++) {
    const out = await authenticateMcpRequestWithLimit(withBearer(BAD), broken, {
      store,
      addressHash: ADDRESS,
      now,
    });
    assertEquals(out.ok ? 0 : out.status, 503);
  }
  assertEquals(await store.read(ADDRESS), null);
});

Deno.test(
  "a store that fails, or an unknown address, falls back to the plain check",
  async () => {
    const failing: McpAuthFailureStore = {
      read: () => Promise.reject(new Error("down")),
      record: () => Promise.reject(new Error("down")),
    };
    const found: TokenLookup = () =>
      Promise.resolve({ userId: "user-1", error: null });
    const unknown: TokenLookup = () =>
      Promise.resolve({ userId: null, error: null });
    const now = new Date();
    const ok = await authenticateMcpRequestWithLimit(withBearer(GOOD), found, {
      store: failing,
      addressHash: ADDRESS,
      now,
    });
    assertEquals(ok, { ok: true, userId: "user-1" });
    const bad = await authenticateMcpRequestWithLimit(
      withBearer(BAD),
      unknown,
      { store: failing, addressHash: ADDRESS, now },
    );
    assertEquals(bad.ok ? 0 : bad.status, 401);

    const untouched: McpAuthFailureStore = {
      read: () => Promise.reject(new Error("must not be read")),
      record: () => Promise.reject(new Error("must not be written")),
    };
    const anon = await authenticateMcpRequestWithLimit(
      withBearer(BAD),
      unknown,
      { store: untouched, addressHash: null, now },
    );
    assertEquals(anon.ok ? 0 : anon.status, 401);
  },
);

Deno.test("retryAfterSeconds rounds up and is 0 outside the limit", () => {
  const startedAt = new Date("2026-11-19T10:00:00Z");
  const at = (ms: number) => new Date(startedAt.getTime() + ms);
  const full = { failures: MCP_AUTH_FAILURE_LIMIT, startedAt };
  assertEquals(retryAfterSeconds(null, at(0)), 0);
  assertEquals(
    retryAfterSeconds(
      { failures: MCP_AUTH_FAILURE_LIMIT - 1, startedAt },
      at(0),
    ),
    0,
  );
  assertEquals(retryAfterSeconds(full, at(0)), MCP_AUTH_FAILURE_WINDOW_SECONDS);
  assertEquals(retryAfterSeconds(full, at(599_001)), 1);
  assertEquals(retryAfterSeconds(full, at(600_000)), 0);
});

Deno.test("the caller's address is the one the platform wrote", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://example.test/mcp", { headers });
  const xff = (v: string) => req({ "X-Forwarded-For": v });
  assertEquals(
    callerAddress(
      req({ "CF-Connecting-IP": "198.51.100.9", "X-Forwarded-For": "1.1.1.1" }),
    ),
    "198.51.100.9",
  );
  assertEquals(callerAddress(xff("1.1.1.1, 203.0.113.7")), "203.0.113.7");
  assertEquals(callerAddress(xff("203.0.113.7")), "203.0.113.7");
  assertEquals(callerAddress(xff(" 2001:db8::1 ")), "2001:db8::1");
  assertEquals(callerAddress(xff("1.1.1.1, 203.0.113.7, ,")), "203.0.113.7");
  assertEquals(callerAddress(xff("")), null);
  assertEquals(callerAddress(req({})), null);
});

Deno.test(
  "a forged X-Forwarded-For entry does not escape the 429",
  async () => {
    const clock = { now: new Date("2026-11-19T10:00:00Z") };
    const store = new MemoryStore(clock);
    const lookup: TokenLookup = async (hash) => ({
      userId: hash === (await sha(GOOD)) ? "user-1" : null,
      error: null,
    });
    const attempt = async (token: string, forged: string) => {
      const req = new Request("https://example.test/mcp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": `${forged}, 203.0.113.7`,
        },
      });
      const addressHash = await hashCallerAddress(callerAddress(req)!, "key");
      return authenticateMcpRequestWithLimit(req, lookup, {
        store,
        addressHash,
        now: clock.now,
      });
    };
    for (let i = 0; i < MCP_AUTH_FAILURE_LIMIT; i++) {
      const out = await attempt(BAD, `10.0.0.${i}`);
      assertEquals(out.ok ? 200 : out.status, 401);
    }
    const out = await attempt(BAD, "10.9.9.9");
    assertEquals(out.ok ? 200 : out.status, 429);
    assertEquals(await attempt(GOOD, "10.8.8.8"), {
      ok: true,
      userId: "user-1",
    });
  },
);

Deno.test("the stored address is a keyed hash, not the address", async () => {
  const a = await hashCallerAddress("203.0.113.7", "key-1");
  assertEquals(/^[0-9a-f]{64}$/.test(a), true);
  assertEquals(a.includes("203"), false);
  assertEquals(a, await hashCallerAddress("203.0.113.7", "key-1"));
  assertNotEquals(a, await hashCallerAddress("203.0.113.7", "key-2"));
  assertNotEquals(a, await sha("203.0.113.7"));
});

Deno.test(
  "the 429 answer carries Retry-After, the error and the given headers",
  async () => {
    const res = tooManyFailuresResponse(
      {
        ok: false,
        status: 429,
        reason: "too_many_failures",
        message: "Too many failed sign-ins",
        retryAfterSeconds: 37,
      },
      { "Access-Control-Allow-Origin": "*" },
    );
    assertEquals(res.status, 429);
    assertEquals(res.headers.get("Retry-After"), "37");
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Content-Type"), "application/json");
    assertEquals(await res.json(), { error: "Too many failed sign-ins" });
  },
);

Deno.test(
  "a forged address header on every try (Cf-Connecting-Ip, only or last X-Forwarded-For entry) still reaches the 429",
  async () => {
    const clock = { now: new Date("2026-11-19T10:00:00Z") };
    const store = new MemoryStore(clock);
    const lookup: TokenLookup = async (hash) => ({
      userId: hash === (await sha(GOOD)) ? "user-1" : null,
      error: null,
    });
    const globalHash = await hashCallerAddress("all-callers", "key");
    const shapes = [
      (i: number) => ({ "CF-Connecting-IP": `10.1.0.${i}` }),
      (i: number) => ({ "X-Forwarded-For": `10.2.0.${i}` }),
      (i: number) => ({ "X-Forwarded-For": `1.1.1.1, 10.3.0.${i}` }),
    ];
    const statuses: number[] = [];
    for (let i = 0; i < 30; i++) {
      const req = new Request("https://example.test/mcp", {
        method: "POST",
        headers: { Authorization: `Bearer ${BAD}`, ...shapes[i % 3](i) },
      });
      const address = callerAddress(req);
      const out = await authenticateMcpRequestWithLimit(req, lookup, {
        store,
        addressHash: address ? await hashCallerAddress(address, "key") : null,
        globalHash,
        now: clock.now,
      });
      statuses.push(out.ok ? 200 : out.status);
    }
    assertEquals(statuses.slice(0, MCP_AUTH_FAILURE_LIMIT).every((s) => s === 401), true);
    assertEquals(statuses.slice(MCP_AUTH_FAILURE_LIMIT).every((s) => s === 429), true);
    const good = new Request("https://example.test/mcp", {
      method: "POST",
      headers: { Authorization: `Bearer ${GOOD}`, "CF-Connecting-IP": "10.9.9.9" },
    });
    assertEquals(
      await authenticateMcpRequestWithLimit(good, lookup, {
        store,
        addressHash: await hashCallerAddress("10.9.9.9", "key"),
        globalHash,
        now: clock.now,
      }),
      { ok: true, userId: "user-1" },
    );
  },
);
