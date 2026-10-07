// The bookkeeping of the AI moderation queue worker (ai-moderate-content),
// kept apart from its I/O so it can be tested.
//
// WHY THE ATTEMPT IS COUNTED BEFORE THE CALL (30 September 2026)
//
// claim_moderation_review_queue hands a row out again once it has sat in
// 'processing' for ten minutes, and it does not count that. The worker only
// counted a failure in its own catch block, which a killed isolate never
// reaches. The platform kills a function at 150 s, and a batch of five rows
// whose provider calls take 40 s each is enough. Every re-claim then paid for
// another classification of the same rows with the same retry_count, for ever:
// the 2026-09-23 audit's "moderation re-claims are not counted".
//
// So the worker writes the attempt number onto the row before the paid call,
// and a row that has already used its attempts is closed without one. The
// menerio and GitHub queues count a stale claim in SQL; this one counts it in
// the worker, which needs no migration and holds whoever calls the claim.

export const MAX_MODERATION_ATTEMPTS = 3;

export type AttemptPlan = { giveUp: true } | { giveUp: false; attempt: number };

/**
 * What to do with a row the claim just handed out, from the retry_count it
 * came back with. Anything that is not a whole number of attempts already
 * made counts as none.
 */
export function planAttempt(
  retryCount: number | null | undefined,
  max: number = MAX_MODERATION_ATTEMPTS,
): AttemptPlan {
  const made =
    typeof retryCount === "number" && Number.isFinite(retryCount)
      ? Math.max(0, Math.floor(retryCount))
      : 0;
  if (made >= max) return { giveUp: true };
  return { giveUp: false, attempt: made + 1 };
}

/** The status a row gets when this attempt failed in the worker's hands. */
export function statusAfterFailure(
  attempt: number,
  max: number = MAX_MODERATION_ATTEMPTS,
): "pending" | "error" {
  return attempt >= max ? "error" : "pending";
}

// WHY THE WHOLE TEXT IS READ, IN SLICES (7 October 2026)
//
// The classifier used to see content.substring(0, 4000) of title, description
// and content joined. 27 of the 165 public artifacts were longer than that,
// so their tails had never been read, and anyone could publish 4,000
// harmless characters followed by anything at all. Each slice is one forced
// tool call of a few thousand tokens; slices overlap so a sentence cut at a
// boundary is read whole in one of them. Past the last slice the text is not
// read, and the row says so instead of claiming a full review.

export const CLASSIFY_WINDOW_CHARS = 12_000;
export const CLASSIFY_WINDOW_OVERLAP = 500;
export const MAX_CLASSIFY_WINDOWS = 8;

export interface ClassifyWindows {
  windows: string[];
  /** How many characters, from the start, the windows cover. */
  coveredChars: number;
  totalChars: number;
}

/** The slices of `text` the classifier reads, in order. Never empty. */
export function classificationWindows(
  text: string,
  size: number = CLASSIFY_WINDOW_CHARS,
  overlap: number = CLASSIFY_WINDOW_OVERLAP,
  max: number = MAX_CLASSIFY_WINDOWS,
): ClassifyWindows {
  const step = Math.max(1, size - overlap);
  const windows: string[] = [];
  let start = 0;
  do {
    windows.push(text.slice(start, start + size));
    start += step;
  } while (start + overlap < text.length && windows.length < max);
  const last = (windows.length - 1) * step;
  return {
    windows,
    coveredChars: Math.min(text.length, last + size),
    totalChars: text.length,
  };
}

export interface AIClassification {
  safe: boolean;
  category: string;
  confidence: number;
  reason: string;
}

/**
 * One verdict from the verdicts of every slice: the most confident violation
 * if any slice found one, else the first slice's (all safe, or unsure).
 */
export function combineClassifications(
  results: AIClassification[],
): AIClassification {
  const violations = results.filter((r) => !r.safe);
  if (violations.length === 0) return results[0];
  return violations.reduce((a, b) => (b.confidence > a.confidence ? b : a));
}

const CATEGORY_LABELS: Record<string, string> = {
  sexual: "Inappropriate content",
  hate: "Hateful or abusive content",
  malware: "Potentially malicious content",
  pii: "Personal information detected",
  injection: "Prompt injection attempt",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * The mail an author gets when the AI review unpublished their artifact.
 *
 * The title is whatever the author typed, and until 2026-09-30 it went into
 * the HTML unescaped, so a title could put its own links and markup into a
 * mail sent from support@querino.ai. The subject is plain text on one line.
 */
export function violationEmail(input: {
  itemType: string;
  title: string | null;
  category: string;
}): { subject: string; html: string } {
  const title = (input.title || "Untitled").replace(/[\r\n]+/g, " ");
  const itemType = input.itemType.replace(/[\r\n]+/g, " ");
  const categoryLabel =
    CATEGORY_LABELS[input.category] || "Content policy violation";
  const t = escapeHtml(title);
  const type = escapeHtml(itemType);

  // A comment is not unpublished but replaced with a notice (it has replies
  // that would go with it), and it has no title of its own.
  if (itemType === "comment") {
    return {
      subject: "Your comment on Querino has been removed",
      html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Your comment has been removed</h2>
      <p>Hi,</p>
      <p>Our automated content review found that one of your comments may violate our <a href="https://querino.ai/community-guidelines">Community Guidelines</a>.</p>
      <p><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
      <p>Its text has been replaced with a note that it was removed. Replies to it are unchanged.</p>
      <p>If you believe this is a mistake, please contact us at <a href="mailto:support@querino.ai">support@querino.ai</a> and we'll review it manually.</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">The Querino Team</p>
    </div>
  `,
    };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Your ${type} has been unpublished</h2>
      <p>Hi,</p>
      <p>Our automated content review found that your ${type} <strong>"${t}"</strong> may violate our <a href="https://querino.ai/community-guidelines">Community Guidelines</a>.</p>
      <p><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
      <p>Your artifact has been set to private. You can still access and edit it in your library.</p>
      <p>If you believe this is a mistake, please contact us at <a href="mailto:support@querino.ai">support@querino.ai</a> and we'll review it manually.</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">The Querino Team</p>
    </div>
  `;

  return {
    subject: `Your ${itemType} "${title}" has been unpublished`,
    html,
  };
}
