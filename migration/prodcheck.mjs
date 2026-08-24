// Loads production pages in a clean, logged-out browser and reports what a visitor and
// a crawler actually get. Written for URGENT-public-pages-are-404.md: signed in, the
// public pages look fine, which is exactly how they stayed broken unnoticed.
//
//   node migration/prodcheck.mjs
//   node migration/prodcheck.mjs https://querino.ai/prompts/some-slug
//
// Must run from the repo root so @playwright/test resolves.
import { chromium } from "@playwright/test";

const DEFAULTS = [
  "https://querino.ai/prompts/conduct-a-project-premortem-and-plan-revision",
  "https://querino.ai/skills/anti-hallucination-reasoning-protocol",
  "https://querino.ai/workflows/create-validation-workflow",
  "https://querino.ai/discover",
  "https://querino.ai/blog",
];

const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULTS;

const browser = await chromium.launch();
const ctx = await browser.newContext(); // no storage state: this is the logged-out view
let broken = 0;

for (const url of urls) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error")
      errors.push(m.text().replace(/\s+/g, " ").slice(0, 200));
  });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(1500);
    const { h1, robots, title } = await page.evaluate(() => ({
      h1: document.querySelector("h1")?.textContent?.trim() ?? "(no h1)",
      robots:
        document
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content") ?? null,
      title: document.title,
    }));
    const notFound = /not found/i.test(h1) || /noindex/i.test(robots ?? "");
    if (notFound) broken++;
    console.log(`\n${notFound ? "BROKEN " : "ok     "} ${url}`);
    console.log(`  title:  ${title}`);
    console.log(`  h1:     ${h1}`);
    console.log(`  robots: ${robots ?? "(none)"}`);
    for (const e of errors.slice(0, 3)) console.log(`  error:  ${e}`);
  } catch (err) {
    broken++;
    console.log(`\nFAILED  ${url}\n  ${err.message.split("\n")[0]}`);
  }
  await page.close();
}

await browser.close();
console.log(
  `\n${urls.length - broken}/${urls.length} pages render their content to a logged-out visitor.`,
);
process.exitCode = broken ? 1 : 0;
