/**
 * The one link a creator may put under each published item (#46).
 *
 * Kept free of React and the Supabase client so tests/web can reach it. The
 * database (migration 20261119120000) holds the same limits and is the one that
 * decides; these checks only give the form its error messages.
 */
import type { ArtifactListTable } from "@/lib/artifactListColumns.ts";

export type CreatorLinkItemType =
  "prompt" | "skill" | "workflow" | "prompt_kit";

export const ITEM_TYPE_OF_TABLE = {
  prompts: "prompt",
  skills: "skill",
  workflows: "workflow",
  prompt_kits: "prompt_kit",
} as const satisfies Record<ArtifactListTable, CreatorLinkItemType>;

export const CREATOR_LINK_LABEL_MAX = 40;
export const CREATOR_LINK_URL_MAX = 2048;

/**
 * Every link a user wrote carries this: `ugc nofollow` so it passes no search
 * ranking, `noopener noreferrer` so the target gets neither the opener nor the
 * page it came from.
 */
export const USER_LINK_REL = "ugc nofollow noopener noreferrer";

export interface CreatorLinkForm {
  url: string;
  label: string;
}

/** What a visitor may see: only ever an approved link on a public item. */
export interface PublicCreatorLink {
  label: string;
  url: string;
}

export const CREATOR_LINK_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "unreachable",
] as const;

export type CreatorLinkStatus = (typeof CREATOR_LINK_STATUSES)[number];

/** What the author sees of their own link. */
export interface OwnCreatorLink extends PublicCreatorLink {
  status: CreatorLinkStatus;
  click_count: number;
  reason: string | null;
}

export const CREATOR_LINK_URL_ERROR =
  "Enter a web address starting with http:// or https://";
export const CREATOR_LINK_LABEL_ERROR = `At most ${CREATOR_LINK_LABEL_MAX} characters`;

/**
 * The address as it is stored, or null when it is not a public web address.
 * A bare `example.com/x` gets `https://`.
 */
export function normalizeCreatorLinkUrl(
  input: string | null | undefined,
): string | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;
  if (!parsed.hostname.includes(".")) return null;
  if (parsed.href.length > CREATOR_LINK_URL_MAX) return null;
  return parsed.href;
}

export type CreatorLinkValidation =
  | { ok: true; value: CreatorLinkForm | null }
  | { ok: false; errors: { url?: string; label?: string } };

/**
 * The name's length as the database's char_length counts it: in code points,
 * so an emoji is one character, not the two UTF-16 units of `.length`.
 */
export function creatorLinkLabelLength(label: string): number {
  return [...label.trim()].length;
}

/** An empty address means "no link", whatever the name says. */
export function validateCreatorLink(
  form: CreatorLinkForm,
): CreatorLinkValidation {
  if (!form.url.trim()) return { ok: true, value: null };
  const errors: { url?: string; label?: string } = {};
  const url = normalizeCreatorLinkUrl(form.url);
  if (!url) errors.url = CREATOR_LINK_URL_ERROR;
  const label = form.label.trim();
  if (creatorLinkLabelLength(label) > CREATOR_LINK_LABEL_MAX)
    errors.label = CREATOR_LINK_LABEL_ERROR;
  if (!url || errors.label) return { ok: false, errors };
  return { ok: true, value: { url, label } };
}

/**
 * The domain the box shows, taken from the stored address and never from the
 * name, so a link named "google.com" still says where it goes. An
 * internationalised domain stays in its xn-- form, which a look-alike cannot
 * imitate.
 */
export function creatorLinkDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** A new link starts from the profile's website, when it has a usable one. */
export function creatorLinkPrefill(
  website: string | null | undefined,
): CreatorLinkForm {
  return { url: normalizeCreatorLinkUrl(website) ?? "", label: "" };
}

/** What the author is told about their link's review. */
export function creatorLinkStatusText(
  link: Pick<OwnCreatorLink, "status" | "reason">,
): string {
  switch (link.status) {
    case "approved":
      return "Shown under your item";
    case "rejected":
      return `Not shown: ${link.reason || "it did not pass the review"}`;
    case "unreachable":
      return "Not shown: the page could not be reached";
    default:
      return "Waiting for review, not shown yet";
  }
}

/**
 * An account younger than a week may have links on at most three items (#47).
 * The database refuses the fourth insert with this exact message and hint
 * (migration 20261119140000); the browser shows the message as it is.
 */
export const CREATOR_LINK_NEW_ACCOUNT_LIMIT = 3;
export const CREATOR_LINK_NEW_ACCOUNT_DAYS = 7;
export const CREATOR_LINK_LIMIT_HINT = "creator_link_new_account_limit";
export const CREATOR_LINK_LIMIT_ERROR =
  "New accounts can add a link to at most three items in their first seven days. You can add more once your account is a week old.";

/** The plain message for a refused link write, or null when it has none. */
export function creatorLinkErrorText(error: unknown): string | null {
  const hint =
    error && typeof error === "object" && "hint" in error
      ? (error as { hint?: unknown }).hint
      : undefined;
  return hint === CREATOR_LINK_LIMIT_HINT ? CREATOR_LINK_LIMIT_ERROR : null;
}
