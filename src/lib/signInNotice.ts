// The notice above the sign-in form when a signed-out visitor was sent there
// from a page that needs an account. Pure, so tests/web can check every
// sentence. The old label table was always spliced after a fixed "access", so
// edit and create addresses read ungrammatically (issue #64).

export interface SignInNotice {
  // What signing in lets the visitor do: "access", "create", "edit".
  verb: string;
  // What they do it to, shown emphasised: "your dashboard", "this skill".
  object: string;
}

const EXACT: Record<string, SignInNotice> = {
  "/library": { verb: "access", object: "your library" },
  "/dashboard": { verb: "access", object: "your dashboard" },
  "/settings": { verb: "access", object: "your settings" },
  "/activity": { verb: "access", object: "your activity feed" },
  "/collections": { verb: "access", object: "your collections" },
  "/prompts/new": { verb: "create", object: "a new prompt" },
  "/skills/new": { verb: "create", object: "a new skill" },
  "/workflows/new": { verb: "create", object: "a new workflow" },
  "/prompt-kits/new": { verb: "create", object: "a new prompt kit" },
};

const EDIT: Array<[RegExp, string]> = [
  // A prompt's edit page answers at both /prompts/<slug>/edit and
  // /library/<slug>/edit.
  [/^\/(?:prompts|library)\/[^/]+\/edit\/?$/, "this prompt"],
  [/^\/skills\/[^/]+\/edit\/?$/, "this skill"],
  [/^\/workflows\/[^/]+\/edit\/?$/, "this workflow"],
  [/^\/prompt-kits\/[^/]+\/edit\/?$/, "this prompt kit"],
];

// The notice for a `redirect` target, or null when there is nothing to say.
export function signInNotice(
  redirect: string | null | undefined,
): SignInNotice | null {
  if (!redirect) return null;
  const path = redirect.split(/[?#]/)[0];
  if (!path || path === "/") return null;
  if (EXACT[path]) return EXACT[path];
  for (const [pattern, object] of EDIT) {
    if (pattern.test(path)) return { verb: "edit", object };
  }
  // The routes are /team/<id>/settings, /team/<id>/activity and /team/join.
  if (path.startsWith("/team/")) {
    return { verb: "access", object: "your team workspace" };
  }
  return { verb: "access", object: "this page" };
}

// The notice as one plain sentence: "Sign in to edit this skill."
export function signInNoticeSentence(
  redirect: string | null | undefined,
): string | null {
  const notice = signInNotice(redirect);
  return notice ? `Sign in to ${notice.verb} ${notice.object}.` : null;
}
