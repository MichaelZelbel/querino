import { defineConfig, devices } from "@playwright/test";

// The visual-regression baseline for the TanStack migration. Separate from
// playwright.config.ts (Lovable's harness, unrunnable outside the sandbox) and from
// playwright.security.config.ts (HTTP-only, no browser).
//
// It photographs every route against the PRODUCTION BUILD, not the dev server, so the
// baseline and the post-migration comparison are taken of the same kind of artifact.
//
//   npm run build
//   npx playwright test --config=playwright.baseline.config.ts
//
// Output directory is switchable so the same spec produces baseline/, after-prep/ and
// after-migration/ without editing anything:
//
//   SHOT_DIR=after-prep npx playwright test --config=playwright.baseline.config.ts

export default defineConfig({
  testDir: "./tests/baseline",
  testMatch: "**/*.spec.ts",

  // Screenshots of a page that loads live Supabase data are order-sensitive enough
  // without also fighting for the same preview server.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,

  reporter: [["list"]],

  use: {
    baseURL: process.env.SHOT_BASE_URL ?? "http://localhost:4173",
    // defaultTheme is "system" (next-themes), so the OS preference decides light vs
    // dark. Pin it, or the baseline changes with whoever runs it.
    colorScheme: "light",
    reducedMotion: "reduce",
    ...devices["Desktop Chrome"],
  },

  webServer: process.env.SHOT_BASE_URL
    ? undefined
    : {
        command: "npx vite preview --port 4173 --strictPort",
        url: "http://localhost:4173",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
