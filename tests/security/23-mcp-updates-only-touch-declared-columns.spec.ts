// Found 2026-09-08 while reading the MCP server next to its framework. mcp-lite
// 0.10 does not check a tool call against the tool's inputSchema, so every key
// the caller sends reaches the handler. The handler's client is the service
// role, which row-level security, the column grants and the profile guard
// trigger (it only fires for a real auth.uid()) all let through. So:
//
//   update_prompt spread the whole input into SET, and a token holder could
//   write rating_avg, rating_count, team_id or author_id on their own rows.
//
//   update_my_profile spread the whole input into profiles, and the same token
//   could write plan_type = premium and role = admin: the exact promotion test
//   03 proves the website refuses, open again through the side door.
//
//   delete_* said "Deleted <id>" whether or not a row had matched.
//
// The fix is a whitelist in every update handler and a row count in every
// delete handler. These tests hold both in place, live, with a real token.

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { callMcpTool, restAsService, signInTestUser } from "./helpers/api";
import {
  createSearchablePrompt,
  mintMcpToken,
  type MintedMcpToken,
  type PromptFixture,
} from "./helpers/fixtures";

interface PromptRow {
  id: string;
  title: string;
  rating_avg: number | null;
  rating_count: number | null;
  team_id: string | null;
}

interface ProfileRow {
  id: string;
  bio: string | null;
  plan_type: string | null;
  role: string | null;
}

let mcp: MintedMcpToken;
let prompt: PromptFixture;
// Stays undefined if beforeAll dies before the profile was read, in which case
// there is nothing to put back.
let originalBio: string | null | undefined;

// Read through the service role, because the user itself may not select
// plan_type or role off the table any more (see test 03), and the point here
// is what the row holds, not what the user is allowed to see.
async function readPrompt(id: string): Promise<PromptRow> {
  const res = await restAsService<PromptRow[]>(
    `prompts?id=eq.${id}&select=id,title,rating_avg,rating_count,team_id`,
  );
  expect(
    res.ok,
    `reading the prompt failed: ${JSON.stringify(res.error)}`,
  ).toBe(true);
  const row = res.data?.[0];
  if (!row) throw new Error(`prompt ${id} is gone`);
  return row;
}

async function readProfile(): Promise<ProfileRow> {
  const { userId } = await signInTestUser();
  const res = await restAsService<ProfileRow[]>(
    `profiles?id=eq.${userId}&select=id,bio,plan_type,role`,
  );
  expect(
    res.ok,
    `reading the profile failed: ${JSON.stringify(res.error)}`,
  ).toBe(true);
  const row = res.data?.[0];
  if (!row) throw new Error("The test account has no profile row.");
  return row;
}

test.beforeAll(async () => {
  mcp = await mintMcpToken();
  prompt = await createSearchablePrompt();
  originalBio = (await readProfile()).bio;
});

test.afterAll(async () => {
  // Every write below is undone here, and the cleanup runs even when an
  // assertion failed halfway, so a red run leaves the account as it found it.
  if (originalBio !== undefined) {
    const { userId } = await signInTestUser();
    await restAsService(`profiles?id=eq.${userId}`, {
      method: "PATCH",
      body: { bio: originalBio },
      headers: { Prefer: "return=minimal" },
    });
  }
  await prompt?.remove();
  await mcp?.revoke();
});

test.describe("update_prompt writes the declared columns and nothing else", () => {
  test("undeclared columns are dropped while the declared change lands", async () => {
    const before = await readPrompt(prompt.id);
    const newTitle = `${prompt.title} renamed`;
    const strangerTeam = randomUUID();

    const res = await callMcpTool(mcp.token, "update_prompt", {
      id: prompt.id,
      title: newTitle,
      rating_avg: 5,
      rating_count: 99999,
      team_id: strangerTeam,
    });
    expect(
      res.isError,
      `a legitimate title change was refused: ${res.text}`,
    ).toBe(false);

    const after = await readPrompt(prompt.id);
    expect(after.title, "the declared column did not change").toBe(newTitle);
    expect(
      after.rating_avg,
      "rating_avg was written through the MCP server",
    ).toBe(before.rating_avg);
    expect(
      after.rating_count,
      "rating_count was written through the MCP server",
    ).toBe(before.rating_count);
    expect(after.team_id, "team_id was written through the MCP server").toBe(
      before.team_id,
    );
    expect(after.team_id).not.toBe(strangerTeam);
  });

  test("an update made only of undeclared columns is refused, not silently applied", async () => {
    const before = await readPrompt(prompt.id);
    const res = await callMcpTool(mcp.token, "update_prompt", {
      id: prompt.id,
      rating_avg: 5,
      copies_count: 12345,
    });
    expect(
      res.isError,
      `an update with nothing updatable in it was accepted: ${res.text}`,
    ).toBe(true);

    const after = await readPrompt(prompt.id);
    expect(after.rating_avg).toBe(before.rating_avg);
  });
});

test.describe("update_my_profile cannot promote the account", () => {
  test("the test account is a free, non-admin account to begin with", async () => {
    const profile = await readProfile();
    expect(profile.plan_type ?? "free").toBe("free");
    expect(profile.role ?? "user").not.toBe("admin");
  });

  test("plan_type and role on their own are refused", async () => {
    const res = await callMcpTool(mcp.token, "update_my_profile", {
      plan_type: "premium",
      role: "admin",
    });
    expect(
      res.isError,
      `a profile update made only of privileged columns went through: ${res.text}`,
    ).toBe(true);

    const after = await readProfile();
    expect(after.plan_type ?? "free").toBe("free");
    expect(after.role ?? "user").not.toBe("admin");
  });

  test("hiding them among ordinary columns does not smuggle them through", async () => {
    const marker = `security-suite ${Date.now()}`;
    const res = await callMcpTool(mcp.token, "update_my_profile", {
      bio: marker,
      plan_type: "premium",
      role: "admin",
      plan_source: "gifted",
    });
    expect(res.isError, `editing bio must still work: ${res.text}`).toBe(false);

    const after = await readProfile();
    expect(after.bio, "the declared column did not change").toBe(marker);
    expect(after.plan_type ?? "free", "plan_type was written").toBe("free");
    expect(after.role ?? "user", "role was written").not.toBe("admin");
  });
});

test.describe("delete_* tells the truth about what it deleted", () => {
  test("deleting a row that does not exist is an error, not a success", async () => {
    const ghost = randomUUID();
    const res = await callMcpTool(mcp.token, "delete_prompt", { id: ghost });
    expect(
      res.isError,
      `delete_prompt claimed success on a row that never existed: ${res.text}`,
    ).toBe(true);
    expect(res.text).not.toContain("Deleted");
  });

  test("list tools survive an out-of-range window instead of erroring", async () => {
    const res = await callMcpTool(mcp.token, "list_prompts", {
      limit: 100000,
      offset: -5,
    });
    expect(res.isError, `list_prompts errored: ${res.text}`).toBe(false);
    expect(res.text).toContain(prompt.id);
  });

  test("deleting a row the caller owns still works (the control)", async () => {
    // Playwright runs this file serially (workers: 1, fullyParallel: false),
    // so this is the last thing that touches the fixture; afterAll's remove()
    // then finds nothing, which is fine.
    const res = await callMcpTool(mcp.token, "delete_prompt", {
      id: prompt.id,
    });
    expect(res.isError, `deleting our own prompt failed: ${res.text}`).toBe(
      false,
    );
    expect(res.text).toContain(`Deleted prompt ${prompt.id}`);

    const gone = await restAsService<PromptRow[]>(
      `prompts?id=eq.${prompt.id}&select=id`,
    );
    expect(gone.data ?? []).toHaveLength(0);
  });
});
