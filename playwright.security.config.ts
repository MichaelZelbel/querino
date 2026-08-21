import { defineConfig } from "@playwright/test";

// The security suite is separate from playwright.config.ts on purpose.
//
// playwright.config.ts is Lovable's browser-test harness and needs a package
// that only exists inside Lovable's sandbox, so it cannot run on a developer
// machine or in CI. These tests are HTTP only: no browser, no dev server, no
// Lovable package. They talk to the deployed project over the same wire an
// attacker would, so a pass can only mean the running system behaves.

export default defineConfig({
  testDir: "./tests/security",
  testMatch: "**/*.spec.ts",

  // Several tests move the same test account's credit balance and put it back.
  // Running them at once would have them read each other's half-done state.
  fullyParallel: false,
  workers: 1,

  // A security check that passes on the second attempt did not pass.
  retries: 0,

  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  // Fail the run rather than let a stray .only hide the rest of the suite.
  forbidOnly: Boolean(process.env.CI),
});
