#!/usr/bin/env node
/**
 * The outside check for the public pages: does the FIRST response carry the text?
 *
 * Written because "every public artifact page renders on the server" was declared
 * fixed on 2026-09-16 and nobody fetched a page afterwards. The fix was right and it
 * was never published, so querino.ai kept answering with an empty body for days. A
 * build passing proves nothing about what a crawler receives; only a fetch does.
 *
 * It asks the way a search engine's page reader asks (no scripts run, a crawler user
 * agent), reads the sitemap of the origin under test, and for every prompt, skill and
 * workflow page checks three things in the raw HTML:
 *   1. the body has readable text (scripts and styles removed),
 *   2. React's "this part failed on the server" marker is absent,
 *   3. the page's own <title> text appears again inside the body (the real heading).
 * It also checks that /prompts, /skills and /workflows link to every page of their kind
 * with an ordinary <a href>, and that no page ships the embedding vector.
 *
 *   node scripts/check-public-pages.mjs                      # https://querino.ai
 *   node scripts/check-public-pages.mjs http://localhost:8792
 *
 * Exit code 0 only when every page passes. Not part of `npm run check`: it needs the
 * network and a deployed (or locally served) build.
 */

const origin = (process.argv[2] || "https://querino.ai").replace(/\/+$/, "");
const UA =
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const KINDS = ["prompts", "skills", "workflows"];
const EMPTY_MARKER = "<!--$!-->";

const get = async (url) => {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  return { status: res.status, text: await res.text() };
};

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'");

function visibleBody(html) {
  const body = html.slice(Math.max(0, html.indexOf("<body")));
  return decode(
    body
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

const sitemap = await get(`${origin}/sitemap.xml`);
if (sitemap.status !== 200) {
  console.error(`sitemap answered ${sitemap.status}`);
  process.exit(1);
}
// The sitemap always names the canonical origin; test the same paths on the origin asked for.
const paths = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(decode(m[1])).pathname)
  .filter((p) => KINDS.some((k) => p.startsWith(`/${k}/`)));

const failures = [];
let readable = 0;

for (let i = 0; i < paths.length; i += 8) {
  await Promise.all(
    paths.slice(i, i + 8).map(async (path) => {
      const { status, text } = await get(origin + path);
      const title = decode(
        (text.match(/<title>([^<]*)<\/title>/) || [])[1] || "",
      )
        .replace(/\s*\|\s*Querino\s*$/, "")
        .trim();
      const body = visibleBody(text);
      const problems = [];
      if (status !== 200) problems.push(`status ${status}`);
      if (text.includes(EMPTY_MARKER)) problems.push("server render gave up");
      if (body.length < 200)
        problems.push(`only ${body.length} readable characters`);
      if (!title || !body.includes(title))
        problems.push("title not in the body");
      if (/embedding:"\[/.test(text))
        problems.push("embedding vector in the page");
      if (problems.length) failures.push(`${path}: ${problems.join(", ")}`);
      else readable += 1;
    }),
  );
}

console.log(
  `${origin}: ${readable} of ${paths.length} artifact pages readable without scripts`,
);

for (const kind of KINDS) {
  const wanted = paths.filter((p) => p.startsWith(`/${kind}/`));
  const { status, text } = await get(`${origin}/${kind}`);
  const hrefs = new Set(
    [...text.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => decode(m[1])),
  );
  const missing = wanted.filter((p) => !hrefs.has(p));
  console.log(
    `/${kind}: status ${status}, links to ${wanted.length - missing.length} of ${wanted.length}`,
  );
  if (status !== 200 || missing.length)
    failures.push(
      `/${kind}: status ${status}, ${missing.length} pages not linked`,
    );
}

if (failures.length) {
  console.error(`\n${failures.length} problems:`);
  for (const line of failures.slice(0, 40)) console.error(`  ${line}`);
  process.exit(1);
}
console.log("all good");
