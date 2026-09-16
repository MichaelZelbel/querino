// Everything a user owns, deleted row by row, in an order the foreign keys
// accept.
//
// Two functions remove an account: delete-my-account (the user, from the
// settings page) and delete-user (an admin, from the admin panel). Until
// 2026-09-16 only the first one did this work; the admin path called
// auth.admin.deleteUser alone and trusted the cascades. But prompts.author_id,
// prompt_kits.author_id and blog_posts.author_id are ON DELETE SET NULL, and
// github_sync_queue and github_sync_state have no foreign key at all, so an
// admin-deleted user's public prompts and kits stayed on the site with no
// author, and their sync rows lingered forever. Both functions now run this
// one sequence before touching auth.users.
//
// Every delete is checked and the first failure throws. A failing delete
// that was skipped in silence left an account gutted but still able to log
// in, and every retry did the same thing again; stopping at the first
// failure is what keeps the rest of the rows.

// The two callers create their clients from different pinned versions of
// supabase-js, which TypeScript treats as unrelated types. All this module
// needs is `.from()`, so that is all it asks for.
export interface ServiceClient {
  // deno-lint-ignore no-explicit-any
  from(table: string): any;
}

/** Rows removed (or, for the one unlink, updated) per table, in run order. */
export type DeleteUserSummary = Record<string, number | null>;

interface CountedResult {
  error: { message: string } | null;
  count: number | null;
}

export async function deleteUserRows(
  serviceClient: ServiceClient,
  userId: string,
): Promise<DeleteUserSummary> {
  const summary: DeleteUserSummary = {};

  const mustSucceed = async (
    label: string,
    op: PromiseLike<CountedResult>,
  ): Promise<void> => {
    const { error, count } = await op;
    if (error) throw new Error(`${label}: ${error.message}`);
    summary[label] = (summary[label] ?? 0) + (count ?? 0);
  };

  const del = (table: string) =>
    serviceClient.from(table).delete({ count: "exact" });

  const idsOf = async (
    table: string,
    column: string,
    value: string,
  ): Promise<string[]> => {
    const { data, error } = await serviceClient
      .from(table)
      .select("id")
      .eq(column, value);
    if (error) throw new Error(`select ${table}: ${error.message}`);
    return ((data ?? []) as { id: string }[]).map((row) => row.id);
  };

  // Suggestions this user reviewed on other people's artifacts are not the
  // user's own data. They lose the reviewer reference and stay.
  await mustSucceed(
    "suggestions (reviewer unlinked)",
    serviceClient
      .from("suggestions")
      .update({ reviewer_id: null }, { count: "exact" })
      .eq("reviewer_id", userId),
  );

  await mustSucceed(
    "user_credentials",
    del("user_credentials").eq("user_id", userId),
  );
  await mustSucceed(
    "user_saved_prompts",
    del("user_saved_prompts").eq("user_id", userId),
  );
  await mustSucceed("prompt_pins", del("prompt_pins").eq("user_id", userId));
  await mustSucceed(
    "prompt_reviews",
    del("prompt_reviews").eq("user_id", userId),
  );
  await mustSucceed(
    "skill_reviews",
    del("skill_reviews").eq("user_id", userId),
  );
  await mustSucceed(
    "workflow_reviews",
    del("workflow_reviews").eq("user_id", userId),
  );
  await mustSucceed("comments", del("comments").eq("user_id", userId));
  await mustSucceed("suggestions", del("suggestions").eq("author_id", userId));
  await mustSucceed(
    "activity_events",
    del("activity_events").eq("actor_id", userId),
  );
  await mustSucceed(
    "ai_allowance_periods",
    del("ai_allowance_periods").eq("user_id", userId),
  );
  await mustSucceed(
    "llm_usage_events",
    del("llm_usage_events").eq("user_id", userId),
  );

  // Collection items for the user's collections first, then the collections.
  const collectionIds = await idsOf("collections", "owner_id", userId);
  if (collectionIds.length > 0) {
    await mustSucceed(
      "collection_items",
      del("collection_items").in("collection_id", collectionIds),
    );
  }
  await mustSucceed("collections", del("collections").eq("owner_id", userId));

  // Prompts: versions, reviews by others and AI insights first.
  const promptIds = await idsOf("prompts", "author_id", userId);
  if (promptIds.length > 0) {
    await mustSucceed(
      "prompt_versions",
      del("prompt_versions").in("prompt_id", promptIds),
    );
    await mustSucceed(
      "prompt_reviews (on own prompts)",
      del("prompt_reviews").in("prompt_id", promptIds),
    );
    await mustSucceed(
      "ai_insights (prompts)",
      del("ai_insights").eq("item_type", "prompt").in("item_id", promptIds),
    );
  }
  await mustSucceed("prompts", del("prompts").eq("author_id", userId));

  // Skills.
  const skillIds = await idsOf("skills", "author_id", userId);
  if (skillIds.length > 0) {
    await mustSucceed(
      "skill_reviews (on own skills)",
      del("skill_reviews").in("skill_id", skillIds),
    );
    await mustSucceed(
      "ai_insights (skills)",
      del("ai_insights").eq("item_type", "skill").in("item_id", skillIds),
    );
  }
  await mustSucceed("skills", del("skills").eq("author_id", userId));

  // Workflows.
  const workflowIds = await idsOf("workflows", "author_id", userId);
  if (workflowIds.length > 0) {
    await mustSucceed(
      "workflow_reviews (on own workflows)",
      del("workflow_reviews").in("workflow_id", workflowIds),
    );
    await mustSucceed(
      "ai_insights (workflows)",
      del("ai_insights").eq("item_type", "workflow").in("item_id", workflowIds),
    );
  }
  await mustSucceed("workflows", del("workflows").eq("author_id", userId));

  // Prompt kits. Until 2026-09-08 they were skipped entirely: their author
  // foreign key is ON DELETE SET NULL, so a deleted account's public kits
  // stayed on the site, readable, with no author at all.
  const kitIds = await idsOf("prompt_kits", "author_id", userId);
  if (kitIds.length > 0) {
    await mustSucceed(
      "prompt_kit_reviews (on own kits)",
      del("prompt_kit_reviews").in("prompt_kit_id", kitIds),
    );
    await mustSucceed(
      "prompt_kit_pins (on own kits)",
      del("prompt_kit_pins").in("prompt_kit_id", kitIds),
    );
    await mustSucceed(
      "ai_insights (prompt kits)",
      del("ai_insights").eq("item_type", "prompt_kit").in("item_id", kitIds),
    );
  }
  // The user's own reviews and pins on other people's kits go too.
  await mustSucceed(
    "prompt_kit_reviews",
    del("prompt_kit_reviews").eq("user_id", userId),
  );
  await mustSucceed(
    "prompt_kit_pins",
    del("prompt_kit_pins").eq("user_id", userId),
  );
  await mustSucceed("prompt_kits", del("prompt_kits").eq("author_id", userId));

  // Teams: memberships, then the teams this user owned. The owned team ids
  // are read first because their GitHub sync rows are keyed by team id and
  // have no foreign key to clean them up.
  const ownedTeamIds = await idsOf("teams", "owner_id", userId);
  await mustSucceed("team_members", del("team_members").eq("user_id", userId));
  await mustSucceed("teams", del("teams").eq("owner_id", userId));

  // GitHub sync rows last, after the artifacts: deleting an artifact fires a
  // trigger that enqueues a 'delete' job for it, and with the profile and
  // token gone the worker could only ever mark those jobs skipped. Neither
  // table has a foreign key, so nothing else would ever remove them.
  // github_sync_queue keys the owner as owner_user_id; github_sync_state as
  // target_scope 'user' plus target_id (migration 20260501194122).
  await mustSucceed(
    "github_sync_queue",
    del("github_sync_queue").eq("owner_user_id", userId),
  );
  await mustSucceed(
    "github_sync_state",
    del("github_sync_state").eq("target_scope", "user").eq("target_id", userId),
  );
  if (ownedTeamIds.length > 0) {
    await mustSucceed(
      "github_sync_queue (owned teams)",
      del("github_sync_queue").in("team_id", ownedTeamIds),
    );
    await mustSucceed(
      "github_sync_state (owned teams)",
      del("github_sync_state")
        .eq("target_scope", "team")
        .in("target_id", ownedTeamIds),
    );
  }

  await mustSucceed("profiles", del("profiles").eq("id", userId));

  return summary;
}
