import { assertEquals } from "@std/assert";
import {
  DEFAULT_REDIRECT,
  getAndClearRedirectPath,
  getRedirectFromParams,
  safeRedirectPath,
  storeRedirectPath,
} from "@/lib/authRedirect.ts";

const fromUrl = (query: string) =>
  getRedirectFromParams(new URLSearchParams(query));

Deno.test("a redirect to another site is replaced by the default", () => {
  // getRedirectFromParams used to hand these back as they came, leaving the
  // check to every caller.
  for (const hostile of [
    "redirect=//evil.example",
    "redirect=/%5Cevil.example",
    "redirect=/%09/evil.example",
    "redirect=https://evil.example",
    "redirect=javascript:alert(1)",
    "redirect=evil.example",
  ]) {
    assertEquals(fromUrl(hostile), DEFAULT_REDIRECT, hostile);
  }
});

Deno.test("a path on this site is kept, query and hash included", () => {
  assertEquals(fromUrl("redirect=/prompts/new"), "/prompts/new");
  assertEquals(
    fromUrl(`redirect=${encodeURIComponent("/team/join?token=a+b=")}`),
    "/team/join?token=a+b=",
  );
  assertEquals(fromUrl(""), DEFAULT_REDIRECT);
});

Deno.test("the sign-in page never redirects to itself", () => {
  assertEquals(safeRedirectPath("/auth"), DEFAULT_REDIRECT);
  assertEquals(safeRedirectPath("/auth?redirect=/x"), DEFAULT_REDIRECT);
  assertEquals(safeRedirectPath("/author/page"), "/author/page");
  assertEquals(safeRedirectPath("/prompts/a\\b"), DEFAULT_REDIRECT);
});

Deno.test("a stored path is checked on the way in and on the way out", () => {
  const store = new Map<string, string>();
  const g = globalThis as { window?: unknown };
  const previous = g.window;
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  try {
    storeRedirectPath("//evil.example");
    assertEquals(getAndClearRedirectPath(), DEFAULT_REDIRECT);

    // A value written straight into storage, e.g. by an older build.
    store.set(
      "querino_redirect_path",
      JSON.stringify({ path: "/\\evil.example", at: Date.now() }),
    );
    assertEquals(getAndClearRedirectPath(), DEFAULT_REDIRECT);

    storeRedirectPath("/collections/new");
    assertEquals(getAndClearRedirectPath(), "/collections/new");
    assertEquals(getAndClearRedirectPath(), DEFAULT_REDIRECT);
  } finally {
    g.window = previous;
  }
});
