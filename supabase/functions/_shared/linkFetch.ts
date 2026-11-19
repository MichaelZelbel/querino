// The one request Querino makes to a creator's link before showing it (#47).
//
// The address is the author's, so the request is the author's too: without a
// guard it is a way to make the edge runtime fetch whatever they like, the
// cloud metadata service at 169.254.169.254 included. So every hop, the first
// and each redirect, is parsed, held to http/https and resolved, and refused
// when any address it resolves to is not on the public internet. Redirects are
// followed by hand (`redirect: "manual"`), because a followed redirect has
// already been requested by the time anyone could look at it.
//
// Known limit: the guard resolves the name and fetch resolves it again, so a
// hostile DNS server could answer differently in between (DNS rebinding). Deno
// gives no way to pin the address of an HTTPS request. What that buys is one
// GET without credentials whose answer only feeds the classifier and is never
// shown to anyone.
//
// The page is read as text and never executed: the classifier gets its title,
// meta description and a short excerpt of the visible text.

export const LINK_FETCH_TIMEOUT_MS = 5_000;
export const LINK_FETCH_MAX_BYTES = 300 * 1024;
export const LINK_MAX_REDIRECTS = 3;
export const LINK_EXCERPT_CHARS = 1_500;
const LINK_SUMMARY_FIELD_CHARS = 300;

const USER_AGENT = "QuerinoLinkCheck/1.0 (+https://querino.ai)";
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

export type LinkPage =
  | {
      ok: true;
      finalUrl: string;
      finalDomain: string;
      contentType: string;
      title: string;
      description: string;
      excerpt: string;
    }
  // `reason` is shown to the author, so it never quotes the response.
  | { ok: false; reason: string };

export interface LinkFetchDeps {
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  /** Every A and AAAA address of a host name; empty when it has none. */
  resolve?: (host: string, signal: AbortSignal) => Promise<string[]>;
  timeoutMs?: number;
}

class Refused extends Error {}

// ---------------------------------------------------------------- addresses

function parseIPv4(ip: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

/** The eight 16-bit groups of an IPv6 address, or null. A zone id is refused. */
function parseIPv6(ip: string): number[] | null {
  if (ip.includes("%")) return null;
  // A dotted IPv4 tail (::ffff:127.0.0.1) is the last two groups.
  const lastColon = ip.lastIndexOf(":");
  const v4 = parseIPv4(ip.slice(lastColon + 1));
  const text =
    v4 === null
      ? ip
      : `${ip.slice(0, lastColon + 1)}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const groups = (s: string) => (s === "" ? [] : s.split(":"));
  const head = groups(halves[0]);
  const tail = halves.length === 2 ? groups(halves[1]) : [];
  const fill = 8 - head.length - tail.length;
  if (halves.length === 1 ? fill !== 0 : fill < 1) return null;
  const all = [...head, ...new Array(fill).fill("0"), ...tail];
  if (!all.every((g) => /^[0-9a-f]{1,4}$/i.test(g))) return null;
  return all.map((g) => parseInt(g, 16));
}

const PRIVATE_IPV4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isPublicIPv4(addr: number): boolean {
  return PRIVATE_IPV4.every(([base, bits]) => {
    const mask = (~0 << (32 - bits)) >>> 0;
    return (addr & mask) >>> 0 !== ((parseIPv4(base) as number) & mask) >>> 0;
  });
}

/**
 * Whether an address is on the public internet. Private, loopback,
 * link-local, metadata, documentation, multicast and reserved ranges are not,
 * and neither is anything that does not parse. An IPv6 address that carries an
 * IPv4 one (mapped, compatible, NAT64, 6to4) is judged by that IPv4 address.
 */
export function isPublicAddress(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, "");
  const v4 = parseIPv4(bare);
  if (v4 !== null) return isPublicIPv4(v4);
  const g = parseIPv6(bare);
  if (!g) return false;
  const embedded = (hi: number, lo: number) =>
    isPublicIPv4(((hi << 16) | lo) >>> 0);
  const zeroUpTo = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (zeroUpTo(5) && g[5] === 0xffff) return embedded(g[6], g[7]);
  if (zeroUpTo(6)) {
    if (g[6] === 0 && g[7] <= 1) return false; // :: and ::1
    return embedded(g[6], g[7]); // IPv4-compatible ::a.b.c.d
  }
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return embedded(g[6], g[7]);
  }
  if (g[0] === 0x2002) return embedded(g[1], g[2]);
  if ((g[0] & 0xfe00) === 0xfc00) return false; // fc00::/7 unique local
  if ((g[0] & 0xff80) === 0xfe80) return false; // fe80::/9 link- and site-local
  if ((g[0] & 0xff00) === 0xff00) return false; // ff00::/8 multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false; // documentation
  if (g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return false; // discard
  return true;
}

// ---------------------------------------------------------------- one hop

/** The parsed URL of a hop, or Refused with the reason the author is shown. */
export function checkHopUrl(raw: string, base?: string): URL {
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    throw new Refused("the address is not a valid web address");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Refused("only http and https addresses can be checked");
  }
  if (url.username || url.password) {
    throw new Refused("the address contains a user name or password");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost")) {
    throw new Refused("the address points to a private or local network");
  }
  return url;
}

async function defaultResolve(
  host: string,
  signal: AbortSignal,
): Promise<string[]> {
  const lookup = async (type: "A" | "AAAA") => {
    try {
      return await Deno.resolveDns(host, type, { signal });
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) return [];
      throw e;
    }
  };
  const [a, aaaa] = await Promise.all([lookup("A"), lookup("AAAA")]);
  return [...a, ...aaaa];
}

async function assertPublicHost(
  url: URL,
  resolve: (host: string, signal: AbortSignal) => Promise<string[]>,
  signal: AbortSignal,
): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const literal = parseIPv4(host) !== null || host.includes(":");
  const addresses = literal
    ? [host]
    : await resolve(host.replace(/\.$/, ""), signal);
  if (addresses.length === 0)
    throw new Refused("the address could not be found");
  if (!addresses.every(isPublicAddress)) {
    throw new Refused("the address points to a private or local network");
  }
}

async function readCapped(res: Response, max: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < max) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = max - total;
    chunks.push(value.length > room ? value.subarray(0, room) : value);
    total += Math.min(value.length, room);
  }
  await reader.cancel().catch(() => {});
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.length;
  }
  return new TextDecoder().decode(bytes);
}

// ---------------------------------------------------------------- the page

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi,
    (whole, name: string) => {
      const lower = name.toLowerCase();
      if (lower in ENTITIES) return ENTITIES[lower];
      if (lower.startsWith("#")) {
        const code = lower.startsWith("#x")
          ? parseInt(lower.slice(2), 16)
          : parseInt(lower.slice(1), 10);
        if (code > 0 && code <= 0x10ffff) return String.fromCodePoint(code);
      }
      return whole;
    },
  );
}

const clean = (s: string, max: number) =>
  decodeEntities(s).replace(/\s+/g, " ").trim().slice(0, max);

function metaContent(html: string, keys: string[]): string {
  for (const tag of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs: Record<string, string> = {};
    for (const a of tag[1].matchAll(
      /([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    )) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? "";
    }
    const key = (attrs.name ?? attrs.property ?? "").toLowerCase();
    if (keys.includes(key) && attrs.content) return attrs.content;
  }
  return "";
}

/** Title, meta description and visible-text excerpt of an HTML page, as text. */
export function extractPageSummary(html: string): {
  title: string;
  description: string;
  excerpt: string;
} {
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const description =
    metaContent(html, ["description"]) || metaContent(html, ["og:description"]);
  const visible = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(head|script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi,
      " ",
    )
    .replace(/<[^>]*>/g, " ");
  return {
    title: clean(title, LINK_SUMMARY_FIELD_CHARS),
    description: clean(description, LINK_SUMMARY_FIELD_CHARS),
    excerpt: clean(visible, LINK_EXCERPT_CHARS),
  };
}

/**
 * Fetches a creator's link once, behind the guard described at the top. Never
 * throws: anything that keeps the page from being read is `{ ok: false }`.
 */
export async function fetchLinkPage(
  rawUrl: string,
  deps: LinkFetchDeps = {},
): Promise<LinkPage> {
  const doFetch = deps.fetch ?? ((url, init) => fetch(url, init));
  const resolve = deps.resolve ?? defaultResolve;
  const timeoutMs = deps.timeoutMs ?? LINK_FETCH_TIMEOUT_MS;
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    let url = checkHopUrl(rawUrl);
    for (let redirects = 0; ; redirects++) {
      await assertPublicHost(url, resolve, signal);
      const res = await doFetch(url.href, {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        },
      });

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel().catch(() => {});
        if (redirects >= LINK_MAX_REDIRECTS) {
          throw new Refused(
            `the page redirected more than ${LINK_MAX_REDIRECTS} times`,
          );
        }
        url = checkHopUrl(location, url.href);
        continue;
      }
      if (res.status < 200 || res.status >= 300) {
        await res.body?.cancel().catch(() => {});
        throw new Refused(`the page answered ${res.status}`);
      }

      const contentType = (res.headers.get("content-type") ?? "")
        .split(";")[0]
        .trim()
        .toLowerCase();
      const body = await readCapped(res, LINK_FETCH_MAX_BYTES);
      const summary =
        contentType === "text/html" || contentType === "application/xhtml+xml"
          ? extractPageSummary(body)
          : {
              title: "",
              description: "",
              excerpt:
                contentType === "text/plain"
                  ? clean(body, LINK_EXCERPT_CHARS)
                  : "",
            };
      return {
        ok: true,
        finalUrl: url.href,
        finalDomain: url.hostname.toLowerCase(),
        contentType,
        ...summary,
      };
    }
  } catch (e) {
    if (e instanceof Refused) return { ok: false, reason: e.message };
    if (signal.aborted) {
      return { ok: false, reason: "the page did not answer in time" };
    }
    return { ok: false, reason: "the page could not be reached" };
  }
}
