import { supabase } from "@/integrations/supabase/client";

/**
 * Tell the database a prompt was copied, so its copy count (shown on cards and
 * the first key of Discover's Trending order) means something. Until
 * 2026-09-30 nothing ever counted and every prompt said "0 copies".
 *
 * The database decides what counts: public prompts only, once per visitor, per
 * prompt, per day, never the author's own (record_prompt_copy, migration
 * 20260930130300). This never waits and never fails the copy: a lost count is
 * better than a Copy button that stalls or shows an error.
 */
export function recordPromptCopy(promptId: string | null | undefined): void {
  if (!promptId) return;
  void supabase
    .rpc("record_prompt_copy", { p_prompt_id: promptId })
    .then(({ error }) => {
      if (error) console.warn("[copies] not counted:", error.message);
    });
}
