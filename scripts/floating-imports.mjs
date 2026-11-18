// Finds imports in the edge functions whose version is a range, not a release.
//
// Issue #12: `https://esm.sh/@supabase/supabase-js@2` meant whatever 2.x esm.sh
// answered with on the day, and its type definitions decide most of the errors
// scripts/deno-check.mjs counts. CI starts with an empty Deno cache, so two runs
// of the same code minutes apart counted 53 and 9, and the ratchet asked to
// bank 9. A count is only comparable when every remote import names an exact
// version, so scripts/deno-check.mjs refuses to count while one does not. That
// covers the import maps in each function's deno.json as well as the sources.
// It covers only the imports the code names; what those modules resolve below
// them is held by scripts/deno-check-graph.json.

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const REMOTE =
  /^(?:https:\/\/esm\.sh\/|npm:|jsr:)((?:@[^/@]+\/)?[^/@?]+)(?:@([^/?]*))?/;
const EXACT = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SPECIFIER = /\b(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

function floats(specifier) {
  const remote = REMOTE.exec(specifier);
  return remote !== null && !EXACT.test(remote[2] ?? "");
}

export function floatingSpecifiers(source) {
  return [...source.matchAll(SPECIFIER)]
    .map(([, specifier]) => specifier)
    .filter(floats);
}

export function floatingMapEntries(denoJsonText) {
  const imports = JSON.parse(denoJsonText).imports ?? {};
  return Object.values(imports).filter(
    (target) => typeof target === "string" && floats(target),
  );
}

export function findFloatingImports(dir, root = dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const where = relative(root, path).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      found.push(...findFloatingImports(path, root));
    } else if (entry.name.endsWith(".ts")) {
      for (const specifier of floatingSpecifiers(readFileSync(path, "utf8"))) {
        found.push(`${where}  ${specifier}`);
      }
    } else if (entry.name === "deno.json") {
      for (const specifier of floatingMapEntries(readFileSync(path, "utf8"))) {
        found.push(`${where}  ${specifier}`);
      }
    }
  }
  return found;
}
