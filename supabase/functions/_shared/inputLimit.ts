// Long input is refused, not cut.
//
// An AI feature that rewrites a user's text caps how much of it one call may
// read, to bound the cost of that call. Until the 2026-09-30 audit those caps
// were silent cuts, and a rewrite of the first 16,000 characters came back
// looking like the whole text. translate-artifact (2026-09-30) and
// refine-prompt (2026-10-07, where the Refine dialog saved the rewrite of the
// start over the entire prompt) now refuse longer input before anything is
// charged, and both say so in the same words, built here.

/** What the message names: "This <what> is ..., and <task> handles up to ... Nothing was <done>". */
export interface InputLimit {
  max: number;
  what: string;
  task: string;
  done: string;
}

/**
 * Null when `content` fits, otherwise the message to show the user. Anything
 * that is not a string counts as empty: the caller's own "is required" check
 * deals with that.
 */
export function refuseTooLong(
  content: unknown,
  limit: InputLimit,
): string | null {
  if (typeof content !== "string" || content.length <= limit.max) return null;
  return (
    `This ${limit.what} is ${content.length.toLocaleString("en-US")} characters long, ` +
    `and ${limit.task} handles up to ${limit.max.toLocaleString("en-US")}. ` +
    `Nothing was ${limit.done} and no credits were used.`
  );
}

// The same size the coach canvas reads (coach.ts, CANVAS_TRUNCATE).
export const MAX_REFINE_CHARS = 16_000;

/** Null when the prompt can be refined whole, otherwise the message to show. */
export function tooLongToRefine(
  prompt: unknown,
  max: number = MAX_REFINE_CHARS,
): string | null {
  return refuseTooLong(prompt, {
    max,
    what: "prompt",
    task: "refining",
    done: "refined",
  });
}
