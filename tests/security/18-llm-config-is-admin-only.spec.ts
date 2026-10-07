// A system prompt is not something to hand out with the anon key, and the model
// dropdown is a spending control: whoever can write this table can point every
// AI call in the app at a model they choose, on the platform's bill.
//
// So the table is admin-only in both directions, and the function that fronts it
// refuses anyone else before it reads a single row.
//
// Writes from the admin panel go through admin-llm-config rather than PostgREST,
// so the RLS policies here are defence in depth. They are tested anyway: the
// endpoint is not the only thing holding the anon key out of this table, and a
// future caller reaching for PostgREST directly must not find it open.

import { test, expect } from "@playwright/test";
import {
  asAnonKey,
  asUser,
  callFunction,
  restAsService,
  restAsUser,
  signInTestUser,
} from "./helpers/api";
import { ANON_KEY, REST_URL } from "./helpers/env";
import {
  type LlmConfigSnapshot,
  restoreLlmConfig,
  snapshotLlmConfig,
} from "./helpers/llmConfig";

interface ConfigRow {
  call_site: string;
  model: string;
  enabled?: boolean;
}

// The write tests below aim a fake model at the live prompt-coach row. When one
// of them fails, the write went through, and without a restore the Prompt
// Coach for every real user is left pointing at "attacker/expensive-model" (it
// happened on 2026-09-23, when a second copy of this suite ran spec 08's
// temporary admin promotion at the same moment). Whatever the outcome, the row
// is put back.
//
// The whole row, `enabled` included: within two minutes of that write the
// nightly model sync saw an unknown model and switched the row off, and the
// model was put back on 2026-09-23 but the switch was not, until 2026-09-30.
//
// Read before the first write, restored in that test's `finally` and again in
// afterAll, and the restore checks that it landed (helpers/llmConfig.ts).
// Until 2026-10-07 a failed first read meant no restore at all, and nothing
// looked at whether the restoring PATCH had worked.
let promptCoach: LlmConfigSnapshot | undefined;

async function promptCoachBeforeWriting(): Promise<LlmConfigSnapshot> {
  promptCoach ??= await snapshotLlmConfig("prompt-coach");
  return promptCoach;
}

test.afterAll(async () => {
  // No snapshot means no test got as far as writing.
  if (promptCoach) await restoreLlmConfig(promptCoach);
});

test.describe("LLM configuration is admin-only", () => {
  test("a stranger holding the anon key gets nothing", async () => {
    const res = await fetch(
      `${REST_URL}/llm_call_configs?select=call_site,model`,
      {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      },
    );
    const body = await res.json();
    const rows = Array.isArray(body) ? (body as ConfigRow[]) : [];

    expect(
      rows.length,
      "the anon key, which ships in every visitor's browser bundle, is reading the system " +
        "prompts and the model routing. The table has lost its RLS policies.",
    ).toBe(0);
  });

  test("a signed-in non-admin gets nothing either", async () => {
    const res = await restAsUser<ConfigRow[]>(
      "llm_call_configs?select=call_site,model",
    );
    const rows = Array.isArray(res.data) ? res.data : [];
    expect(
      rows.length,
      "an ordinary account can read the LLM configuration",
    ).toBe(0);
  });

  test("a signed-in non-admin cannot repoint a call site at a model of its choosing", async () => {
    const path =
      "llm_call_configs?call_site=eq.prompt-coach&tier=eq.default&select=call_site,model";
    const snapshot = await promptCoachBeforeWriting();
    try {
      const before = await restAsService<ConfigRow[]>(path);

      await restAsUser(
        "llm_call_configs?call_site=eq.prompt-coach&tier=eq.default",
        {
          method: "PATCH",
          body: { model: "attacker/expensive-model" },
        },
      );

      // The status code is not the assertion. Whether the row moved is.
      const after = await restAsService<ConfigRow[]>(path);
      expect(
        after.data[0].model,
        "a non-admin changed which model an AI call uses, on the platform's bill",
      ).toBe(before.data[0].model);
    } finally {
      await restoreLlmConfig(snapshot);
    }
  });

  test("admin-llm-config refuses a non-admin", async () => {
    const session = await signInTestUser();
    const res = await callFunction(
      "admin-llm-config",
      { action: "list" },
      asUser(session.accessToken),
    );
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).toMatch(/admin/i);
  });

  test("admin-llm-config refuses the anon key outright", async () => {
    const res = await callFunction(
      "admin-llm-config",
      { action: "list" },
      asAnonKey,
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("the save action refuses a non-admin too, which is the write path the panel uses", async () => {
    const session = await signInTestUser();
    const snapshot = await promptCoachBeforeWriting();
    try {
      const res = await callFunction(
        "admin-llm-config",
        {
          action: "save",
          call_site: "prompt-coach",
          patch: { model: "attacker/expensive-model" },
        },
        asUser(session.accessToken),
      );
      expect(res.status).toBe(403);

      const after = await restAsService<ConfigRow[]>(
        "llm_call_configs?call_site=eq.prompt-coach&tier=eq.default&select=call_site,model",
      );
      expect(after.data[0].model).not.toBe("attacker/expensive-model");
    } finally {
      await restoreLlmConfig(snapshot);
    }
  });
});
