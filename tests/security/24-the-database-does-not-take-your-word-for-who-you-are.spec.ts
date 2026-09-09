// Four holes found on 2026-09-08, all the same shape: a database object that
// believed whatever the caller said about itself.
//
//   enqueue_github_sync is SECURITY DEFINER and was never revoked, so the
//   default grant to PUBLIC stood and PostgREST served it to the anon key. Its
//   arguments are an artifact id and the owner whose stored GitHub token the
//   worker should push with, so a stranger could have someone's private prompt
//   committed into their own repository, or a file deleted from someone else's
//   repository using that person's token.
//
//   The five "Premium team members can create team ..." policies said
//   WITH CHECK (team_id IS NULL OR <member of that team>). Permissive policies
//   are OR'd, so a row with a null team_id passed on that clause alone,
//   whatever author_id said. Anyone signed in could publish under another
//   person's name, and the GitHub and Menerio triggers then pushed it into
//   that person's repository and notes.
//
//   update_prompt_slug and update_prompt_kit_slug authorised against a
//   p_user_id parameter the browser filled in. Author ids are public and the
//   admin's id is in this repository.
//
//   menerio_sync_queue accepted any artifact id as long as user_id was the
//   caller's own, and the worker then posted that artifact's full content to
//   the Menerio host the caller had registered.
//
// The audit that found them said in as many words why they had gone unnoticed:
// nothing in this suite covered function grants or INSERT policies. That is
// what this file is.

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  restAsAnon,
  restAsService,
  restAsUser,
  signInTestUser,
} from "./helpers/api";

// A uuid that belongs to nobody. Used as the forged author and the forged
// identity, so a test can never accidentally act as a real second person.
const NOBODY = "00000000-0000-0000-0000-0000000000ff";

// Anything these tests manage to create against expectation, so a failure
// leaves no rubbish behind in the live project.
const createdPromptIds: string[] = [];

test.afterAll(async () => {
  for (const id of createdPromptIds) {
    await restAsService(`prompts?id=eq.${id}`, { method: "DELETE" });
  }
});

test.describe("the GitHub sync queue is not open to the public", () => {
  test("a logged-out caller cannot reach enqueue_github_sync", async () => {
    const res = await restAsAnon("rpc/enqueue_github_sync", {
      method: "POST",
      body: {
        p_artifact_type: "prompt",
        p_artifact_id: randomUUID(),
        p_operation: "upsert",
        p_owner_user_id: NOBODY,
        p_team_id: null,
      },
    });

    expect(
      res.ok,
      "the anon key reached enqueue_github_sync, which pushes artifacts with " +
        "their owner's stored GitHub token",
    ).toBe(false);
  });

  test("a signed-in user cannot reach it either", async () => {
    const res = await restAsUser("rpc/enqueue_github_sync", {
      method: "POST",
      body: {
        p_artifact_type: "prompt",
        p_artifact_id: randomUUID(),
        p_operation: "upsert",
        p_owner_user_id: NOBODY,
        p_team_id: null,
      },
    });

    expect(
      res.ok,
      "a signed-in user reached enqueue_github_sync; only the triggers and " +
        "the service role should",
    ).toBe(false);
  });
});

test.describe("an artifact is created by its own author, or not at all", () => {
  test("a user cannot insert a prompt under someone else's name", async () => {
    const res = await restAsUser<Array<{ id: string }>>("prompts", {
      method: "POST",
      body: {
        author_id: NOBODY,
        title: `Audit probe ${randomUUID().slice(0, 8)}`,
        description: "Security suite probe. Safe to delete.",
        content: "Probe body.",
        category: "writing",
        is_public: false,
      },
      headers: { Prefer: "return=representation" },
    });

    if (res.ok && res.data?.[0]) createdPromptIds.push(res.data[0].id);

    expect(
      res.ok,
      "a prompt was created under another account's author_id",
    ).toBe(false);
    expect(res.error?.code, JSON.stringify(res.error)).toBe("42501");
  });

  test("the same user can still create their own prompt", async () => {
    const { userId } = await signInTestUser();
    const res = await restAsUser<Array<{ id: string }>>("prompts", {
      method: "POST",
      body: {
        author_id: userId,
        title: `Audit probe ${randomUUID().slice(0, 8)}`,
        description: "Security suite probe. Safe to delete.",
        content: "Probe body.",
        category: "writing",
        is_public: false,
      },
      headers: { Prefer: "return=representation" },
    });

    if (res.data?.[0]) createdPromptIds.push(res.data[0].id);

    // The guard that blocks too much is the likelier regression, so this half
    // matters as much as the half above.
    expect(
      res.ok,
      `creating an ordinary personal prompt broke: ${JSON.stringify(res.error)}`,
    ).toBe(true);
  });
});

test.describe("renaming a slug uses the session, not a parameter", () => {
  test("a forged p_user_id is refused rather than believed", async () => {
    const res = await restAsUser<{ error?: string; slug?: string }>(
      "rpc/update_prompt_slug",
      {
        method: "POST",
        body: {
          p_prompt_id: randomUUID(),
          p_new_slug: `audit-probe-${randomUUID().slice(0, 8)}`,
          p_user_id: NOBODY,
        },
      },
    );

    // The function answers with a jsonb error rather than an HTTP failure.
    // What matters is that naming somebody else stops it before it ever looks
    // the prompt up.
    expect(
      res.data?.error,
      `expected a refusal, got ${JSON.stringify(res.data)}`,
    ).toBe("Not authorized to edit this slug");
  });
});

test.describe("the Menerio queue only takes artifacts you own", () => {
  test("queueing someone else's artifact is refused", async () => {
    const { userId } = await signInTestUser();

    // A real artifact the test account does not own, so the row is refused for
    // its ownership and not for naming something that does not exist.
    const foreign = await restAsService<Array<{ id: string }>>(
      `prompts?author_id=neq.${userId}&select=id&limit=1`,
    );
    const foreignId = foreign.data?.[0]?.id;
    test.skip(
      !foreignId,
      "no prompt owned by anyone other than the test account",
    );

    const res = await restAsUser("menerio_sync_queue", {
      method: "POST",
      body: {
        user_id: userId,
        artifact_type: "prompt",
        artifact_id: foreignId,
        status: "pending",
      },
      headers: { Prefer: "return=minimal" },
    });

    expect(
      res.ok,
      "another account's artifact was queued for sync to this account's " +
        "Menerio host, which is how its full content leaves the system",
    ).toBe(false);
  });
});
