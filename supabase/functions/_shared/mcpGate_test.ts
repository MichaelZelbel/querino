import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  authenticateMcpRequest,
  describeMcpBadRequest,
  mcpMethodGate,
  type TokenLookup,
} from "./mcpGate.ts";

const TOKEN = "qrn_mcp_" + "a".repeat(40);

function withBearer(token: string | null): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  return new Request("https://example.test/mcp", { method: "POST", headers });
}

const found: TokenLookup = () =>
  Promise.resolve({ userId: "user-1", error: null });
const unknown: TokenLookup = () =>
  Promise.resolve({ userId: null, error: null });
const broken: TokenLookup = () =>
  Promise.resolve({
    userId: null,
    error: "error sending request for url (.../rpc/lookup_mcp_token)",
  });

Deno.test("a good token is let in", async () => {
  assertEquals(await authenticateMcpRequest(withBearer(TOKEN), found), {
    ok: true,
    userId: "user-1",
  });
});

Deno.test(
  "a failed lookup is 503, not 401: the client must keep its token",
  async () => {
    // Until 2026-09-30 the lookup error was thrown into the same catch as a
    // bad token and answered 401, and an MCP client told 401 throws its
    // token away. It happened on 2026-09-25 ("error sending request for url
    // ... rpc/...").
    const out = await authenticateMcpRequest(withBearer(TOKEN), broken);
    assertEquals(out.ok, false);
    if (out.ok) return;
    assertEquals(out.status, 503);
    assertEquals(out.reason, "lookup_error");
    assertEquals(out.message.includes("rpc/"), false);
  },
);

Deno.test("a lookup that throws is also 503", async () => {
  const out = await authenticateMcpRequest(withBearer(TOKEN), () =>
    Promise.reject(new TypeError("fetch failed")),
  );
  assertEquals(out.ok ? 0 : out.status, 503);
});

Deno.test(
  "each refusal names its class, and none carries the token",
  async () => {
    const cases: Array<[Request, TokenLookup, number, string]> = [
      [withBearer(null), found, 401, "missing"],
      [withBearer(""), found, 401, "missing"],
      [withBearer("eyJhbGciOi.jwt.session"), found, 401, "wrong_prefix"],
      [withBearer(TOKEN), unknown, 401, "unknown_or_expired"],
    ];
    for (const [req, lookup, status, reason] of cases) {
      const out = await authenticateMcpRequest(req, lookup);
      assertEquals(out.ok, false);
      if (out.ok) continue;
      assertEquals([out.status, out.reason], [status, reason]);
      assertEquals(out.message.includes(TOKEN), false);
      assertEquals(out.message.includes("eyJ"), false);
    }
  },
);

Deno.test(
  "the lookup is given the SHA-256 of the token, never the token",
  async () => {
    let seen = "";
    await authenticateMcpRequest(withBearer(TOKEN), (hash) => {
      seen = hash;
      return Promise.resolve({ userId: "u", error: null });
    });
    assertEquals(/^[0-9a-f]{64}$/.test(seen), true);
  },
);

// ── Methods ──────────────────────────────────────────────────────────────

function req(method: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.test/mcp", { method, headers });
}

Deno.test(
  "a client's GET for an event stream is 405 with Allow: POST, whatever version it names",
  () => {
    // mcp-lite 0.10.0 negotiates an unknown client version down to
    // 2025-03-26 and then answers the client's GET, which carries that
    // version, with 400 "Protocol version mismatch". The spec's answer from
    // a server with no event stream is 405.
    for (const version of ["2025-03-26", "2025-06-18", "2025-11-25", ""]) {
      const headers: Record<string, string> = {
        Accept: "text/event-stream",
        Authorization: `Bearer ${TOKEN}`,
      };
      if (version) headers["MCP-Protocol-Version"] = version;
      const res = mcpMethodGate(req("GET", headers));
      assertEquals(res?.status, 405);
      assertEquals(res?.headers.get("Allow"), "POST");
    }
    assertEquals(mcpMethodGate(req("HEAD"))?.status, 405);
  },
);

Deno.test("POST and OPTIONS go on to the transport", () => {
  assertEquals(mcpMethodGate(req("POST")), null);
  assertEquals(mcpMethodGate(req("OPTIONS")), null);
});

// ── What a 400 was about ─────────────────────────────────────────────────

Deno.test("a 400 is described by protocol metadata only", () => {
  const described = describeMcpBadRequest(
    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    "2025-11-25",
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32602, message: "Protocol version mismatch" },
    }),
  );
  assertEquals(described, {
    method: "tools/list",
    protocol: "2025-11-25",
    reason: "Protocol version mismatch",
  });
});

Deno.test("user text never reaches the description", () => {
  const described = describeMcpBadRequest(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "my secret prompt text",
      params: { content: "private" },
    }),
    "not a version; with text",
    "Bad Request: Protocol version mismatch",
  );
  assertEquals(described.method, "other");
  assertEquals(described.protocol, "other");
  assertStringIncludes(described.reason, "Protocol version mismatch");
  assertEquals(JSON.stringify(described).includes("private"), false);
});

Deno.test("batches, empty and broken bodies have names of their own", () => {
  assertEquals(describeMcpBadRequest("[]", null, "").method, "batch");
  assertEquals(describeMcpBadRequest("", null, "").method, "empty");
  assertEquals(
    describeMcpBadRequest("{not json", null, "").method,
    "unparseable",
  );
  assertEquals(describeMcpBadRequest("{}", null, "").method, "none");
  assertEquals(describeMcpBadRequest("{}", null, "").protocol, "none");
});
