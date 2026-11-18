import { assertEquals } from "@std/assert";
import { resetLinkState } from "@/components/auth/resetLinkState.ts";

const bare = { search: "", hash: "" };

Deno.test("opened without a reset link, nothing has expired", () => {
  assertEquals(resetLinkState(bare, false), "missing");
  assertEquals(
    resetLinkState({ search: "?utm_source=x", hash: "" }, false),
    "missing",
  );
  assertEquals(resetLinkState({ search: "", hash: "#" }, false), "missing");
});

Deno.test("a link Supabase refused is an expired link", () => {
  // What /auth/v1/verify redirects to for a used or expired recovery token.
  const refused =
    "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
  assertEquals(resetLinkState({ search: "", hash: refused }, false), "expired");
  assertEquals(
    resetLinkState(
      { search: "?error=access_denied&error_code=otp_expired", hash: "" },
      false,
    ),
    "expired",
  );
});

Deno.test("a token that produced no session is an expired link", () => {
  assertEquals(
    resetLinkState(
      { search: "", hash: "#access_token=abc&type=recovery" },
      false,
    ),
    "expired",
  );
  assertEquals(
    resetLinkState({ search: "?code=abc", hash: "" }, false),
    "expired",
  );
  assertEquals(
    resetLinkState({ search: "?type=recovery", hash: "" }, false),
    "expired",
  );
});

Deno.test("a session sets the new password, whatever the URL holds", () => {
  assertEquals(resetLinkState(bare, true), "ready");
  assertEquals(
    resetLinkState(
      { search: "", hash: "#access_token=abc&type=recovery" },
      true,
    ),
    "ready",
  );
});
