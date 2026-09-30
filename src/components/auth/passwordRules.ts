// The password rule the sign-up and reset forms check before asking the server.
//
// The project's auth settings (read 2026-09-30) require at least 8 characters
// with a lower-case letter, a capital, a digit and a symbol. Sign-up checked
// for 6 characters and nothing else, so "secret1" passed the form and then
// failed at the server; the reset form checked for 8 and not the rest. Signing
// in checks nothing but presence: an existing password is whatever it is.

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_HINT =
  "At least 8 characters, with a lower-case letter, a capital, a digit and a symbol.";

// The symbols the server counts (its required character set); a space or an
// accented letter is not one of them.
const SYMBOLS = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

/** Why a new password would be refused, or null when it meets the rule. */
export function newPasswordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  const missing: string[] = [];
  if (!/[a-z]/.test(password)) missing.push("a lower-case letter");
  if (!/[A-Z]/.test(password)) missing.push("a capital");
  if (!/[0-9]/.test(password)) missing.push("a digit");
  if (!SYMBOLS.test(password)) missing.push("a symbol");
  if (missing.length === 0) return null;
  const list =
    missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
  return `Password needs ${list}`;
}
