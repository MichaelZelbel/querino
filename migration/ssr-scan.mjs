// Classifies every browser-global access in src/ by WHEN it runs, because that is the
// only thing that decides whether SSR breaks on it.
//
// A grep says "37 files touch window or localStorage" and sounds alarming. What matters
// is the much smaller set that runs at module import or during render, since those are
// the ones the server executes. Everything inside an effect or an event handler is
// already client-only and needs nothing.
//
//   node migration/ssr-scan.mjs            summary
//   node migration/ssr-scan.mjs --all      every occurrence
import ts from "typescript";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const srcDir = join(repo, "src");

const GLOBALS = new Set([
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "history",
  "matchMedia",
]);

const EFFECT_HOOKS = new Set([
  "useEffect",
  "useLayoutEffect",
  "useCallback",
  "useMemo",
  "useInsertionEffect",
]);

function walkFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, acc);
    else if (/\.tsx?$/.test(p)) acc.push(p);
  }
  return acc;
}

const isFunctionLike = (n) =>
  ts.isFunctionDeclaration(n) ||
  ts.isFunctionExpression(n) ||
  ts.isArrowFunction(n) ||
  ts.isMethodDeclaration(n) ||
  ts.isConstructorDeclaration(n) ||
  ts.isGetAccessor(n) ||
  ts.isSetAccessor(n);

// A component render body: a function whose name is capitalised, or one that returns JSX.
function looksLikeComponent(fn) {
  const name =
    fn.name?.getText?.() ??
    (ts.isVariableDeclaration(fn.parent)
      ? fn.parent.name.getText()
      : undefined);
  if (name && /^[A-Z]/.test(name)) return true;
  let returnsJsx = false;
  const visit = (n) => {
    if (
      ts.isJsxElement(n) ||
      ts.isJsxSelfClosingElement(n) ||
      ts.isJsxFragment(n)
    )
      returnsJsx = true;
    if (!isFunctionLike(n) || n === fn) ts.forEachChild(n, visit);
  };
  ts.forEachChild(fn, visit);
  return returnsJsx;
}

// How the innermost enclosing function is reached decides when it runs.
function classifyFunction(fn) {
  const parent = fn.parent;
  if (ts.isCallExpression(parent)) {
    const callee = parent.expression.getText();
    if (EFFECT_HOOKS.has(callee))
      return callee === "useMemo"
        ? "render-path (useMemo)"
        : "effect-or-callback";
    if (callee === "useState") return "render-path (useState initialiser)";
    if (
      /^(then|catch|finally|addEventListener|setTimeout|setInterval)$/.test(
        callee.split(".").pop() ?? "",
      )
    )
      return "async-or-listener";
  }
  if (
    ts.isJsxExpression(parent) &&
    parent.parent &&
    ts.isJsxAttribute(parent.parent)
  )
    return "event-handler";
  if (looksLikeComponent(fn)) return "render-path (component body)";
  return "helper-function";
}

const findings = [];

for (const file of walkFiles(srcDir)) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  // A file-level `typeof window === "undefined"` is the guard everything here uses.
  const fileGuarded = /typeof\s+window\s*===?\s*["']undefined["']/.test(text);

  const visit = (node) => {
    if (ts.isIdentifier(node) && GLOBALS.has(node.text)) {
      // Skip property names and declarations of the same word (obj.window, { window: ... }).
      const p = node.parent;
      const isPropertyAccess =
        ts.isPropertyAccessExpression(p) && p.name === node;
      const isPropertyName = ts.isPropertyAssignment(p) && p.name === node;
      const isBinding =
        ts.isBindingElement(p) ||
        ts.isParameter(p) ||
        ts.isVariableDeclaration(p);
      if (!isPropertyAccess && !isPropertyName && !isBinding) {
        let fn = node.parent;
        while (fn && !isFunctionLike(fn)) fn = fn.parent;
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        // A guard on the same line or the two above it counts as local, not just file-wide.
        const lines = text.split(/\r?\n/);
        const near = lines.slice(Math.max(0, line - 3), line + 1).join("\n");
        const locallyGuarded =
          /typeof\s+window\s*===?\s*["']undefined["']|typeof\s+window\s*!==?\s*["']undefined["']/.test(
            near,
          );
        findings.push({
          file: relative(repo, file).replace(/\\/g, "/"),
          line: line + 1,
          global: node.text,
          when: fn ? classifyFunction(fn) : "MODULE SCOPE",
          guarded: locallyGuarded || fileGuarded,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const risky = (f) =>
  f.when === "MODULE SCOPE" || f.when.startsWith("render-path");
const unguardedRisky = findings.filter((f) => risky(f) && !f.guarded);

writeFileSync(
  join(here, "ssr-scan.json"),
  JSON.stringify(
    { total: findings.length, unguardedRisky: unguardedRisky.length, findings },
    null,
    2,
  ) + "\n",
);

const byWhen = findings.reduce(
  (a, f) => ((a[f.when] = (a[f.when] ?? 0) + 1), a),
  {},
);
console.log(
  `occurrences: ${findings.length} across ${new Set(findings.map((f) => f.file)).size} files`,
);
for (const [k, v] of Object.entries(byWhen).sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(v).padStart(3)}  ${k}`);
console.log(
  `\nruns on the server (module scope or render path): ${findings.filter(risky).length}`,
);
console.log(`of those, unguarded: ${unguardedRisky.length}`);
for (const f of unguardedRisky)
  console.log(`  ${f.file}:${f.line}  ${f.global}  [${f.when}]`);

if (process.argv.includes("--all")) {
  console.log("\nall occurrences:");
  for (const f of findings)
    console.log(
      `  ${f.file}:${f.line}  ${f.global}  [${f.when}]${f.guarded ? " guarded" : ""}`,
    );
}
