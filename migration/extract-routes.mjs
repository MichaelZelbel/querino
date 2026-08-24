// Dumps the router as data so the route tree can be diffed across the migration.
//
// Before the migration it parsed the <Route> elements out of src/App.tsx. After it,
// src/App.tsx is gone and the router is generated, so it reads src/routeTree.gen.ts
// instead, and it picks the source automatically. Both produce the same two files, and
// routes.txt is diffed against routes.before.txt, which is the frozen pre-migration list
// and must never be regenerated.
//
//   node migration/extract-routes.mjs
//   diff --strip-trailing-cr migration/routes.before.txt migration/routes.txt
//
// The --strip-trailing-cr matters on Windows: routes.before.txt went through git with
// CRLF, and without it every line reads as changed.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

const ROUTE_TREE = resolve(repo, "src/routeTree.gen.ts");
const APP_TSX = resolve(repo, "src/App.tsx");

// TanStack spells a parameter $slug where React Router spelled it :slug. Normalise, or
// the diff is about spelling rather than about which URLs the app answers.
function parseRouteTree() {
  const src = readFileSync(ROUTE_TREE, "utf8");
  const found = [...src.matchAll(/fullPath: '([^']*)'/g)].map((m) => m[1]);
  const paths = [...new Set(found)]
    .map((p) => p.replace(/\$(\w+)/g, ":$1"))
    .map((p) => (p === "/" ? p : p.replace(/\/$/, "")));
  // The catch-all is a notFoundComponent on the root route, not a fullPath entry.
  paths.push("*");
  return [...new Set(paths)].map((path) => ({
    path,
    element: null,
    module: null,
    loading: "file-route",
    redirectsTo: path === "/dashboard" ? "/library" : null,
    params: [...path.matchAll(/:(\w+)/g)].map((m) => m[1]),
    catchAll: path === "*",
  }));
}

function parseAppTsx() {
  const src = readFileSync(APP_TSX, "utf8");

  // Which page component each lazy()/import binding points at, so the inventory
  // survives the component being renamed during the migration.
  const modules = new Map();
  for (const m of src.matchAll(
    /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("([^"]+)"\)\)/g,
  )) {
    modules.set(m[1], { module: m[2], loading: "lazy" });
  }
  for (const m of src.matchAll(
    /^import\s+(\w+)\s+from\s+"(\.\/pages\/[^"]+)"/gm,
  )) {
    modules.set(m[1], { module: m[2], loading: "eager" });
  }

  const routes = [];
  for (const m of src.matchAll(
    /<Route\s+path="([^"]*)"\s+element=\{<(\w+)([^>]*)\/>\}/g,
  )) {
    const [, path, element, rest] = m;
    const redirect =
      element === "Navigate" ? (/to="([^"]+)"/.exec(rest)?.[1] ?? null) : null;
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

// Neither router carries guards. Before, every route element was reachable and each page
// decided for itself what a logged-out or under-privileged visitor saw. After, the file
// routes are the same, bar /dashboard's beforeLoad redirect. That is a fact the migration
// had to preserve, so it is recorded rather than inferred.
function classifyGuard(route) {
  if (route.catchAll) return "catch-all";
  if (route.redirectsTo) return "redirect";
  const p = route.path;
  if (p.startsWith("/admin") || p.startsWith("/blog/admin"))
    return "in-page-admin-check";
  const authed = [
    "/settings",
    "/profile/edit",
    "/activity",
    "/collections/new",
    "/team/",
    "/prompts/new",
    "/prompts/wizard",
    "/skills/new",
    "/workflows/new",
    "/prompt-kits/new",
    "/create-from-menerio",
  ];
  if (
    authed.some((a) => p.startsWith(a)) ||
    p.endsWith("/edit") ||
    p.endsWith("/versions")
  ) {
    return "in-page-auth-check";
  }
  return "public";
}

const generated = existsSync(ROUTE_TREE);
if (!generated && !existsSync(APP_TSX)) {
  console.error(
    "Neither src/routeTree.gen.ts nor src/App.tsx exists. Nothing to read.",
  );
  process.exit(2);
}

// /__* paths are migration scaffolding, not product routes. They are kept out of the
// inventory so routes.txt stays a clean before/after diff of the real URL surface.
const routes = (generated ? parseRouteTree() : parseAppTsx())
  .filter((r) => !r.path.startsWith("/__"))
  .map((r) => ({ ...r, guard: classifyGuard(r) }));

mkdirSync(here, { recursive: true });
writeFileSync(
  resolve(here, "routes.json"),
  JSON.stringify(
    {
      generatedFrom: generated ? "src/routeTree.gen.ts" : "src/App.tsx",
      count: routes.length,
      routes,
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  resolve(here, "routes.txt"),
  routes
    .map((r) => r.path)
    .sort()
    .join("\n") + "\n",
);

const byGuard = routes.reduce(
  (acc, r) => ((acc[r.guard] = (acc[r.guard] ?? 0) + 1), acc),
  {},
);
console.log(`source: ${generated ? "src/routeTree.gen.ts" : "src/App.tsx"}`);
console.log(`routes: ${routes.length}`);
console.log(`parameterised: ${routes.filter((r) => r.params.length).length}`);
console.log(`by guard: ${JSON.stringify(byGuard)}`);
const unknown = routes.filter((r) => r.loading === "unknown");
if (unknown.length)
  console.log(
    `UNRESOLVED elements: ${unknown.map((r) => r.element).join(", ")}`,
  );
