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

interface ConfigRow {
  call_site: string;
  model: string;
}

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
  });
});
