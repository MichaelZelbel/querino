import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  planCreatorLinkWrite,
  type CreatorLinkForm,
  type CreatorLinkItemType,
  type OwnCreatorLink,
  type PublicCreatorLink,
} from "@/lib/creatorLink";

// creator_links and its two functions are not in the generated types until the
// migration is live and the types are regenerated, so they are reached through
// an untyped view of the same client. Keep every such call in this file.
const untyped = supabase as unknown as SupabaseClient;

export const creatorLinkQueryKey = (
  itemType: CreatorLinkItemType,
  itemId: string | undefined,
) => ["creator-link", itemType, itemId] as const;

/**
 * The link a visitor sees under the item: approved and on a public item, or
 * null. A failed read is logged and shown as no box, never as a broken page.
 */
export async function fetchPublicCreatorLink(
  itemType: CreatorLinkItemType,
  itemId: string,
): Promise<PublicCreatorLink | null> {
  const { data, error } = await untyped.rpc("public_creator_link", {
    p_item_type: itemType,
    p_item_id: itemId,
  });
  if (error) {
    console.error(
      "[route-loaders] creator link could not be read:",
      error.message,
    );
    return null;
  }
  const row = (data as PublicCreatorLink[] | null)?.[0];
  return row ? { label: row.label, url: row.url } : null;
}

/** /go/<item-id>: counts the click and answers the stored address, or null. */
export function followCreatorLinkRpc(itemId: string) {
  return untyped.rpc("follow_creator_link", {
    p_item_id: itemId,
  }) as PromiseLike<{
    data: string | null;
    error: { message: string } | null;
  }>;
}

async function readOwnCreatorLink(
  itemType: CreatorLinkItemType,
  itemId: string,
): Promise<OwnCreatorLink | null> {
  const { data, error } = await untyped
    .from("creator_links")
    .select("url, label, status, click_count, reason")
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();
  if (error) throw error;
  return (data as OwnCreatorLink | null) ?? null;
}

/** The author's own link with its status and click count. Row-level security shows it to the author only. */
export function useOwnCreatorLink(
  itemType: CreatorLinkItemType,
  itemId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: creatorLinkQueryKey(itemType, itemId),
    queryFn: () => readOwnCreatorLink(itemType, itemId as string),
    enabled: enabled && !!itemId,
  });
}

/**
 * Makes the stored link match `next` (null removes it). Only the address and
 * the name are ever written; the database sets the status.
 */
export async function writeCreatorLink(
  itemType: CreatorLinkItemType,
  itemId: string,
  next: CreatorLinkForm | null,
): Promise<void> {
  const stored = await readOwnCreatorLink(itemType, itemId);
  const plan = planCreatorLinkWrite(stored, next);
  if (plan === "none") return;

  const table = untyped.from("creator_links");
  const { error } = !next
    ? await table.delete().eq("item_type", itemType).eq("item_id", itemId)
    : plan === "update"
      ? await table
          .update({ url: next.url, label: next.label })
          .eq("item_type", itemType)
          .eq("item_id", itemId)
      : await table.insert({
          item_type: itemType,
          item_id: itemId,
          url: next.url,
          label: next.label,
        });
  if (error) throw error;
}
