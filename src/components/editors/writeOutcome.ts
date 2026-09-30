// What an update or delete through PostgREST really did.
//
// Row-level security does not reject a write to a row the caller may not
// touch: it matches no row and reports success. The skill, workflow and kit
// editors checked only `error`, so a premium team editor removed from the team
// (or a row deleted in another tab) saw "Changes saved!" or "Skill deleted"
// while nothing was written, and the leave-page warning was switched off with
// the edits unsaved. The writes now ask for the affected ids (.select("id"))
// and this says what happened.

export type WriteOutcome = "written" | "failed" | "nothing";

export function writeOutcome(result: {
  error?: unknown;
  data?: unknown[] | null;
}): WriteOutcome {
  if (result.error) return "failed";
  if (!result.data || result.data.length === 0) return "nothing";
  return "written";
}
