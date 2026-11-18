#!/usr/bin/env node
// Every page reachable from src/routes/ renders exactly one <h1>.
//
// Screen-reader users jump by headings; a page without a main heading gives
// them nothing to land on, and a page with two gives them two. This check
// reads the source (no browser): for every route file it takes the page
// component (`component:`, `notFoundComponent:`, `errorComponent:`), follows
// the components it renders through `@/` imports and same-file functions, and
// works out every way one render can come out ("variant"):
//
//   - each `return` of a component is one variant;
//   - `a ? b : c` and a local variable assigned in several branches
//     (`let body; if (...) body = <A/>; else body = <B/>;`) fork the variant;
//   - `a && b` forks into "without b" and "with b". Write mutually exclusive
//     states as one `a ? b : c` chain (or one variable), not as sibling
//     `{s === "x" && ...}` blocks: the check cannot tell those exclude each
//     other.
//
// A page passes when each variant renders exactly one <h1>, with two kinds of
// variant that render nothing to read and so need none:
//   - a redirect: renders <Navigate>, or the page component itself returns
//     null (a component inside the page that returns null just renders
//     nothing);
//   - a loading state: renders no <h1> and shows a spinner or skeleton
//     (Loader2, Skeleton, animate-spin, animate-pulse).
// Anything else with no <h1>, and anything with two or more, fails.
//
// Usage: node scripts/check-page-headings.mjs [projectRoot]
// Exits 1 and prints one line per failing variant.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const MANY = 2; // counts are capped: 2 means "two or more"
const MAX_VARIANTS = 256;
const LOADING_TAGS = new Set(["Loader2", "Skeleton"]);
const LOADING_CLASSES = /\banimate-(spin|pulse)\b/;
const REDIRECT_TAGS = new Set(["Navigate"]);

export function checkPageHeadings(root) {
  const srcDir = path.join(root, "src");
  const routesDir = path.join(srcDir, "routes");
  const sources = new Map();
  const componentCache = new Map();

  function sourceFile(file) {
    if (!sources.has(file)) {
      const text = fs.readFileSync(file, "utf8");
      sources.set(
        file,
        ts.createSourceFile(
          file,
          text,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        ),
      );
    }
    return sources.get(file);
  }

  function resolveModule(spec) {
    if (!spec.startsWith("@/")) return null;
    const base = path.join(srcDir, spec.slice(2));
    for (const candidate of [
      base,
      `${base}.tsx`,
      `${base}.ts`,
      path.join(base, "index.tsx"),
      path.join(base, "index.ts"),
    ]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
        return candidate;
    }
    return null;
  }

  // shadcn/ui primitives render no <h1> of their own; treat them as wrappers.
  function isOpaqueModule(file) {
    return file.includes(`${path.sep}components${path.sep}ui${path.sep}`);
  }

  // Find the function that implements `name` in `sf`: a function declaration,
  // a const arrow/function, or forwardRef/memo(...) around one. `name` may be
  // "default" for the default export.
  function findLocalFunction(sf, name) {
    let found = null;
    const unwrap = (expr) => {
      while (expr) {
        if (ts.isParenthesizedExpression(expr) || ts.isAsExpression(expr)) {
          expr = expr.expression;
        } else if (ts.isCallExpression(expr) && expr.arguments.length > 0) {
          expr = expr.arguments[0]; // forwardRef(fn), memo(fn)
        } else break;
      }
      return expr && (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr))
        ? expr
        : null;
    };
    let defaultName = null;
    for (const stmt of sf.statements) {
      if (ts.isFunctionDeclaration(stmt) && stmt.body) {
        const isDefault = stmt.modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.DefaultKeyword,
        );
        if ((name === "default" && isDefault) || stmt.name?.text === name)
          found ??= stmt;
      } else if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (
            ts.isIdentifier(decl.name) &&
            decl.name.text === name &&
            decl.initializer
          ) {
            found ??= unwrap(decl.initializer);
          }
        }
      } else if (ts.isExportAssignment(stmt) && name === "default") {
        if (ts.isIdentifier(stmt.expression))
          defaultName = stmt.expression.text;
        else found ??= unwrap(stmt.expression);
      }
    }
    if (!found && defaultName) return findLocalFunction(sf, defaultName);
    return found;
  }

  // What a capitalised JSX tag (or called identifier) refers to: a function
  // in this file, an imported one under src/, or null (external or opaque).
  function resolveComponent(sf, name) {
    const local = findLocalFunction(sf, name);
    if (local) return { sf, fn: local, key: `${sf.fileName}#${name}` };
    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
      const file = resolveModule(stmt.moduleSpecifier.text);
      const clause = stmt.importClause;
      let imported = null;
      if (clause.name?.text === name) imported = "default";
      const bindings = clause.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) {
          if (el.name.text === name)
            imported = (el.propertyName ?? el.name).text;
        }
      }
      if (!imported) continue;
      if (!file || isOpaqueModule(file)) return null;
      const target = sourceFile(file);
      const fn = findLocalFunction(target, imported);
      return fn ? { sf: target, fn, key: `${file}#${imported}` } : null;
    }
    return null;
  }

  // A variant is { h1, loading, redirect }. Lists of variants combine as a
  // cross product when two parts render together.
  const EMPTY = { h1: 0, loading: false, redirect: false };
  const combine = (a, b) => {
    const out = [];
    const seen = new Set();
    for (const x of a) {
      for (const y of b) {
        const v = {
          h1: Math.min(MANY, x.h1 + y.h1),
          loading: x.loading || y.loading,
          redirect: x.redirect || y.redirect,
        };
        const key = `${v.h1}${+v.loading}${+v.redirect}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(v);
        }
        if (out.length >= MAX_VARIANTS) return out;
      }
    }
    return out;
  };
  const union = (...lists) => {
    const out = [];
    const seen = new Set();
    for (const v of lists.flat()) {
      const key = `${v.h1}${+v.loading}${+v.redirect}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(v);
      }
    }
    return out;
  };
  const sumAll = (lists) => lists.reduce((acc, l) => combine(acc, l), [EMPTY]);

  function enclosingFunction(node) {
    let n = node.parent;
    while (n && !ts.isFunctionLike(n)) n = n.parent;
    return n;
  }

  // Every value a local variable can hold when it is rendered: its
  // initializer and each plain assignment to it inside the same function.
  function localValues(sf, ident) {
    const fn = enclosingFunction(ident);
    if (!fn || !fn.body) return null;
    const name = ident.text;
    const values = [];
    let declared = false;
    const visit = (n) => {
      if (n !== fn && ts.isFunctionLike(n)) return; // not into callbacks
      if (
        ts.isVariableDeclaration(n) &&
        ts.isIdentifier(n.name) &&
        n.name.text === name
      ) {
        declared = true;
        if (n.initializer) values.push(n.initializer);
      } else if (
        ts.isBinaryExpression(n) &&
        n.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(n.left) &&
        n.left.text === name
      ) {
        values.push(n.right);
      }
      ts.forEachChild(n, visit);
    };
    visit(fn.body);
    return declared ? values : null;
  }

  function hasLoadingClass(attrs) {
    for (const attr of attrs.properties) {
      if (!ts.isJsxAttribute(attr) || attr.name.getText() !== "className")
        continue;
      if (attr.initializer && LOADING_CLASSES.test(attr.initializer.getText()))
        return true;
    }
    return false;
  }

  function tagName(tag) {
    return ts.isIdentifier(tag) ? tag.text : null;
  }

  function variantsOfJsx(sf, node, stack) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const children = ts.isJsxElement(node) ? node.children : [];
    const name = tagName(opening.tagName);
    let self = [EMPTY];
    if (name === "h1") self = [{ ...EMPTY, h1: 1 }];
    if (hasLoadingClass(opening.attributes))
      self = combine(self, [{ ...EMPTY, loading: true }]);
    if (name && LOADING_TAGS.has(name))
      self = combine(self, [{ ...EMPTY, loading: true }]);
    if (name && REDIRECT_TAGS.has(name))
      self = combine(self, [{ ...EMPTY, redirect: true }]);
    if (
      name &&
      /^[A-Z]/.test(name) &&
      !LOADING_TAGS.has(name) &&
      !REDIRECT_TAGS.has(name)
    ) {
      const target = resolveComponent(sf, name);
      if (target) self = combine(self, variantsOfComponent(target, stack));
    }
    // Props that carry JSX (title={<h1/>}, icon={...}) render with the element.
    const propParts = [];
    for (const attr of opening.attributes.properties) {
      if (
        ts.isJsxAttribute(attr) &&
        attr.initializer &&
        ts.isJsxExpression(attr.initializer)
      ) {
        if (
          attr.initializer.expression &&
          containsJsx(attr.initializer.expression)
        ) {
          propParts.push(variantsOf(sf, attr.initializer.expression, stack));
        }
      }
    }
    return sumAll([
      self,
      ...propParts,
      ...children.map((c) => variantsOf(sf, c, stack)),
    ]);
  }

  function containsJsx(node) {
    let found = false;
    const visit = (n) => {
      if (found) return;
      if (
        ts.isJsxElement(n) ||
        ts.isJsxSelfClosingElement(n) ||
        ts.isJsxFragment(n)
      ) {
        found = true;
        return;
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    return found;
  }

  function variantsOf(sf, node, stack) {
    if (!node) return [EMPTY];
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node)
    ) {
      return variantsOf(sf, node.expression, stack);
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      return variantsOfJsx(sf, node, stack);
    }
    if (ts.isJsxFragment(node)) {
      return sumAll(node.children.map((c) => variantsOf(sf, c, stack)));
    }
    if (ts.isJsxExpression(node)) return variantsOf(sf, node.expression, stack);
    if (ts.isConditionalExpression(node)) {
      return union(
        variantsOf(sf, node.whenTrue, stack),
        variantsOf(sf, node.whenFalse, stack),
      );
    }
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) {
        return union([EMPTY], variantsOf(sf, node.right, stack));
      }
      if (
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.QuestionQuestionToken
      ) {
        return union(
          variantsOf(sf, node.left, stack),
          variantsOf(sf, node.right, stack),
        );
      }
      return [EMPTY];
    }
    if (ts.isIdentifier(node)) {
      const values = localValues(sf, node);
      if (!values || values.length === 0) return [EMPTY];
      const key = `${sf.fileName}@${node.pos}`;
      if (stack.has(key)) return [EMPTY];
      stack.add(key);
      const out = union(...values.map((v) => variantsOf(sf, v, stack)));
      stack.delete(key);
      return out;
    }
    if (ts.isCallExpression(node)) {
      // list.map(item => <X/>): any <h1> inside repeats, so it counts as many.
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        node.arguments.length > 0
      ) {
        const cb = node.arguments[0];
        if (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) {
          const inner = variantsOfFunction(sf, cb, stack);
          return union(
            [EMPTY],
            inner.map((v) => ({ ...v, h1: v.h1 > 0 ? MANY : 0 })),
          );
        }
        return [EMPTY];
      }
      // renderSomething(): a function in this file that returns JSX.
      if (ts.isIdentifier(node.expression)) {
        const target = resolveComponent(sf, node.expression.text);
        if (target) return variantsOfComponent(target, stack);
      }
      return [EMPTY];
    }
    return [EMPTY];
  }

  // The returns of one function, each its own variant. A function that
  // returns nothing renderable contributes an empty variant.
  function returnsOf(fn) {
    if (!fn.body) return [];
    if (!ts.isBlock(fn.body)) return [fn.body];
    const out = [];
    const visit = (n) => {
      if (ts.isFunctionLike(n)) return;
      if (ts.isReturnStatement(n)) out.push(n.expression ?? null);
      ts.forEachChild(n, visit);
    };
    fn.body.statements.forEach(visit);
    return out;
  }

  function isNullish(expr) {
    return (
      !expr ||
      expr.kind === ts.SyntaxKind.NullKeyword ||
      (ts.isIdentifier(expr) && expr.text === "undefined")
    );
  }

  function variantsOfFunction(sf, fn, stack) {
    const parts = returnsOf(fn).map((r) =>
      isNullish(r) ? [EMPTY] : variantsOf(sf, r, stack),
    );
    return parts.length ? union(...parts) : [EMPTY];
  }

  function variantsOfComponent(target, stack) {
    if (componentCache.has(target.key)) return componentCache.get(target.key);
    if (stack.has(target.key)) return [EMPTY];
    stack.add(target.key);
    const result = variantsOfFunction(target.sf, target.fn, stack);
    stack.delete(target.key);
    componentCache.set(target.key, result);
    return result;
  }

  // A page's own returns are judged one by one, so the message can name the
  // line of the return that breaks the rule.
  function judgePage(target, label) {
    const problems = [];
    for (const r of returnsOf(target.fn)) {
      if (isNullish(r)) continue;
      const { line } = target.sf.getLineAndCharacterOfPosition(r.getStart());
      const where = `${path.relative(root, target.sf.fileName)}:${line + 1}`;
      for (const v of variantsOf(target.sf, r, new Set([target.key]))) {
        if (v.h1 === 1 || v.redirect) continue;
        if (v.h1 === 0 && v.loading) continue;
        problems.push(
          `${label}: ${where} can render ${v.h1 === 0 ? "no <h1>" : "two or more <h1>"}`,
        );
        break;
      }
    }
    return problems;
  }

  const problems = [];
  const pages = [];
  const routeFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx")) routeFiles.push(full);
    }
  };
  walk(routesDir);
  routeFiles.sort();

  for (const file of routeFiles) {
    const sf = sourceFile(file);
    const rel = path.relative(root, file);
    const visit = (n) => {
      if (
        ts.isPropertyAssignment(n) &&
        ["component", "notFoundComponent", "errorComponent"].includes(
          n.name.getText(),
        ) &&
        ts.isIdentifier(n.initializer)
      ) {
        const name = n.initializer.text;
        // The root route's component is the frame around every page (it
        // renders <Outlet/>), not a page of its own.
        if (!(
          path.basename(file) === "__root.tsx" &&
          n.name.getText() === "component"
        )) {
          const target = resolveComponent(sf, name);
          if (!target)
            problems.push(`${rel}: cannot find the component ${name}`);
          else {
            pages.push(`${rel} ${n.name.getText()}`);
            problems.push(...judgePage(target, `${rel} (${name})`));
          }
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return { pages, problems };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(
    process.argv[2] ??
      path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
  );
  const { pages, problems } = checkPageHeadings(root);
  if (problems.length) {
    console.error(
      `Page headings: ${problems.length} problem(s) in ${pages.length} routed page(s).`,
    );
    console.error(
      "Every page reachable from src/routes/ renders exactly one <h1> (see scripts/check-page-headings.mjs).",
    );
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(
    `Page headings: all ${pages.length} routed pages render exactly one <h1>.`,
  );
}
