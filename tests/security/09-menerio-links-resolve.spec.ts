// Finding M7: every prompt kit ever synced to Menerio linked to a 404.
//
// process-menerio-sync-queue built the link it announced from the TABLE name
// (`prompt_kits`) while the route is `/prompt-kits/:slug`. Prompts, skills and
// workflows were right by accident, so nobody noticed.
//
// Checking this with an HTTP status is worthless: querino.ai is a single-page
// app and /prompt_kits/x and /prompt-kits/x return the same 200 and the same
// bytes. So the last test reads the route table out of the JavaScript bundle
// the site is serving right now and compares it with the map the worker uses.
// The map itself lives in supabase/functions/_shared/artifactRoutes.ts, which
// is the same module the deployed worker imports.

import { test, expect } from "@playwright/test";
import {
  ARTIFACT_TYPES,
  publicUrlFor,
  routeFor,
  tableFor,
} from "../../supabase/functions/_shared/artifactRoutes";

const SITE = process.env.QUERINO_SITE_URL ?? "https://querino.ai";

/** The main JS bundle querino.ai is serving right now. */
async function publishedBundle(): Promise<string> {
  const index = await fetch(SITE);
  expect(index.status, `${SITE} did not answer`).toBe(200);
  const html = await index.text();
  const asset = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
  expect(asset, "no main bundle in the published HTML").toBeTruthy();
  const js = await fetch(`${SITE}${asset}`);
  expect(js.status, `${asset} did not answer`).toBe(200);
  return js.text();
}

test.describe("M7 — the link Menerio is given is a route the site declares", () => {
  test("a prompt kit is announced under the hyphenated route", () => {
    expect(publicUrlFor("prompt_kit", "my-kit")).toBe("https://querino.ai/prompt-kits/my-kit");
    expect(publicUrlFor("prompt_kit", "my-kit")).not.toContain("prompt_kits");
  });

  test("the table name and the route are allowed to differ, and do", () => {
    expect(tableFor("prompt_kit")).toBe("prompt_kits");
    expect(routeFor("prompt_kit")).toBe("prompt-kits");
  });

  test("an unknown artifact type fails loudly instead of being guessed at", () => {
    expect(() => routeFor("claw")).toThrow(/Unknown artifact type/);
    expect(() => tableFor("claw")).toThrow(/Unknown artifact type/);
  });

  test("every route the worker announces is one the live site routes", async () => {
    const bundle = await publishedBundle();

    for (const type of ARTIFACT_TYPES) {
      const declared = `/${routeFor(type)}/:slug`;
      expect(
        bundle.includes(declared),
        `the published site does not declare a route ${declared}, so links to ${type} land on the not-found page`,
      ).toBe(true);
    }

    // And the shape of the old bug specifically: the table name is not a route.
    expect(
      bundle.includes("/prompt_kits/:slug"),
      "the site would have to declare /prompt_kits/:slug for the old link to have worked, and it does not",
    ).toBe(false);
  });
});
