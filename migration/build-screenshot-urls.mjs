// Turns migration/routes.json into a concrete list of URLs to photograph.
//
// Parameterised routes need real values or the screenshot is of an error page. Real slugs
// come from the live sitemap. Where the public sitemap has nothing (prompt kits,
// collections, profiles, blog posts are all empty or RLS-blocked for a logged-out
// visitor) a synthetic value is used on purpose: it baselines the not-found branch,
// which is itself behaviour the migration must preserve.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SITEMAP = "https://querino.ai/sitemap.xml";

const sitemapPaths = await fetch(SITEMAP)
  .then((r) => r.text())
  .then((xml) => [...xml.matchAll(/<loc>https:\/\/querino\.ai([^<]*)<\/loc>/g)].map((m) => m[1] || "/"))
  .catch(() => []);

const firstUnder = (prefix) =>
  sitemapPaths.find((p) => p.startsWith(prefix + "/"))?.slice(prefix.length + 1) ?? null;

const realPromptSlug = firstUnder("/prompts");
const realSkillSlug = firstUnder("/skills");
const realWorkflowSlug = firstUnder("/workflows");

// value + whether it is real data or a deliberate miss, so the report can be honest
// about which screenshots show content and which show an empty state.
const SAMPLES = {
  "/prompts/:slug":            [realPromptSlug, "sitemap"],
  "/prompts/:slug/edit":       [realPromptSlug, "sitemap"],
  "/library/:slug/edit":       [realPromptSlug, "sitemap"],
  "/library/:slug/versions":   [realPromptSlug, "sitemap"],
  "/skills/:slug":             [realSkillSlug, "sitemap"],
  "/skills/:slug/edit":        [realSkillSlug, "sitemap"],
  "/workflows/:slug":          [realWorkflowSlug, "sitemap"],
  "/workflows/:slug/edit":     [realWorkflowSlug, "sitemap"],
  "/prompt-kits/:slug":        ["baseline-no-public-kit", "synthetic"],
  "/prompt-kits/:slug/edit":   ["baseline-no-public-kit", "synthetic"],
  "/collections/:id":          ["00000000-0000-0000-0000-000000000000", "synthetic"],
  "/collections/:id/edit":     ["00000000-0000-0000-0000-000000000000", "synthetic"],
  "/team/:id/settings":        ["00000000-0000-0000-0000-000000000000", "synthetic"],
  "/team/:id/activity":        ["00000000-0000-0000-0000-000000000000", "synthetic"],
  "/u/:username":              ["baseline-no-public-profile", "synthetic"],
  "/u/:username/activity":     ["baseline-no-public-profile", "synthetic"],
  "/blog/:slug":               ["baseline-no-published-post", "synthetic"],
  "/blog/category/:slug":      ["baseline-no-category", "synthetic"],
  "/blog/tag/:slug":           ["baseline-no-tag", "synthetic"],
  "/blog/admin/posts/:id/edit":["00000000-0000-0000-0000-000000000000", "synthetic"],
};

const { routes } = JSON.parse(readFileSync(resolve(here, "routes.json"), "utf8"));
const slug = (u) => (u === "/" ? "root" : u.replace(/^\//, "").replace(/[^\w.-]+/g, "_"));

const entries = [];
for (const r of routes) {
  if (r.catchAll) continue;
  if (!r.params.length) {
    entries.push({ route: r.path, url: r.path, data: "static", guard: r.guard, name: slug(r.path) });
    continue;
  }
  const [value, origin] = SAMPLES[r.path] ?? [null, "unmapped"];
  if (!value) {
    entries.push({ route: r.path, url: null, data: "UNMAPPED", guard: r.guard, name: slug(r.path) });
    continue;
  }
  entries.push({
    route: r.path,
    url: r.path.replace(/:(\w+)/, encodeURIComponent(value)),
    data: origin,
    guard: r.guard,
    name: slug(r.path),
  });
}

// The catch-all and the migration scaffolding are photographed too: a 404 that stops
// being a 404 is a regression, and the token gallery is the whole point of the exercise.
entries.push({ route: "*", url: "/this-route-does-not-exist", data: "synthetic", guard: "catch-all", name: "catch-all-404" });
entries.push({ route: "/__tokens", url: "/__tokens", data: "scaffolding", guard: "public", name: "__tokens" });

writeFileSync(resolve(here, "screenshot-urls.json"), JSON.stringify(entries, null, 2) + "\n");

const counts = entries.reduce((a, e) => ((a[e.data] = (a[e.data] ?? 0) + 1), a), {});
console.log(`sitemap paths fetched: ${sitemapPaths.length}`);
console.log(`urls: ${entries.length}`, JSON.stringify(counts));
const unmapped = entries.filter((e) => !e.url);
if (unmapped.length) console.log(`UNMAPPED: ${unmapped.map((e) => e.route).join(", ")}`);
