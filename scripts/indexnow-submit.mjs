#!/usr/bin/env node
/**
 * Tell IndexNow (Bing, and the engines that share its feed) which public pages exist.
 *
 * IndexNow needs no account: the site proves ownership by serving a key file, here
 * public/<key>.txt, and a POST names the changed URLs.
 *
 * The order is fixed and this script enforces it. A page is submitted only if a crawler
 * would find its text in the first response. Inviting Bing to 107 empty pages is worse
 * than not inviting it, and the pages were empty on querino.ai until the server-render
 * fix was actually published. So before anything is sent this checks, on the live site:
 *   1. the key file answers 200 with exactly the key,
 *   2. each URL answers 200, without React's "server render gave up" marker, with
 *      readable body text.
 * URLs that fail are listed and left out. If the key file is missing nothing is sent.
 *
 * What a good answer means: 200 or 202 is "received", nothing more. There are public
 * reports of accepted submissions for weeks with nothing listed. The outside read is
 * Bing as a source of visitors in the analytics a month later, and it may stay at zero.
 *
 *   node scripts/indexnow-submit.mjs            # check, then submit
 *   node scripts/indexnow-submit.mjs --dry-run  # check only, send nothing
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "querino.ai";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const UA =
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const dryRun = process.argv.includes("--dry-run");

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const keyFile = readdirSync(publicDir).find((f) =>
  /^[0-9a-f]{32}\.txt$/.test(f),
);
if (!keyFile) {
  console.error("no key file in public/ (32 hex characters, .txt)");
  process.exit(1);
}
const key = readFileSync(join(publicDir, keyFile), "utf8").trim();
if (`${key}.txt` !== keyFile) {
  console.error("the key file's name and its content disagree");
  process.exit(1);
}
const keyLocation = `${ORIGIN}/${keyFile}`;

const get = async (url) => {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  return { status: res.status, text: await res.text() };
};

const live = await get(keyLocation);
if (live.status !== 200 || live.text.trim() !== key) {
  console.error(
    `the key file is not live yet (${keyLocation} answered ${live.status}); nothing sent`,
  );
  process.exit(1);
}

const sitemap = await get(`${ORIGIN}/sitemap.xml`);
if (sitemap.status !== 200) {
  console.error(`sitemap answered ${sitemap.status}; nothing sent`);
  process.exit(1);
}
const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(/&amp;/g, "&"))
  .filter((u) => new URL(u).host === HOST);

const readableText = (html) =>
  html
    .slice(Math.max(0, html.indexOf("<body")))
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ready = [];
const held = [];
for (let i = 0; i < urls.length; i += 8) {
  await Promise.all(
    urls.slice(i, i + 8).map(async (url) => {
      const { status, text } = await get(url);
      const ok =
        status === 200 &&
        !text.includes("<!--$!-->") &&
        readableText(text).length >= 200;
      (ok ? ready : held).push(url);
    }),
  );
}

console.log(
  `${ready.length} of ${urls.length} pages are readable without scripts`,
);
if (held.length) {
  console.log(`held back, not submitted (${held.length}):`);
  for (const url of held.slice(0, 20)) console.log(`  ${url}`);
}
if (!ready.length) {
  console.error("nothing readable, nothing sent");
  process.exit(1);
}
if (dryRun) {
  console.log("dry run: nothing sent");
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation, urlList: ready }),
});
const answer = (await res.text()).slice(0, 300);
console.log(
  `IndexNow answered ${res.status}${answer ? `: ${answer}` : ""} for ${ready.length} URLs`,
);
console.log(
  res.status === 200 || res.status === 202
    ? "received. That is all this proves; it does not mean listed."
    : "not accepted",
);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
