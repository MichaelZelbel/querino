// Tests for scripts/check-page-headings.mjs, run by `npm run test:scripts`.
// Each test writes a tiny project (src/routes + src/pages + src/components)
// into a temp folder and checks what the script says about it, plus one run
// against this repository's own routes.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkPageHeadings } from "../../scripts/check-page-headings.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..");
const SCRIPT = path.join(REPO, "scripts", "check-page-headings.mjs");

function project(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "page-headings-"));
  for (const [rel, text] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  }
  return root;
}

// One route at /x whose component is the default export of src/pages/X.tsx.
const route = `
import { createFileRoute } from "@tanstack/react-router";
import X from "@/pages/X";
export const Route = createFileRoute("/x")({ component: X });
`;

const layout = `
export function Layout({ title, children }: { title: string; children: React.ReactNode }) {
  return (<main><h1>{title}</h1>{children}</main>);
}
export function Shell({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <div>{children}</div>;
}
`;

function check(page) {
  return checkPageHeadings(
    project({
      "src/routes/x.tsx": route,
      "src/pages/X.tsx": page,
      "src/components/Layout.tsx": layout,
    }),
  );
}

test("every state with one <h1>, a loading state, a redirect and a null return pass", () => {
  const { pages, problems } = check(`
import { Loader2 } from "lucide-react";
import { Navigate } from "@/lib/router-compat";
import { Layout, Shell } from "@/components/Layout";
export default function X({ a, b, c }) {
  if (a) return <Shell><Loader2 className="animate-spin" /></Shell>;
  if (b) return <Navigate to="/auth" />;
  if (c) return null;
  let body;
  if (a) body = <h1>Not found</h1>;
  else body = <h1>Found</h1>;
  if (b) return <Shell>{body}</Shell>;
  return <Layout title="X">{c ? <p>one</p> : <p>two</p>}</Layout>;
}
`);
  assert.deepEqual(problems, []);
  assert.equal(pages.length, 1);
});

test("a state with no <h1> fails and names the line of its return", () => {
  const { problems } = check(`
export default function X({ missing }) {
  if (missing) {
    return <main><p>Team not found or you don't have access.</p></main>;
  }
  return <main><h1>Team</h1></main>;
}
`);
  assert.equal(problems.length, 1, problems.join("\n"));
  assert.match(problems[0], /src\/pages\/X\.tsx:4 can render no <h1>/);
});

test("a second <h1> next to the layout's one fails", () => {
  const { problems } = check(`
import { Layout } from "@/components/Layout";
export default function X() {
  return <Layout title="Posts"><h1>Posts</h1></Layout>;
}
`);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /can render two or more <h1>/);
});

test("an <h1> behind && fails both ways: alone it can be missing, next to another it can double", () => {
  const alone = check(`
export default function X({ ok }) {
  return <main>{ok && <h1>Settings</h1>}</main>;
}
`);
  assert.match(alone.problems.join("\n"), /can render no <h1>/);
  const doubled = check(`
export default function X({ ok }) {
  return <main><h1>Settings</h1>{ok && <h1>Saved</h1>}</main>;
}
`);
  assert.match(doubled.problems.join("\n"), /can render two or more <h1>/);
});

test("an <h1> inside .map() counts as many", () => {
  const { problems } = check(`
export default function X({ items }) {
  return <main><h1>List</h1>{items.map((i) => <h1 key={i}>{i}</h1>)}</main>;
}
`);
  assert.match(problems.join("\n"), /two or more <h1>/);
});

test("one branch of a local variable without an <h1> fails", () => {
  const { problems } = check(`
export default function X({ state }) {
  let body;
  if (state === "error") body = <h1>Couldn't join</h1>;
  else body = <p>Join this team?</p>;
  return <main>{body}</main>;
}
`);
  assert.match(problems.join("\n"), /can render no <h1>/);
});

test("a component that returns null inside a page does not excuse the page", () => {
  const { problems } = check(`
import { Shell } from "@/components/Layout";
export default function X() {
  return <main><Shell>{null}</Shell><p>No heading here</p></main>;
}
`);
  assert.match(problems.join("\n"), /can render no <h1>/);
});

test("the root route's notFoundComponent is a page; its frame component is not", () => {
  const root = project({
    "src/routes/__root.tsx": `
import NotFound from "@/pages/NotFound";
function RootComponent() { return <div><Outlet /></div>; }
export const Route = createRootRoute({ component: RootComponent, notFoundComponent: NotFound });
`,
    "src/pages/NotFound.tsx": `export default function NotFound() { return <main><p>404</p></main>; }`,
  });
  const { pages, problems } = checkPageHeadings(root);
  assert.deepEqual(pages, ["src/routes/__root.tsx notFoundComponent"]);
  assert.match(problems.join("\n"), /NotFound\.tsx:1 can render no <h1>/);
});

test("this repository's routed pages pass, and the CLI exits 0", () => {
  const { pages, problems } = checkPageHeadings(REPO);
  assert.deepEqual(problems, []);
  assert.ok(pages.length > 50, `only ${pages.length} pages found`);
  const run = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /render exactly one <h1>/);
});

test("the CLI exits 1 on a failing project", () => {
  const root = project({
    "src/routes/x.tsx": route,
    "src/pages/X.tsx": `export default function X() { return <main />; }`,
  });
  const run = spawnSync(process.execPath, [SCRIPT, root], { encoding: "utf8" });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /X\.tsx:1 can render no <h1>/);
});
