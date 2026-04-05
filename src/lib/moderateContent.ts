import { supabase } from "@/integrations/supabase/client";

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  category?: string;
  support_hint?: string;
}

/**
 * Calls the moderate-content edge function to check if content violates community guidelines.
 * Only call this when content is going public (publish, edit public, comment).
 */
export async function moderateContent(
  contentFields: Record<string, string | null | undefined>,
  action: "publish" | "edit_public" | "comment",
  itemType: "prompt" | "skill" | "claw" | "workflow" | "comment",
  itemId?: string
): Promise<ModerationResult> {
  try {
    // Filter out null/undefined values
    const cleanFields: Record<string, string> = {};
    for (const [key, val] of Object.entries(contentFields)) {
      if (val) cleanFields[key] = val;
    }

    const { data, error } = await supabase.functions.invoke("moderate-content", {
      body: {
        content_fields: cleanFields,
        action,
        item_type: itemType,
        item_id: itemId,
      },
    });

    if (error) {
      console.warn("[Moderation] Edge function error — failing open:", error);
      return { approved: true };
    }

    if (!data || typeof data.approved === "undefined") {
      console.warn("[Moderation] Unexpected response shape — failing open:", data);
      return { approved: true };
    }

    return data as ModerationResult;
  } catch (err) {
    console.warn("[Moderation] Network/parse error — failing open:", err);
    return { approved: true };
  }
}
