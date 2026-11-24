import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractPageSummary,
  fetchLinkPage,
  isPublicAddress,
  LINK_FETCH_MAX_BYTES,
  type LinkFetchDeps,
} from "./linkFetch.ts";

type Answer = {
  status: number;
  headers?: Record<string, string>;
  body?: BodyInit;
};

// A web of stub pages and a stub DNS, recording every request made.
function stubWeb(
  pages: Record<string, Answer>,
  dns: Record<string, string[]> = {},
) {
  const requests: { url: string; init: RequestInit }[] = [];
  const deps: LinkFetchDeps = {
    fetch: (url, init) => {
      requests.push({ url, init });
      const page = pages[url];
      if (!page) return Promise.reject(new TypeError("connection refused"));
      return Promise.resolve(
        new Response(page.body ?? null, {
          status: page.status,
          headers: page.headers,
        }),
      );
    },
    resolve: (host) => Promise.resolve(dns[host] ?? ["93.184.216.34"]),
  };
  return { deps, requests };
}

const html = (inner: string): Answer => ({
  status: 200,
  headers: { "content-type": "text/html; charset=utf-8" },
  body: `<html><head><title>Hello</title></head><body>${inner}</body></html>`,
});

Deno.test(
  "private, loopback, link-local and metadata addresses are refused on the first hop without a request",
  async () => {
    for (const url of [
      "http://127.0.0.1/",
      "http://10.0.0.1/",
      "http://172.16.5.4/",
      "http://192.168.0.1/",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "http://[fe80::1]/",
      "http://[fd00:ec2::254]/",
      "http://[::ffff:7f00:1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://2130706433/",
      "http://0x7f.1/",
      "http://169.254.169.254./",
      "http://localhost:8080/",
      "http://app.localhost/",
      "http://metadata.google.internal/",
    ]) {
      const { deps, requests } = stubWeb({});
      const page = await fetchLinkPage(url, deps);
      assertEquals(page.ok, false, url);
      assertEquals(requests.length, 0, url);
    }
  },
);

Deno.test(
  "a host name resolving to a private address is refused, also when only one of its addresses is",
  async () => {
    for (const records of [
      ["192.168.1.5"],
      ["93.184.216.34", "10.1.2.3"],
      ["fd12::1"],
    ]) {
      const { deps, requests } = stubWeb({}, { "evil.example": records });
      const page = await fetchLinkPage("https://evil.example/", deps);
      assertEquals(page, {
        ok: false,
        reason: "the address points to a private or local network",
      });
      assertEquals(requests.length, 0);
    }
  },
);

Deno.test("a host name with no address is unreachable", async () => {
  const { deps } = stubWeb({}, { "gone.example": [] });
  assertEquals(await fetchLinkPage("https://gone.example/", deps), {
    ok: false,
    reason: "the address could not be found",
  });
});

Deno.test(
  "a redirect to the metadata address or a private host is refused before it is requested",
  async () => {
    for (const target of [
      "http://169.254.169.254/latest/meta-data",
      "http://inside.example/admin",
    ]) {
      const { deps, requests } = stubWeb(
        {
          "https://public.example/": {
            status: 302,
            headers: { location: target },
          },
        },
        { "inside.example": ["10.0.0.2"] },
      );
      const page = await fetchLinkPage("https://public.example/", deps);
      assertEquals(page.ok, false, target);
      assertEquals(
        requests.map((r) => r.url),
        ["https://public.example/"],
      );
    }
  },
);

Deno.test("three redirects are followed and a fourth is refused", async () => {
  const chain = (hops: number) => {
    const pages: Record<string, Answer> = {};
    for (let i = 0; i < hops; i++) {
      pages[`https://a.example/${i}`] = {
        status: 301,
        headers: { location: `/${i + 1}` },
      };
    }
    pages[`https://a.example/${hops}`] = html("<p>landed</p>");
    return stubWeb(pages);
  };

  const three = chain(3);
  const ok = await fetchLinkPage("https://a.example/0", three.deps);
  assert(ok.ok);
  assertEquals(ok.finalUrl, "https://a.example/3");
  assertEquals(three.requests.length, 4);

  const four = chain(4);
  assertEquals(await fetchLinkPage("https://a.example/0", four.deps), {
    ok: false,
    reason: "the page redirected more than 3 times",
  });
  assertEquals(four.requests.length, 4);
});

Deno.test(
  "non-http schemes are refused, as the link and as a redirect target",
  async () => {
    for (const url of [
      "ftp://files.example/x",
      "javascript:alert(1)",
      "file:///etc/passwd",
      "data:text/html,hi",
    ]) {
      const first = stubWeb({});
      assertEquals(
        await fetchLinkPage(url, first.deps),
        { ok: false, reason: "only http and https addresses can be checked" },
        url,
      );
      assertEquals(first.requests.length, 0);

      const hop = stubWeb({
        "https://a.example/": { status: 302, headers: { location: url } },
      });
      assertEquals(
        await fetchLinkPage("https://a.example/", hop.deps),
        { ok: false, reason: "only http and https addresses can be checked" },
        url,
      );
      assertEquals(hop.requests.length, 1);
    }
  },
);

Deno.test(
  "a page that does not answer in time is cut off and unreachable",
  async () => {
    const deps: LinkFetchDeps = {
      resolve: () => Promise.resolve(["93.184.216.34"]),
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
      timeoutMs: 50,
    };
    const started = Date.now();
    const page = await fetchLinkPage("https://slow.example/", deps);
    assertEquals(page, {
      ok: false,
      reason: "the page did not answer in time",
    });
    assert(Date.now() - started < 2_000);
  },
);

Deno.test(
  "a large page is read only up to the size cap and still summarised",
  async () => {
    let pulled = 0;
    const chunk = new TextEncoder().encode("x".repeat(64 * 1024));
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("<title>Big</title><p>"));
      },
      pull(controller) {
        pulled += chunk.length;
        if (pulled > 1024 * 1024) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const { deps } = stubWeb({
      "https://big.example/": {
        status: 200,
        headers: { "content-type": "text/html" },
        body,
      },
    });
    const page = await fetchLinkPage("https://big.example/", deps);
    assert(page.ok);
    assertEquals(page.title, "Big");
    assert(
      pulled <= LINK_FETCH_MAX_BYTES + 2 * chunk.length,
      `pulled ${pulled}`,
    );
  },
);

Deno.test("an error status is unreachable and names the status", async () => {
  const { deps } = stubWeb({ "https://a.example/": { status: 404 } });
  assertEquals(await fetchLinkPage("https://a.example/", deps), {
    ok: false,
    reason: "the page answered 404",
  });
});

Deno.test(
  "no request carries credentials and none follows redirects by itself",
  async () => {
    const { deps, requests } = stubWeb({
      "https://a.example/": {
        status: 302,
        headers: { location: "https://b.example/" },
      },
      "https://b.example/": html("<p>hi</p>"),
    });
    await fetchLinkPage("https://a.example/", deps);
    assertEquals(requests.length, 2);
    for (const { init } of requests) {
      assertEquals(init.redirect, "manual");
      assertEquals(init.credentials, "omit");
      const headers = new Headers(init.headers);
      for (const name of ["cookie", "authorization", "apikey"]) {
        assertEquals(headers.has(name), false, name);
      }
    }
  },
);

Deno.test(
  "the summary is text only: scripts are dropped, title, description and visible text kept",
  () => {
    const summary = extractPageSummary(`
    <html><head><title>My &amp; Project</title>
    <meta name="description" content="A tool for &quot;writers&quot;">
    <script>document.write("SECRET SCRIPT")</script>
    <style>.x{color:red}</style></head>
    <body><!-- hidden comment --><h1>Welcome</h1>
    <script type="module">alert("also gone")</script>
    <p>Build   things&nbsp;fast &#8212; today.</p></body></html>`);
    assertEquals(summary.title, "My & Project");
    assertEquals(summary.description, 'A tool for "writers"');
    assertEquals(summary.excerpt, "Welcome Build things fast — today.");
  },
);

Deno.test("og:description stands in for a missing meta description", () => {
  const summary = extractPageSummary(
    `<meta property="og:description" content='From OG'><p>x</p>`,
  );
  assertEquals(summary.description, "From OG");
});

Deno.test(
  "a fetched page reports its final domain and content type",
  async () => {
    const { deps } = stubWeb({
      "https://www.example.com/": html("<p>Visible words</p>"),
    });
    const page = await fetchLinkPage("https://www.example.com/", deps);
    assert(page.ok);
    assertEquals(page.finalDomain, "www.example.com");
    assertEquals(page.contentType, "text/html");
    assertStringIncludes(page.excerpt, "Visible words");
  },
);

Deno.test(
  "public addresses are accepted, and IPv6 forms carrying a private IPv4 address are not",
  () => {
    for (const ip of [
      "93.184.216.34",
      "8.8.8.8",
      "2606:2800:220:1::1",
      "2a00:1450:4001:82a::200e",
    ]) {
      assertEquals(isPublicAddress(ip), true, ip);
    }
    for (const ip of [
      "::",
      "::1",
      "::ffff:10.0.0.1",
      "::ffff:a00:1",
      "64:ff9b::a9fe:a9fe",
      "2002:7f00:1::",
      "fec0::1",
      "ff02::1",
      "2001:db8::1",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "fe80::1%eth0",
      "not an address",
    ]) {
      assertEquals(isPublicAddress(ip), false, ip);
    }
  },
);
