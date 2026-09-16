// The validator is the only thing between a user-editable column and an
// outbound fetch carrying that user's API key, so each refusal is pinned.

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertMenerioBaseUrl, MENERIO_HOST } from "./menerioUrl.ts";

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
