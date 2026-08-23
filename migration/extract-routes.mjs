// Dumps the router as data so the post-migration route tree can be diffed against it.
// Pre-migration it parses the <Route> elements out of src/App.tsx.
// Post-migration, replace parseAppTsx() with a walk of src/routes/** and keep the output
// format identical — routes.txt is the file that gets diffed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

function parseAppTsx() {
  const src = readFileSync(resolve(repo, "src/App.tsx"), "utf8");

  // Which page component each lazy()/import binding points at, so the inventory
  // survives the component being renamed during the migration.
  const modules = new Map();
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("([^"]+)"\)\)/g)) {
    modules.set(m[1], { module: m[2], loading: "lazy" });
  }
  for (const m of src.matchAll(/^import\s+(\w+)\s+from\s+"(\.\/pages\/[^"]+)"/gm)) {
    modules.set(m[1], { module: m[2], loading: "eager" });
  }

  const routes = [];
  for (const m of src.matchAll(/<Route\s+path="([^"]*)"\s+element=\{<(\w+)([^>]*)\/>\}/g)) {
    const [, path, element, rest] = m;
    const redirect = element === "Navigate" ? /to="([^"]+)"/.exec(rest)?.[1] ?? null : null;
    const mod = modules.get(element);
    routes.push({
      path,
      element,
      module: mod?.module ?? null,
      loading: mod?.loading ?? (redirect ? "redirect" : "unknown"),
      redirectsTo: redirect,
      params: [...path.matchAll(/:(\w+)/g)].map((p) => p[1]),
      catchAll: path === "*",
    });
  }
  return routes;
}

// The router itself carries no guards: every route element is reachable and each page
// decides for itself what a logged-out or under-privileged visitor sees. That is a fact
// the migration must preserve, so it is recorded rather than inferred.
function classifyGuard(route) {
  if (route.catchAll) return "catch-all";
  if (route.redirectsTo) return "redirect";
  const p = route.path;
  if (p.startsWith("/admin") || p.startsWith("/blog/admin")) return "in-page-admin-check";
  const authed = [
    "/settings", "/profile/edit", "/activity", "/collections/new", "/team/",
    "/prompts/new", "/prompts/wizard", "/skills/new", "/workflows/new", "/prompt-kits/new",
    "/create-from-menerio",
  ];
  if (authed.some((a) => p.startsWith(a)) || p.endsWith("/edit") || p.endsWith("/versions")) {
    return "in-page-auth-check";
  }
  return "public";
}

// /__* paths are migration scaffolding, not product routes. They are kept out of the
// inventory so routes.txt stays a clean before/after diff of the real URL surface.
const routes = parseAppTsx()
  .filter((r) => !r.path.startsWith("/__"))
  .map((r) => ({ ...r, guard: classifyGuard(r) }));

mkdirSync(resolve(here), { recursive: true });
writeFileSync(
  resolve(here, "routes.json"),
  JSON.stringify({ generatedFrom: "src/App.tsx", count: routes.length, routes }, null, 2) + "\n",
);
writeFileSync(
  resolve(here, "routes.txt"),
  routes.map((r) => r.path).sort().join("\n") + "\n",
);

const byGuard = routes.reduce((acc, r) => ((acc[r.guard] = (acc[r.guard] ?? 0) + 1), acc), {});
console.log(`routes: ${routes.length}`);
console.log(`parameterised: ${routes.filter((r) => r.params.length).length}`);
console.log(`by guard: ${JSON.stringify(byGuard)}`);
const unknown = routes.filter((r) => r.loading === "unknown");
if (unknown.length) console.log(`UNRESOLVED elements: ${unknown.map((r) => r.element).join(", ")}`);
