// Finding H1: four endpoints exist only for scheduled jobs to call, and the
// thing calling them was the anon key, which ships inside every visitor's
// browser bundle. Three of them had no check in the code at all. In practice
// they were open to the world: a stranger could drain the GitHub sync queue
// using other people's stored tokens, force Menerio syncs, or run a loop
// against the paid AI moderation endpoint.
//
// These tests are the definition of done for Phase 1. Until it ships they
// fail, and that is the correct reading: the endpoints really are open.

import { test, expect } from "@playwright/test";
import { asAnonKey, asAnonymous, asInternalKey, callFunction } from "./helpers/api";
import { INTERNAL_JOB_SECRET } from "./helpers/env";

/** Every endpoint whose only legitimate caller is one of our own jobs. */
const JOB_ENDPOINTS: Array<{ name: string; body: Record<string, unknown>; does: string }> = [
  {
    name: "github-sync-worker",
    body: {},
    does: "drains the sync queue, pushing users' artifacts with their stored GitHub tokens",
  },
  {
    name: "ai-moderate-content",
    body: {},
    does: "processes queue items, each one a paid call to the AI gateway",
  },
  {
    name: "process-menerio-sync-queue",
    body: {},
    does: "forces Menerio syncs and deletes completed queue rows",
  },
  {
    name: "ensure-token-allowance",
    body: { batch_init: true },
    does: "walks every profile and provisions allowances",
  },
];

test.describe("H1 — machine endpoints are not open to the world", () => {
  for (const endpoint of JOB_ENDPOINTS) {
    test(`${endpoint.name} refuses a caller with no key (it ${endpoint.does})`, async () => {
      const res = await callFunction(endpoint.name, endpoint.body, asAnonymous);
      expect(res.status).toBe(401);
    });

    test(`${endpoint.name} refuses the anon key, which is public`, async () => {
      const res = await callFunction(endpoint.name, endpoint.body, asAnonKey);
      expect(res.status).toBe(401);
    });

    test(`${endpoint.name} refuses a wrong internal key`, async () => {
      const res = await callFunction(
        endpoint.name,
        endpoint.body,
        asInternalKey("not-the-internal-key-0000000000000000"),
      );
      expect(res.status).toBe(401);
    });
  }

  // Positive control: once the secret exists, the real jobs must still work.
  // Without this, "return 401 to everyone" would pass every test above.
  for (const endpoint of JOB_ENDPOINTS) {
    test(`${endpoint.name} still admits the job that owns it`, async () => {
      test.skip(!INTERNAL_JOB_SECRET, "INTERNAL_JOB_SECRET is not set: Phase 1 has not shipped.");
      test.slow();
      const res = await callFunction(endpoint.name, endpoint.body, asInternalKey(INTERNAL_JOB_SECRET));
      expect(res.status).toBe(200);
    });
  }

  // Not one of the seven, but the same class and it costs nothing to hold:
  // production had a suggest-claw-metadata function deployed that does not
  // exist in this repository, left over from the removed Claws feature.
  // Nothing owns it, so nothing can vouch for it.
  test("no orphan function is reachable that this repository does not contain", async () => {
    const res = await callFunction("suggest-claw-metadata", {}, asAnonKey);
    expect(
      res.status,
      "suggest-claw-metadata answered, so an undeployed orphan is still live",
    ).toBe(404);
  });
});
