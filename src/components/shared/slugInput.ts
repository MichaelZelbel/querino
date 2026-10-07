// What is wrong with a slug typed into the slug editors, checked before it is
// sent to generate-slug. That function turns anything without a letter or a
// digit into "untitled-xxxxxxxx", so "???" was accepted and silently became a
// random address instead of "Invalid slug" (2026-10-07). Letters of any
// script count: generate-slug transliterates them.
export function slugInputProblem(input: string): string | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "Slug cannot be empty";
  if (!/[\p{L}\p{N}]/u.test(trimmed)) {
    return "Invalid slug: use at least one letter or number";
  }
  return null;
}
