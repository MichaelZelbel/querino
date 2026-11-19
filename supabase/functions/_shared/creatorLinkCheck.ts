// What a creator link's check decides (#47), kept apart from the worker's I/O
// so every state change can be tested with a stubbed classifier.
//
// An AI provider failure never reaches decideLinkOutcome: the worker throws
// before it, the queue row takes the usual retry path, and the link keeps the
// status it had (a new link stays 'pending', so it is neither shown nor a
// strike).

import type { LinkPage } from "./linkFetch.ts";
import {
  moderationCategoryLabel,
  type AIClassification,
} from "./moderationQueue.ts";

const LINK_REASON_CHARS = 300;

export type LinkCheckResult =
  | { reachable: false; reason: string }
  | { reachable: true; classification: AIClassification };

export interface LinkOutcome {
  kind: "approved" | "rejected" | "unreachable";
  /** The patch for the creator_links row. */
  link: {
    status: "approved" | "rejected" | "unreachable";
    reason: string | null;
    checked_at: string;
    check_failures: number;
  };
  /** The patch for the moderation_review_queue row. */
  queue: {
    status: "reviewed" | "violation";
    ai_category: string;
    ai_confidence: number | null;
    ai_reason: string;
  };
  /** A rejection is a violation like any other: a strike and the email. */
  enforce: boolean;
}

/**
 * The outcome of one check. An unreachable page is not a violation; it only
 * adds to check_failures, which decides whether the retry sweep
 * (enqueue_due_creator_link_checks) tries it again. An unsafe verdict hides the link
 * only at `threshold` confidence or above, as text moderation does.
 */
export function decideLinkOutcome(
  result: LinkCheckResult,
  previousFailures: number,
  threshold: number,
  now: Date,
): LinkOutcome {
  const checked_at = now.toISOString();

  if (!result.reachable) {
    return {
      kind: "unreachable",
      link: {
        status: "unreachable",
        reason: result.reason,
        checked_at,
        check_failures: Math.max(0, previousFailures) + 1,
      },
      queue: {
        status: "reviewed",
        ai_category: "unreachable",
        ai_confidence: null,
        ai_reason: `Not classified: ${result.reason}`,
      },
      enforce: false,
    };
  }

  const c = result.classification;
  if (!c.safe && c.confidence >= threshold) {
    return {
      kind: "rejected",
      link: {
        status: "rejected",
        reason: `${moderationCategoryLabel(c.category)}: ${c.reason}`.slice(
          0,
          LINK_REASON_CHARS,
        ),
        checked_at,
        check_failures: 0,
      },
      queue: {
        status: "violation",
        ai_category: c.category,
        ai_confidence: c.confidence,
        ai_reason: c.reason,
      },
      enforce: true,
    };
  }

  return {
    kind: "approved",
    link: { status: "approved", reason: null, checked_at, check_failures: 0 },
    queue: {
      status: "reviewed",
      ai_category: c.category || "none",
      ai_confidence: c.confidence,
      ai_reason: c.reason,
    },
    enforce: false,
  };
}

/**
 * What the classifier reads for one link: its name, judged with the text
 * categories, and the page, judged as a destination. The page text is the
 * third party's, so it is fenced off as data.
 */
export function linkClassifierInput(
  label: string,
  page: Extract<LinkPage, { ok: true }>,
): string {
  return [
    `Link name: ${label || "(none)"}`,
    `Final domain: ${page.finalDomain}`,
    `Content type: ${page.contentType || "(unknown)"}`,
    `Page title: ${page.title || "(none)"}`,
    `Meta description: ${page.description || "(none)"}`,
    "<<<PAGE TEXT",
    page.excerpt || "(no visible text)",
    "PAGE TEXT>>>",
  ].join("\n");
}
