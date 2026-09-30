import { assertEquals } from "@std/assert";
import { frameGuardHeaders } from "@/lib/securityHeaders.ts";

// Until 2026-09-30 no page said anything about being framed.
Deno.test("a production page refuses to be framed", () => {
  assertEquals(
    frameGuardHeaders(
      "https://querino.ai/settings",
      "text/html; charset=utf-8",
    ),
    {
      "Content-Security-Policy": "frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
    },
  );
  assertEquals(
    Object.keys(frameGuardHeaders("https://www.querino.ai/", "text/html")),
    ["Content-Security-Policy", "X-Frame-Options"],
  );
});

Deno.test("behind a proxy the forwarded host decides", () => {
  assertEquals(
    Object.keys(
      frameGuardHeaders("https://internal.workers.dev/", "text/html", [
        "internal.workers.dev",
        "querino.ai:443, proxy.example",
      ]),
    ),
    ["Content-Security-Policy", "X-Frame-Options"],
  );
});

Deno.test("the Lovable preview and non-HTML answers are left alone", () => {
  assertEquals(
    frameGuardHeaders(
      "https://id-preview--x.lovable.app/",
      "text/html; charset=utf-8",
    ),
    {},
  );
  assertEquals(
    frameGuardHeaders("https://querino.ai/rss.xml", "application/xml"),
    {},
  );
  assertEquals(frameGuardHeaders("not a url", "text/html"), {});
});
