import { assert, assertEquals } from "@std/assert";
import { frameGuardHeaders } from "@/lib/securityHeaders.ts";

const HEADER_NAMES = [
  "Content-Security-Policy",
  "Permissions-Policy",
  "X-Frame-Options",
];

// Until 2026-09-30 no page said anything about being framed.
Deno.test("a production page refuses to be framed", () => {
  const headers = frameGuardHeaders(
    "https://querino.ai/settings",
    "text/html; charset=utf-8",
  );
  assertEquals(Object.keys(headers), HEADER_NAMES);
  assertEquals(headers["X-Frame-Options"], "DENY");
  assert(
    headers["Content-Security-Policy"].includes("frame-ancestors 'none'"),
    headers["Content-Security-Policy"],
  );
  assertEquals(
    Object.keys(frameGuardHeaders("https://www.querino.ai/", "text/html")),
    HEADER_NAMES,
  );
});

// 2026-10-07: the policy said frame-ancestors and nothing else.
Deno.test(
  "no plugins, no foreign <base>, and no script-src that would break hydration",
  () => {
    const csp = frameGuardHeaders("https://querino.ai/", "text/html")[
      "Content-Security-Policy"
    ];
    const directives = csp.split(";").map((d) => d.trim());
    assert(directives.includes("object-src 'none'"), csp);
    assert(directives.includes("base-uri 'self'"), csp);
    // TanStack Start's inline hydration scripts carry no nonce; see the comment
    // in securityHeaders.ts before changing either of these.
    assert(!directives.some((d) => d.startsWith("script-src")), csp);
    assert(!directives.some((d) => d.startsWith("default-src")), csp);
  },
);

Deno.test("device features are switched off, the clipboard is not", () => {
  const policy = frameGuardHeaders("https://querino.ai/", "text/html")[
    "Permissions-Policy"
  ];
  const features = policy.split(",").map((f) => f.trim());
  for (const feature of [
    "camera",
    "microphone",
    "geolocation",
    "payment",
    "usb",
  ]) {
    assert(
      features.includes(`${feature}=()`),
      `${feature} is not off: ${policy}`,
    );
  }
  // Every artifact page has a Copy button.
  assert(!policy.includes("clipboard"), policy);
});

Deno.test("behind a proxy the forwarded host decides", () => {
  assertEquals(
    Object.keys(
      frameGuardHeaders("https://internal.workers.dev/", "text/html", [
        "internal.workers.dev",
        "querino.ai:443, proxy.example",
      ]),
    ),
    HEADER_NAMES,
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
