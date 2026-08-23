import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// One full-page screenshot per route per viewport, written to migration/<SHOT_DIR>/.
// These are not assertions. They are evidence: the migration's regressions are found by
// diffing this directory against the one taken after it, not by a test going red here.

type Entry = {
  route: string;
  url: string | null;
  data: string;
  guard: string;
  name: string;
};

const entries: Entry[] = JSON.parse(
  readFileSync(resolve(process.cwd(), "migration/screenshot-urls.json"), "utf8"),
);

const outDir = resolve(process.cwd(), "migration", process.env.SHOT_DIR ?? "baseline");
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.label} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const entry of entries) {
      // A route with no sample value is a recorded blind spot; it shows up as a skip
      // in the run rather than quietly vanishing from the list.
      const testFn = entry.url ? test : test.skip;

      testFn(`${entry.name} (${entry.route})`, async ({ page }) => {
        // Dismiss the cookie banner before first paint. It is position:fixed and would
        // otherwise sit over the bottom of all 53 screenshots.
        await page.addInitScript(() => {
          try {
            localStorage.setItem("cookie-consent", "accepted");
          } catch {
            /* private mode; the banner just stays visible */
          }
        });

        await page.goto(entry.url!, { waitUntil: "networkidle" });
        await page.waitForFunction(() => document.fonts.status === "loaded", null, {
          timeout: 15_000,
        }).catch(() => {
          /* fonts blocked or offline: photograph the fallback rather than fail */
        });

        // Freeze anything still moving. reducedMotion already suppresses most of it;
        // this also stops the caret and the lazy-route spinner mid-frame.
        await page.addStyleTag({
          content: `*, *::before, *::after {
            animation: none !important;
            transition: none !important;
            caret-color: transparent !important;
          }`,
        });
        await page.waitForTimeout(600);

        await page.screenshot({
          path: resolve(outDir, `${entry.name}@${vp.label}.png`),
          fullPage: true,
        });

        // The one real assertion: the app rendered something, rather than a blank
        // white page from a chunk that failed to load.
        const bodyText = (await page.locator("body").innerText()).trim();
        expect(bodyText.length, `${entry.url} rendered an empty body`).toBeGreaterThan(0);
      });
    }
  });
}
