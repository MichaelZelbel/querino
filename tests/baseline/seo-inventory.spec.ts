import { test } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Records what each route actually puts in <head>, read out of the running app rather
// than inferred from SEOHead's props.
//
// This exists because SEOHead writes the head in a useEffect and renders null, so none
// of it exists until React has run in a browser. The migration is supposed to move all
// of it into route metadata; this file is the list of what has to come out the other
// side, and the thing to diff against afterwards.
//
//   npx playwright test --config=playwright.baseline.config.ts seo-inventory

type Entry = { route: string; url: string | null; guard: string; name: string };

const entries: Entry[] = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "migration/screenshot-urls.json"),
    "utf8",
  ),
);

type Captured = {
  route: string;
  url: string;
  title: string;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogType: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  rss: string | null;
  jsonLdTypes: string[];
};

const captured: Captured[] = [];

test.describe.configure({ mode: "serial" });

for (const entry of entries) {
  const testFn = entry.url ? test : test.skip;
  testFn(`seo ${entry.name}`, async ({ page }) => {
    await page.goto(entry.url!, { waitUntil: "networkidle" });
    // SEOHead writes the head from an effect, so give React a paint to get there.
    await page.waitForTimeout(400);

    // Read the whole head in one evaluate. A Playwright locator waits for an element
    // to appear, so asking it for a meta tag that a page legitimately does not have
    // costs a full timeout each; there are eleven of them per route.
    const head = await page.evaluate(() => {
      const attr = (sel: string, a = "content") =>
        document.querySelector(sel)?.getAttribute(a) ?? null;
      const jsonLdTypes: string[] = [];
      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((el) => {
          try {
            const parsed = JSON.parse(el.textContent ?? "");
            for (const o of [parsed].flat())
              jsonLdTypes.push(String(o["@type"] ?? "unknown"));
          } catch {
            jsonLdTypes.push("unparseable");
          }
        });
      return {
        title: document.title,
        description: attr('meta[name="description"]'),
        canonical: attr('link[rel="canonical"]', "href"),
        robots: attr('meta[name="robots"]'),
        ogTitle: attr('meta[property="og:title"]'),
        ogType: attr('meta[property="og:type"]'),
        ogImage: attr('meta[property="og:image"]'),
        ogUrl: attr('meta[property="og:url"]'),
        twitterCard: attr('meta[name="twitter:card"]'),
        rss: attr('link[type="application/rss+xml"]', "href"),
        jsonLdTypes,
      };
    });

    captured.push({ route: entry.route, url: entry.url!, ...head });
  });
}

test.afterAll(() => {
  captured.sort((a, b) => a.route.localeCompare(b.route));
  const out = resolve(process.cwd(), "migration");
  writeFileSync(
    resolve(out, "seo-inventory.json"),
    JSON.stringify(captured, null, 2) + "\n",
  );

  const withTitle = captured.filter((c) => c.title && c.title !== "Querino");
  const withCanonical = captured.filter((c) => c.canonical);
  const withJsonLd = captured.filter((c) => c.jsonLdTypes.length);

  const lines = [
    "# What each route puts in <head> today",
    "",
    "Captured from the running production build, not read off SEOHead's props, because",
    "SEOHead writes all of this from a useEffect and renders null. A crawler that does not",
    "execute JavaScript sees none of it. That is the whole reason for the migration, and",
    "this file is the list of what has to survive it.",
    "",
    `Routes captured: ${captured.length}. With their own title: ${withTitle.length}.`,
    `With a canonical URL: ${withCanonical.length}. With structured data: ${withJsonLd.length}.`,
    "",
    "After the migration, re-run this spec and diff seo-inventory.json. Every field below",
    "must come back, and the canonical URLs must no longer depend on which host served",
    "the page.",
    "",
  ];
  for (const c of captured) {
    lines.push(`## \`${c.route}\``);
    lines.push("");
    lines.push(`- captured at: \`${c.url}\``);
    lines.push(`- title: ${c.title ? `\`${c.title}\`` : "(none)"}`);
    lines.push(
      `- description: ${c.description ? `\`${c.description}\`` : "(none)"}`,
    );
    lines.push(`- canonical: ${c.canonical ? `\`${c.canonical}\`` : "(none)"}`);
    if (c.robots) lines.push(`- robots: \`${c.robots}\``);
    lines.push(
      `- og: type \`${c.ogType ?? "-"}\`, image ${c.ogImage ? `\`${c.ogImage}\`` : "(none)"}, url ${c.ogUrl ? `\`${c.ogUrl}\`` : "(none)"}`,
    );
    lines.push(
      `- twitter card: ${c.twitterCard ? `\`${c.twitterCard}\`` : "(none)"}`,
    );
    if (c.rss) lines.push(`- rss link: \`${c.rss}\``);
    lines.push(
      `- structured data: ${c.jsonLdTypes.length ? c.jsonLdTypes.map((t) => `\`${t}\``).join(", ") : "(none)"}`,
    );
    lines.push("");
  }
  writeFileSync(resolve(out, "seo-inventory.md"), lines.join("\n"));
});
