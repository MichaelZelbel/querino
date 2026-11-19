import { assertEquals } from "@std/assert";
import {
  CREATOR_LINK_LABEL_ERROR,
  CREATOR_LINK_URL_ERROR,
  creatorLinkDomain,
  creatorLinkPrefill,
  normalizeCreatorLinkUrl,
  planCreatorLinkWrite,
  validateCreatorLink,
} from "@/lib/creatorLink.ts";

Deno.test("a name of 40 characters passes and one of 41 does not", () => {
  const url = "https://creator.example";
  assertEquals(validateCreatorLink({ url, label: "x".repeat(40) }), {
    ok: true,
    value: { url: "https://creator.example/", label: "x".repeat(40) },
  });
  assertEquals(validateCreatorLink({ url, label: "x".repeat(41) }), {
    ok: false,
    errors: { label: CREATOR_LINK_LABEL_ERROR },
  });
});

Deno.test("an empty address is no link, whatever the name says", () => {
  assertEquals(validateCreatorLink({ url: "  ", label: "My book" }), {
    ok: true,
    value: null,
  });
});

Deno.test("a bare address gets https://", () => {
  assertEquals(normalizeCreatorLinkUrl("example.com/x"), "https://example.com/x");
  assertEquals(
    normalizeCreatorLinkUrl("example.com:8080/x"),
    "https://example.com:8080/x",
  );
});

Deno.test("only a public web address is accepted", () => {
  for (const bad of [
    "javascript:alert(1)",
    "ftp://x.org",
    "https://user:pw@evil.com",
    "localhost",
    "data:text/html,hi",
  ]) {
    assertEquals(normalizeCreatorLinkUrl(bad), null, bad);
  }
  assertEquals(validateCreatorLink({ url: "javascript:alert(1)", label: "" }), {
    ok: false,
    errors: { url: CREATOR_LINK_URL_ERROR },
  });
});

Deno.test("the domain shown is the host of the stored address, not the name", () => {
  assertEquals(creatorLinkDomain("https://www.Example.org/path?q"), "example.org");
  const link = { label: "google.com", url: "https://shop.example.net/buy" };
  assertEquals(creatorLinkDomain(link.url), "shop.example.net");
  // A look-alike host stays in its xn-- form.
  assertEquals(creatorLinkDomain("https://аpple.com/"), "xn--pple-43d.com");
});

Deno.test("the prefill takes the profile website only when it is usable", () => {
  assertEquals(creatorLinkPrefill("mysite.dev"), {
    url: "https://mysite.dev/",
    label: "",
  });
  assertEquals(creatorLinkPrefill(null), { url: "", label: "" });
  assertEquals(creatorLinkPrefill("not a site"), { url: "", label: "" });
});

Deno.test("only a change is written", () => {
  const a = { url: "https://a.example/", label: "A" };
  assertEquals(planCreatorLinkWrite(null, null), "none");
  assertEquals(planCreatorLinkWrite(null, a), "insert");
  assertEquals(planCreatorLinkWrite(a, { ...a }), "none");
  assertEquals(planCreatorLinkWrite(a, { ...a, label: "B" }), "update");
  assertEquals(planCreatorLinkWrite(a, null), "delete");
});
