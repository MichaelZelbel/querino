#!/usr/bin/env node
// On a phone, the AI Insights tab covers nothing a reader needs (issue #40).
//
// Opens a prompt, a skill, a workflow and a prompt kit page of the running app
// as a signed-in person (the tab is only shown to signed-in people), at 375 and
// 414 px wide, in light and in dark mode, and measures. At each scroll position
// from the top of the page to its bottom (one step per half screen) it takes the
// box of the visible "Open AI Insights" tab and fails when that box overlaps any
// text, link, button, form field or code block of the page and the tab is the
// one painted on top there. It does this twice
// per page: as the page opens, and after the panel was opened and closed again
// (the tab is rendered by a different branch then).
//
// It needs a running app and the account to sign in with. Against this
// checkout's test copy:
//
//   harness/test-copy.sh dev 8080 &        # the app on port 8080
//   eval "$(harness/test-copy.sh env)" && node scripts/check-insights-tab-overlap.mjs http://127.0.0.1:8080
//
// Reads VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY,
// QUERINO_TEST_COPY_AUTHOR_EMAIL and QUERINO_TEST_COPY_AUTHOR_PASSWORD.
// The pages default to the test copy's seeded items; override with PAGES
// (comma-separated paths). With --shots <dir> it also saves one screenshot per
// page at 375 px, light mode: at the top of the page and one screen down.
//
// Exits 1 and prints one line per overlap, or when a page shows no tab at all
// (a check that finds no tab has measured nothing).

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const shotsAt = args.indexOf("--shots");
const shotDir = shotsAt >= 0 ? args[shotsAt + 1] : null;
const origin = (
  args.find((a, i) => !a.startsWith("--") && i !== shotsAt + 1) ??
  "http://127.0.0.1:8080"
).replace(/\/$/, "");

const apiUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.QUERINO_TEST_COPY_AUTHOR_EMAIL;
const password = process.env.QUERINO_TEST_COPY_AUTHOR_PASSWORD;
if (!apiUrl || !anonKey || !email || !password) {
  console.error(
    'Missing the test copy variables. Run: eval "$(harness/test-copy.sh env)" first, in the same shell.',
  );
  process.exit(2);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(apiUrl)) {
  console.error(
    `Refusing to sign in anywhere but a local test copy (${apiUrl}).`,
  );
  process.exit(2);
}

const PAGES = (
  process.env.PAGES ??
  [
    "/prompts/summarise-a-meeting-transcript",
    "/skills/review-a-pull-request-for-risky-changes",
    "/workflows/weekly-research-digest",
    "/prompt-kits/launch-week-prompt-kit",
  ].join(",")
)
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const WIDTHS = [375, 414];
const THEMES = ["light", "dark"];
const HEIGHT = 800;

// supabase-js keeps the session under sb-<first host label>-auth-token.
const storageKey = `sb-${new URL(apiUrl).hostname.split(".")[0]}-auth-token`;

async function signIn() {
  const res = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok)
    throw new Error(`sign-in failed: ${res.status} ${await res.text()}`);
  const s = await res.json();
  return {
    ...s,
    expires_at: s.expires_at ?? Math.floor(Date.now() / 1000) + s.expires_in,
  };
}

// Runs in the page: the tab's box and every readable or clickable box it overlaps.
function measure() {
  const visible = (r) => r.width > 0 && r.height > 0;
  const tabs = [...document.querySelectorAll('[aria-label="Open AI Insights"]')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(
      ({ el, r }) => visible(r) && getComputedStyle(el).visibility !== "hidden",
    );
  if (tabs.length === 0) return { tab: null, hits: [] };
  const { el: tab, r: t } = tabs[0];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Covered: the boxes overlap by at least a pixel each way, and at the middle
  // of the overlap the tab is what is painted on top. Something drawn over the
  // tab (the sticky header, as the page scrolls under it) is not covered by it.
  const overlaps = (r) => {
    const left = Math.max(r.left, t.left);
    const right = Math.min(r.right, t.right);
    const top = Math.max(r.top, t.top);
    const bottom = Math.min(r.bottom, t.bottom);
    if (right - left < 1 || bottom - top < 1) return false;
    const onTop = document.elementFromPoint(
      (left + right) / 2,
      (top + bottom) / 2,
    );
    return !!onTop && tab.contains(onTop);
  };
  const onScreen = (r) =>
    r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  const describe = (node) => {
    const el = node.nodeType === 1 ? node : node.parentElement;
    const text = (node.textContent || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
    return `<${el.tagName.toLowerCase()}> "${text}"`;
  };
  const hits = [];
  const seen = new Set();
  const hit = (node, r) => {
    const d = describe(node);
    if (seen.has(d)) return;
    seen.add(d);
    hits.push(
      `${d} at ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`,
    );
  };
  // Text: every non-blank text node, measured line by line.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim() || tab.contains(n)) continue;
    const parent = n.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName))
      continue;
    if (getComputedStyle(parent).visibility === "hidden") continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (visible(r) && onScreen(r) && overlaps(r)) {
        hit(n, r);
        break;
      }
    }
  }
  // Controls and code blocks, which can be a box without text (an icon button).
  const boxes = document.querySelectorAll(
    'a, button, input, textarea, select, pre, code, [role="button"], [role="tab"]',
  );
  for (const el of boxes) {
    if (el === tab || tab.contains(el) || el.contains(tab)) continue;
    const r = el.getBoundingClientRect();
    if (
      !visible(r) ||
      !onScreen(r) ||
      getComputedStyle(el).visibility === "hidden"
    )
      continue;
    if (overlaps(r)) hit(el, r);
  }
  return {
    tab: `${Math.round(t.left)},${Math.round(t.top)} ${Math.round(t.width)}x${Math.round(t.height)}`,
    hits,
  };
}

const session = await signIn();
// CHROMIUM_PATH picks a browser when the one this Playwright release expects is not installed.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const failures = [];
let measured = 0;

try {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: HEIGHT },
        colorScheme: theme,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      await context.addInitScript(
        ([key, value, theme]) => {
          localStorage.setItem(key, value);
          localStorage.setItem("querino-consent", "essential");
          localStorage.setItem("theme", theme);
        },
        [storageKey, JSON.stringify(session), theme],
      );
      const page = await context.newPage();
      for (const path of PAGES) {
        await page.goto(origin + path, { waitUntil: "networkidle" });
        await page.locator("main h1").first().waitFor({ timeout: 20_000 });
        const tabLocator = page.locator(
          '[aria-label="Open AI Insights"]:visible',
        );
        try {
          await tabLocator.first().waitFor({ timeout: 15_000 });
        } catch {
          failures.push(
            `${path} ${width}px ${theme}: no AI Insights tab shown (signed in?)`,
          );
          continue;
        }
        if (shotDir && width === 375 && theme === "light") {
          mkdirSync(shotDir, { recursive: true });
          const name = path.split("/")[1].replace(/s$/, "");
          await page.screenshot({ path: join(shotDir, `${name}-375.png`) });
          await page.evaluate((y) => window.scrollTo(0, y), HEIGHT);
          await page.evaluate(
            () =>
              new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              ),
          );
          await page.screenshot({
            path: join(shotDir, `${name}-375-scrolled.png`),
          });
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        for (const state of ["as opened", "after open and close"]) {
          if (state === "after open and close") {
            await page.evaluate(() => window.scrollTo(0, 0));
            await tabLocator.first().click();
            await page
              .locator('[aria-label="Close insights"]:visible')
              .first()
              .click();
            await tabLocator.first().waitFor({ timeout: 5_000 });
          }
          const total = await page.evaluate(
            () => document.documentElement.scrollHeight,
          );
          const positions = [];
          for (let y = 0; y < total - HEIGHT; y += HEIGHT / 2)
            positions.push(y);
          positions.push(Math.max(0, total - HEIGHT));
          for (const y of positions) {
            await page.evaluate((y) => window.scrollTo(0, y), y);
            await page.evaluate(
              () =>
                new Promise((r) =>
                  requestAnimationFrame(() => requestAnimationFrame(r)),
                ),
            );
            const { tab, hits } = await page.evaluate(measure);
            measured++;
            const where = `${path} ${width}px ${theme} ${state} scrollY=${y}`;
            if (!tab) {
              failures.push(`${where}: no AI Insights tab shown`);
              continue;
            }
            for (const h of hits)
              failures.push(`${where}: tab ${tab} covers ${h}`);
          }
          console.log(
            `checked ${path} ${width}px ${theme} ${state}: ${positions.length} scroll positions`,
          );
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  for (const f of failures) console.log(`FAIL ${f}`);
  console.log(`${failures.length} overlap(s) in ${measured} measurements`);
  process.exit(1);
}
console.log(
  `ok: the AI Insights tab covers nothing in ${measured} measurements`,
);
