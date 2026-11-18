// What the reset-password page shows. Kept out of ResetPassword.tsx so it can
// be tested without React or the Supabase client.

export type ResetLinkState = "ready" | "expired" | "missing";

// A recovery mail's link lands here carrying one of these, in the hash
// (implicit flow: access_token, type=recovery) or the query (PKCE: code). A
// link Supabase refused arrives with error, error_code and error_description
// instead. supabase-js clears the URL only after it turned the link into a
// session, so a bad link keeps them.
const RESET_LINK_PARAMS = [
  "access_token",
  "refresh_token",
  "code",
  "token_hash",
  "error",
  "error_code",
  "error_description",
];

function carriesResetLink(params: URLSearchParams): boolean {
  return (
    params.get("type") === "recovery" ||
    RESET_LINK_PARAMS.some((name) => params.has(name))
  );
}

/**
 * "ready" when there is a session to set the new password with (a valid link,
 * or a reload after one), "expired" when the URL brought a link that produced
 * no session, "missing" when the page was opened without a link at all.
 */
export function resetLinkState(
  location: { search: string; hash: string },
  hasSession: boolean,
): ResetLinkState {
  if (hasSession) return "ready";
  const fromQuery = new URLSearchParams(location.search);
  const fromHash = new URLSearchParams(location.hash.replace(/^#/, ""));
  return carriesResetLink(fromQuery) || carriesResetLink(fromHash)
    ? "expired"
    : "missing";
}
