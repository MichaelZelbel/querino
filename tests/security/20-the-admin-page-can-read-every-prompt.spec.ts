// The point of showing the prompt: an administrator can only judge a prompt
// they can read, and until now the box on the LLM Config page was empty on all
// seventeen call sites. A default the server cannot produce is an empty box
// again, whatever the panel does, so this asserts the deployed endpoint really
// hands one back for every call site.
//
// The second half is the trap that comes with prefilling the box. The commonest
// action on that page is now opening a call site and pressing Save without
// touching the text. If that stored the default as an override, the call site
// would quietly stop tracking every later change to the prompt in the code, the
// table's "Code default" column would start lying, and nobody would notice for
// months. So: saving an untouched default must leave the row NULL.
//
// The suite promotes its own throwaway test account to admin and demotes it
// again, the way 08-admin-can-still-run-the-jobs does. beforeAll demotes first
// in case a previous run was killed outright.

import { test, expect } from "@playwright/test";
import { asUser, callFunction, restAsService, signInTestUser } from "./helpers/api";

interface ListedConfig {
  call_site: string;
  system_prompt: string | null;
  default_system_prompt: string | null;
  placeholders: string[];
}

const CALL_SITE = "prompt-wizard";
const ROW = `llm_call_configs?call_site=eq.${CALL_SITE}&tier=eq.default`;

async function setRole(role: "free" | "admin"): Promise<void> {
  const { userId } = await signInTestUser();
  const res = await restAsService(`user_roles?user_id=eq.${userId}`, {
    method: "PATCH",
    body: { role },
    headers: { Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error(`Could not set role to ${role}: ${JSON.stringify(res.error)}`);
}

async function listAsAdmin(): Promise<ListedConfig[]> {
  const session = await signInTestUser();
  const res = await callFunction(
    "admin-llm-config",
    { action: "list" },
    asUser(session.accessToken),
  );
  expect(res.status, `list failed: ${res.text.slice(0, 300)}`).toBe(200);
  return ((res.body as { configs?: ListedConfig[] }).configs ?? []);
}

// Captured before anything is written, restored afterwards. Hardcoding the
// restore value would silently overwrite whatever an administrator had set.
let originalPrompt: string | null = null;

test.beforeAll(async () => {
  await setRole("free");
});

test.afterAll(async () => {
  if (originalPrompt !== null) {
    await restAsService(ROW, { method: "PATCH", body: { system_prompt: originalPrompt } });
  }
  await setRole("free");
});

test.describe("the admin page can read the prompt it would send", () => {
  test("every call site hands back a default prompt, not an empty box", async () => {
    await setRole("admin");
    const configs = await listAsAdmin();

    expect(configs.length, "the registry seeds seventeen call sites").toBeGreaterThanOrEqual(17);

    const empty = configs
      .filter((c) => !(c.default_system_prompt ?? "").trim())
      .map((c) => c.call_site);
    expect(
      empty,
      "these call sites still show an empty box, which is the whole bug: the server has no " +
        "way to produce their default prompt",
    ).toEqual([]);
  });

  test("the placeholders the panel advertises are the ones the prompt actually uses", async () => {
    await setRole("admin");
    const configs = await listAsAdmin();

    const wrong: string[] = [];
    for (const c of configs) {
      const text = c.default_system_prompt ?? "";
      const used = [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
      for (const name of used) {
        if (!c.placeholders.includes(name)) wrong.push(`${c.call_site} uses {{${name}}}`);
      }
      for (const name of c.placeholders) {
        if (!text.includes(`{{${name}}}`)) wrong.push(`${c.call_site} advertises unused {{${name}}}`);
      }
    }
    expect(wrong, "the hint under the box does not match the prompt above it").toEqual([]);
  });

  test("saving the prefilled default does not turn it into an override", async () => {
    await setRole("admin");

    const before = await restAsService<Array<{ system_prompt: string | null }>>(
      `${ROW}&select=system_prompt`,
    );
    originalPrompt = before.data[0]?.system_prompt ?? null;

    const listed = (await listAsAdmin()).find((c) => c.call_site === CALL_SITE);
    expect(listed?.default_system_prompt, "no default to save back").toBeTruthy();

    // Exactly what the dialog would send if someone opened it and pressed Save.
    const session = await signInTestUser();
    const res = await callFunction(
      "admin-llm-config",
      {
        action: "save",
        call_site: CALL_SITE,
        tier: "default",
        patch: { system_prompt: listed!.default_system_prompt },
      },
      asUser(session.accessToken),
    );
    expect(res.status, res.text.slice(0, 300)).toBe(200);

    const after = await restAsService<Array<{ system_prompt: string | null }>>(
      `${ROW}&select=system_prompt`,
    );
    expect(
      after.data[0].system_prompt,
      "the untouched default was stored as a custom override. This call site has stopped " +
        "following the prompt in the code and the admin table now says Custom when nothing " +
        "was customised.",
    ).toBeNull();
  });

  test("a real edit is still stored, and reset puts it back", async () => {
    await setRole("admin");
    const session = await signInTestUser();

    const listed = (await listAsAdmin()).find((c) => c.call_site === CALL_SITE);
    const edited = `${listed!.default_system_prompt}\n\nAlways answer in German.`;

    const saved = await callFunction(
      "admin-llm-config",
      { action: "save", call_site: CALL_SITE, tier: "default", patch: { system_prompt: edited } },
      asUser(session.accessToken),
    );
    expect(saved.status, saved.text.slice(0, 300)).toBe(200);

    const withOverride = await restAsService<Array<{ system_prompt: string | null }>>(
      `${ROW}&select=system_prompt`,
    );
    expect(
      withOverride.data[0].system_prompt,
      "a genuine edit was discarded, which would make the whole page read-only in practice",
    ).toBe(edited);

    // "Reset to code default" sends the default back, which means null again.
    const reset = await callFunction(
      "admin-llm-config",
      {
        action: "save",
        call_site: CALL_SITE,
        tier: "default",
        patch: { system_prompt: listed!.default_system_prompt },
      },
      asUser(session.accessToken),
    );
    expect(reset.status).toBe(200);

    const afterReset = await restAsService<Array<{ system_prompt: string | null }>>(
      `${ROW}&select=system_prompt`,
    );
    expect(afterReset.data[0].system_prompt, "reset left the override in place").toBeNull();
  });
});
