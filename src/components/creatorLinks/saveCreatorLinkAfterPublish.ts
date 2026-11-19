import type { QueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { creatorLinkQueryKey, writeCreatorLink } from "@/hooks/useCreatorLink";
import type { CreatorLinkForm, CreatorLinkItemType } from "@/lib/creatorLink";

/**
 * Saves the link given while publishing or creating an item, after the item
 * itself was written. A failure here never undoes the publish: the item stays
 * public and the author is told where to add the link.
 */
export async function saveCreatorLinkAfterPublish(
  queryClient: QueryClient,
  itemType: CreatorLinkItemType,
  itemId: string,
  link: CreatorLinkForm | null,
): Promise<void> {
  try {
    await writeCreatorLink(itemType, itemId, link);
    void queryClient.invalidateQueries({
      queryKey: creatorLinkQueryKey(itemType, itemId),
    });
  } catch (error) {
    console.error("Error saving creator link:", error);
    toast.warning(
      "Published, but your link could not be saved. Add it on the Edit page.",
    );
  }
}
