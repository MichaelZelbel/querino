import { assertEquals } from "@std/assert";
import { newPasswordProblem } from "@/components/auth/passwordRules.ts";

Deno.test("the forms refuse what the server refuses", () => {
  // Passed the old sign-up check (6 characters), refused by the server.
  assertEquals(
    newPasswordProblem("secret1"),
    "Password must be at least 8 characters",
  );
  assertEquals(
    newPasswordProblem("secretpassword"),
    "Password needs a capital, a digit and a symbol",
  );
  assertEquals(newPasswordProblem("Secretpass1"), "Password needs a symbol");
  // A space is not one of the server's symbols.
  assertEquals(newPasswordProblem("Secret pass1"), "Password needs a symbol");
});

Deno.test("a password with every class passes", () => {
  assertEquals(newPasswordProblem("Secret-pass1"), null);
  assertEquals(newPasswordProblem("A1b2c3d4\\"), null);
});
