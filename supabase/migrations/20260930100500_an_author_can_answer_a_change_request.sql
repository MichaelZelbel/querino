-- The author of a suggestion can answer "changes requested" (2026-09-30 audit).
--
-- What was wrong. When an artifact's owner asks for changes, the suggestion's
-- status becomes 'changes_requested' and its author gets an edit form
-- (updateSuggestionAfterChanges in src/hooks/useSuggestions.ts), which sends
-- the new text with status 'open' and the review fields cleared. The only
-- policy that lets an author update their suggestion is "Authors can update
-- their own open suggestions", USING (status = 'open'). A 'changes_requested'
-- row is not 'open', so the UPDATE matched nothing; PostgREST reports zero
-- rows as success, the hook logged "suggestion_updated_after_changes_requested"
-- and the suggestion stayed exactly as it was. Every resubmission since the
-- feature shipped was lost without a word.
--
-- How it was measured. Rehearsed on production: a 'changes_requested'
-- suggestion, updated by its author with the hook's exact payload, changed 0
-- rows. suggestions holds 0 rows today, so nobody's text needs restoring.
--
-- What it changes. The author policy reaches 'open' and 'changes_requested'
-- rows and may only leave them 'open' with no reviewer and no review comment:
-- an author can edit or resubmit, never accept, reject or review their own
-- suggestion. A decided suggestion (accepted or rejected) stays out of reach,
-- as before. The owner's review policy is unchanged.

DROP POLICY IF EXISTS "Authors can update their own open suggestions" ON public.suggestions;
CREATE POLICY "Authors can update their own open suggestions"
  ON public.suggestions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    AND status IN ('open', 'changes_requested')
  )
  WITH CHECK (
    auth.uid() = author_id
    AND status = 'open'
    AND reviewer_id IS NULL
    AND review_comment IS NULL
  );
