import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { ItemUseChannel, UsageItemType } from "@/lib/itemStats";

// record_item_use and record_item_view are not in the generated types until
// the migration is live and the types are regenerated.
const untyped = supabase as unknown as SupabaseClient;

function fireAndForget(fn: string, args: Record<string, string>): void {
  void untyped.rpc(fn, args).then(({ error }) => {
    if (error) console.warn(`[stats] ${fn} not counted:`, error.message);
  });
}

/**
 * Tell the database an item was copied, downloaded or sent to an assistant.
 * The database decides what counts (public items, once per visitor, item,
 * channel and day, never the author's own; migration 20261119150000). Like
 * recordPromptCopy, this never waits and never fails the action.
 */
export function recordItemUse(
  itemType: UsageItemType,
  itemId: string | null | undefined,
  channel: ItemUseChannel,
): void {
  if (!itemId) return;
  fireAndForget("record_item_use", {
    p_item_type: itemType,
    p_item_id: itemId,
    p_channel: channel,
  });
}

/** Tell the database an item's page was opened. Nothing about the visitor is stored. */
export function recordItemView(itemType: UsageItemType, itemId: string): void {
  fireAndForget("record_item_view", {
    p_item_type: itemType,
    p_item_id: itemId,
  });
}
