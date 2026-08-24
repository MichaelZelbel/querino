// Compares two screenshot directories by content hash.
//
//   node migration/compare-shots.mjs baseline after-prep
//
// Hash equality is proof of an identical image. Inequality is not proof of a
// regression: these pages load live data, so timestamps, ordering and how far a query
// got before the shot was taken all move pixels on their own. Run the same directory
// against a repeat of itself first to learn that noise floor, then read any comparison
// against it.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [aName, bName] = process.argv.slice(2);
if (!aName || !bName) {
  console.error("usage: node migration/compare-shots.mjs <dirA> <dirB>");
  process.exit(2);
}

const dirA = resolve(here, aName);
const dirB = resolve(here, bName);
for (const d of [dirA, dirB]) {
  if (!existsSync(d)) {
    console.error(`missing directory: ${d}`);
    process.exit(2);
  }
}

const hash = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const shots = (d) => new Set(readdirSync(d).filter((f) => f.endsWith(".png")));

const a = shots(dirA);
const b = shots(dirB);

const onlyA = [...a].filter((f) => !b.has(f));
const onlyB = [...b].filter((f) => !a.has(f));
const common = [...a].filter((f) => b.has(f)).sort();

const differing = [];
for (const f of common) {
  const pa = join(dirA, f);
  const pb = join(dirB, f);
  if (hash(pa) !== hash(pb)) {
    differing.push({
      file: f,
      bytesA: statSync(pa).size,
      bytesB: statSync(pb).size,
    });
  }
}

console.log(`${aName} -> ${bName}`);
console.log(
  `  identical: ${common.length - differing.length}/${common.length}`,
);
if (onlyA.length) console.log(`  only in ${aName}: ${onlyA.join(", ")}`);
if (onlyB.length) console.log(`  only in ${bName}: ${onlyB.join(", ")}`);
if (differing.length) {
  console.log(`  differing: ${differing.length}`);
  for (const d of differing) {
    const delta = d.bytesB - d.bytesA;
    console.log(
      `    ${d.file}  ${d.bytesA} -> ${d.bytesB} bytes (${delta >= 0 ? "+" : ""}${delta})`,
    );
  }
}
process.exitCode = differing.length || onlyA.length || onlyB.length ? 1 : 0;
