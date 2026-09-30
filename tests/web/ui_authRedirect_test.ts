import { assertEquals } from "@std/assert";
import {
  authHref,
  DEFAULT_REDIRECT,
  safeRedirect,
} from "@/components/auth/authRedirectLogic.ts";

Deno.test("an in-app path is kept, with its query string", () => {
  assertEquals(safeRedirect("/library"), "/library");
  assertEquals(safeRedirect("/discover?type=skills"), "/discover?type=skills");
  assertEquals(
    safeRedirect("/team/join?token=abc#x"),
    "/team/join?token=abc#x",
  );
});

Deno.test(
  "anything that could leave the site falls back to the library",
  () => {
    for (const bad of [
      null,
      undefined,
      "",
      "library",
      "//example.com",
      "https://example.com",
      "javascript:alert(1)",
      // A backslash or a tab is read by the browser as a slash or dropped, so
      // each of these is "//example.com" by the time the URL is parsed. Signed
      // in, /auth?redirect=/%5Cexample.com left the person on a broken 404 view
      // under /auth (2026-09-30, live).
      "/\\example.com",
      "/\t/example.com",
      "/\n/example.com",
      "\\\\example.com",
    ]) {
      assertEquals(safeRedirect(bad), DEFAULT_REDIRECT, String(bad));
    }
  },
);

Deno.test("the sign-in page itself is never a target", () => {
  assertEquals(safeRedirect("/auth"), DEFAULT_REDIRECT);
  assertEquals(safeRedirect("/auth?tab=signup"), DEFAULT_REDIRECT);
  assertEquals(safeRedirect("/auth/callback"), DEFAULT_REDIRECT);
});

Deno.test(
  "the header's sign-in links remember the page they were clicked on",
  () => {
    assertEquals(
      authHref("signin", "/prompts/some-prompt", ""),
      "/auth?redirect=%2Fprompts%2Fsome-prompt",
    );
    assertEquals(
      authHref("signup", "/discover", "?type=skills"),
      "/auth?tab=signup&redirect=%2Fdiscover%3Ftype%3Dskills",
    );
    // Home and the sign-in page itself add nothing.
    assertEquals(authHref("signin", "/"), "/auth");
    assertEquals(authHref("signup", "/"), "/auth?tab=signup");
    assertEquals(authHref("signin", "/auth", "?redirect=%2Flibrary"), "/auth");
  },
);
