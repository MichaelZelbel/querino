// The validator is the only thing between a user-editable column and an
// outbound fetch carrying that user's API key, so each refusal is pinned.

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  assertMenerioBaseUrl,
  assertMenerioLinkCallback,
  MENERIO_HOST,
  MENERIO_LINK_CALLBACK_PATH,
} from "./menerioUrl.ts";

Deno.test("the hard-coded Menerio host passes and keeps its path", () => {
  assertEquals(
    assertMenerioBaseUrl(`https://${MENERIO_HOST}/functions/v1`),
    `https://${MENERIO_HOST}/functions/v1`,
  );
});

Deno.test("a trailing slash, query and fragment are stripped", () => {
  assertEquals(
    assertMenerioBaseUrl(`https://${MENERIO_HOST}/functions/v1/?x=1#top`),
    `https://${MENERIO_HOST}/functions/v1`,
  );
});

Deno.test("a subdomain of the Menerio host passes", () => {
  assertEquals(
    assertMenerioBaseUrl(`https://api.${MENERIO_HOST}/functions/v1`),
    `https://api.${MENERIO_HOST}/functions/v1`,
  );
});

Deno.test("http is refused", () => {
  assertThrows(
    () => assertMenerioBaseUrl(`http://${MENERIO_HOST}/functions/v1`),
    Error,
    "https",
  );
});

Deno.test("another host is refused, including a look-alike", () => {
  assertThrows(
    () => assertMenerioBaseUrl("https://example.com/functions/v1"),
    Error,
    "not Menerio",
  );
  assertThrows(
    () => assertMenerioBaseUrl(`https://${MENERIO_HOST}.evil.com/functions/v1`),
    Error,
    "not Menerio",
  );
  assertThrows(
    () => assertMenerioBaseUrl(`https://evil${MENERIO_HOST}/functions/v1`),
    Error,
    "not Menerio",
  );
});

Deno.test("an internal IP is refused", () => {
  assertThrows(
    () => assertMenerioBaseUrl("https://169.254.169.254/latest/meta-data"),
    Error,
    "not Menerio",
  );
  assertThrows(
    () => assertMenerioBaseUrl("https://10.0.0.1/functions/v1"),
    Error,
    "not Menerio",
  );
});

Deno.test("credentials in the URL are refused", () => {
  assertThrows(
    () =>
      assertMenerioBaseUrl(`https://user:pass@${MENERIO_HOST}/functions/v1`),
    Error,
    "credentials",
  );
});

Deno.test("a non-default port is refused", () => {
  assertThrows(
    () => assertMenerioBaseUrl(`https://${MENERIO_HOST}:8443/functions/v1`),
    Error,
    "port",
  );
});

Deno.test("an empty or unparseable value is refused", () => {
  assertThrows(() => assertMenerioBaseUrl(""), Error, "empty");
  assertThrows(() => assertMenerioBaseUrl("not a url"), Error, "valid URL");
});

// ── The link callback (7 October 2026) ──────────────────────────────────────
//
// menerio-link-callback sends the user's Menerio API key to this URL, and the
// URL arrives in a link anyone can craft. Pinning the host alone let it name
// any function on Menerio's host; only Menerio's own link-note address passes.

const BASE = `https://${MENERIO_HOST}/functions/v1`;
const CALLBACK = `https://${MENERIO_HOST}/functions/v1/link-note`;

Deno.test("Menerio's own link-note address passes and is rebuilt", () => {
  const url = assertMenerioLinkCallback(CALLBACK, BASE);
  assertEquals(url.href, CALLBACK);
  assertEquals(url.pathname, MENERIO_LINK_CALLBACK_PATH);
});

Deno.test("any other function on the Menerio host is refused", () => {
  for (const path of [
    "/functions/v1/receive-note",
    "/functions/v1/link-note/",
    "/functions/v1/link-note/extra",
    "/functions/v1/Link-Note",
    "/functions/v1%2Flink-note",
    "/functions/v2/link-note",
    "/link-note",
    "/",
  ]) {
    assertThrows(
      () => assertMenerioLinkCallback(`https://${MENERIO_HOST}${path}`, BASE),
      Error,
      "link-note",
      path,
    );
  }
});

Deno.test(
  "a path that only normalises to link-note is the same address",
  () => {
    // The URL parser resolves dot segments before the check, so this is the
    // real address, not a way round it.
    assertEquals(
      assertMenerioLinkCallback(
        `https://${MENERIO_HOST}/functions/x/../v1/link-note`,
        BASE,
      ).href,
      CALLBACK,
    );
  },
);

Deno.test("a query string or a fragment is refused", () => {
  assertThrows(
    () => assertMenerioLinkCallback(`${CALLBACK}?next=/functions/v1/x`, BASE),
    Error,
    "query",
  );
  assertThrows(
    () => assertMenerioLinkCallback(`${CALLBACK}#x`, BASE),
    Error,
    "query",
  );
});

Deno.test("http, credentials, a port or another host are refused", () => {
  assertThrows(
    () =>
      assertMenerioLinkCallback(
        `http://${MENERIO_HOST}/functions/v1/link-note`,
        BASE,
      ),
    Error,
    "https",
  );
  assertThrows(
    () =>
      assertMenerioLinkCallback(
        `https://u:p@${MENERIO_HOST}/functions/v1/link-note`,
        BASE,
      ),
    Error,
    "credentials",
  );
  assertThrows(
    () =>
      assertMenerioLinkCallback(
        `https://${MENERIO_HOST}:8443/functions/v1/link-note`,
        BASE,
      ),
    Error,
    "port",
  );
  assertThrows(
    () =>
      assertMenerioLinkCallback(
        "https://evil.example/functions/v1/link-note",
        BASE,
      ),
    Error,
    "host does not match",
  );
  // A subdomain is a different host from the registered one.
  assertThrows(
    () =>
      assertMenerioLinkCallback(
        `https://api.${MENERIO_HOST}/functions/v1/link-note`,
        BASE,
      ),
    Error,
    "host does not match",
  );
});

Deno.test(
  "the path does not follow a user-edited base URL, and a foreign base is refused",
  () => {
    // menerio_base_url is user-writable. A base ending in another function
    // must not move the callback there.
    assertThrows(
      () =>
        assertMenerioLinkCallback(
          `https://${MENERIO_HOST}/functions/v1/other/link-note`,
          `https://${MENERIO_HOST}/functions/v1/other`,
        ),
      Error,
      "link-note",
    );
    assertThrows(
      () =>
        assertMenerioLinkCallback(
          "https://evil.example/functions/v1/link-note",
          "https://evil.example/functions/v1",
        ),
      Error,
      "not Menerio",
    );
  },
);

Deno.test("an empty or unparseable callback is refused", () => {
  assertThrows(() => assertMenerioLinkCallback("", BASE), Error, "empty");
  assertThrows(() => assertMenerioLinkCallback(42, BASE), Error, "empty");
  assertThrows(
    () => assertMenerioLinkCallback("not a url", BASE),
    Error,
    "valid URL",
  );
});
