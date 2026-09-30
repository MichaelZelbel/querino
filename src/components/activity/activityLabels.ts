// The words an activity row is written in. Kept apart from the icons so it can
// be tested without React.

const ITEM_TYPE_LABELS: Record<string, string> = {
  prompt: "prompt",
  skill: "skill",
  workflow: "workflow",
  prompt_kit: "prompt kit",
  collection: "collection",
  profile: "profile",
  team: "team",
  comment: "comment",
};

/** "prompt kit", never the column value "prompt_kit". */
export function itemTypeLabel(itemType?: string | null): string {
  if (!itemType) return "item";
  return ITEM_TYPE_LABELS[itemType] ?? itemType.replace(/_/g, " ");
}

function withArticle(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}

/**
 * "generated AI insights for a prompt". Every action the app records has its
 * own sentence. The feed used to fall back to "performed ai_insights_generated
 * on a prompt", which was every row in production on 2026-09-30.
 */
export function getActionLabel(
  action: string,
  itemType?: string | null,
): string {
  const item = withArticle(itemTypeLabel(itemType));

  const labels: Record<string, string> = {
    create: `created ${item}`,
    update: `updated ${item}`,
    autosave: `autosaved ${item}`,
    publish: `published ${item}`,
    unpublish: `unpublished ${item}`,
    clone: `cloned ${item}`,
    delete: `deleted ${item}`,
    restore: `restored ${item}`,
    review: `reviewed ${item}`,
    version: `created a new version of ${item}`,
    comment: `commented on ${item}`,
    comment_edit: `edited a comment on ${item}`,
    comment_delete: `deleted a comment on ${item}`,
    ai_insights_generated: `generated AI insights for ${item}`,
    ai_insights_refreshed: `refreshed the AI insights of ${item}`,
    ai_review: `had ${item} reviewed by moderation`,
    team_create: "created a team",
    team_add_member: "added a team member",
    team_remove_member: "removed a team member",
    team_promote_member: "promoted a team member",
    github_sync_triggered: "triggered GitHub sync",
  };

  return labels[action] ?? `changed ${item}`;
}

/**
 * The name shown for the item. None of the events recorded so far stores a
 * title, so "Untitled" was the whole feed; the kind of item says more.
 */
export function itemDisplayTitle(
  metadata: Record<string, unknown> | null | undefined,
  itemType?: string | null,
): string {
  const title = metadata?.title ?? metadata?.name;
  if (typeof title === "string" && title.trim()) return title;
  const label = itemTypeLabel(itemType);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
