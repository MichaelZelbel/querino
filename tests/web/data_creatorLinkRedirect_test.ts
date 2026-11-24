import { assertEquals } from "@std/assert";
import {
  answerCreatorLink,
  followCreatorLink,
  unfollowableGoPath,
  type CreatorLinkLookup,
} from "@/lib/creatorLinkRedirect.ts";

const ITEM = "11111111-2222-4333-8444-555555555555";

function stub(answer: Awaited<ReturnType<CreatorLinkLookup>>) {
  const asked: string[] = [];
  const lookup: CreatorLinkLookup = (id) => {
    asked.push(id);
    return Promise.resolve(answer);
  };
  return { lookup, asked };
}

function assertNoindex(res: Response) {
  assertEquals(res.headers.get("X-Robots-Tag"), "noindex");
  assertEquals(res.headers.get("Cache-Control"), "no-store");
}

Deno.test(
  "an approved link redirects to the stored address, with noindex",
  async () => {
    const { lookup, asked } = stub({
      data: "https://creator.example/page",
      error: null,
    });
    const res = await followCreatorLink(ITEM, lookup);
    assertEquals(res.status, 302);
    assertEquals(res.headers.get("Location"), "https://creator.example/page");
    assertNoindex(res);
    // The target comes from the stored row alone: the lookup is asked for the id
    // and nothing else, and no request is ever handed in.
    assertEquals(asked, [ITEM]);
  },
);

Deno.test("an item without an approved link answers 404", async () => {
  const res = await followCreatorLink(
    ITEM,
    stub({ data: null, error: null }).lookup,
  );
  assertEquals(res.status, 404);
  assertEquals(res.headers.get("Location"), null);
  assertNoindex(res);
});

Deno.test(
  "a malformed id answers 404 without asking the database",
  async () => {
    const { lookup, asked } = stub({ data: "https://x.example/", error: null });
    const res = await followCreatorLink("not-an-id", lookup);
    assertEquals(res.status, 404);
    assertEquals(asked, []);
    assertNoindex(res);
  },
);

Deno.test("a failed lookup answers 503", async () => {
  const res = await followCreatorLink(
    ITEM,
    stub({ data: null, error: { message: "boom" } }).lookup,
  );
  assertEquals(res.status, 503);
  assertNoindex(res);
});

Deno.test(
  "a stored address that is not http(s) is never followed",
  async () => {
    for (const stored of ["javascript:alert(1)", "not a url"]) {
      const res = await followCreatorLink(
        ITEM,
        stub({ data: stored, error: null }).lookup,
      );
      assertEquals(res.status, 404, stored);
    }
  },
);

const ADDRESS_SHAPED = [
  "/go/https://evil.example",
  "/go/http://evil.example",
  "/go/https:%2F%2Fevil.example",
  "/go/https:/evil.example",
  "/go//evil.example",
  "/go/%2F%2Fevil.example",
  "/go/https://evil.example/path?x=1",
];

Deno.test(
  "an address-shaped /go/ path answers 404 before the router, with no Location",
  () => {
    for (const path of ADDRESS_SHAPED) {
      const res = unfollowableGoPath(path);
      assertEquals(res?.status, 404, path);
      assertEquals(res?.headers.get("Location"), null, path);
      assertNoindex(res!);
    }
  },
);

Deno.test("a /go/ path that is not an id answers 404 before the router", () => {
  for (const path of ["/go/not-an-id", "/go/", `/go/${ITEM}/extra`]) {
    assertEquals(unfollowableGoPath(path)?.status, 404, path);
  }
});

Deno.test(
  "an item id, and every path outside /go/, is left to the router",
  () => {
    for (const path of [
      `/go/${ITEM}`,
      `/go/${ITEM}/`,
      `/go/${ITEM.toUpperCase()}`,
      "/go/00000000-0000-0000-0000-000000000000",
      "/",
      "/go",
      "/prompts/https://evil.example",
      "/gone/https://evil.example",
    ]) {
      assertEquals(unfollowableGoPath(path), null, path);
    }
  },
);

// #58: a HEAD is answered from a lookup that only reads, so a link unfurler,
// prefetcher or uptime checker is never counted as a click.
function lookups(stored: string | null) {
  const follow = stub({ data: stored, error: null });
  const peek = stub({ data: stored, error: null });
  return { follow, peek, both: { follow: follow.lookup, peek: peek.lookup } };
}

Deno.test(
  "a HEAD answers what a GET answers, and never calls the counting lookup",
  async () => {
    const { follow, peek, both } = lookups("https://creator.example/page");
    const head = await answerCreatorLink("HEAD", ITEM, both);
    assertEquals(follow.asked, []);
    assertEquals(peek.asked, [ITEM]);
    assertEquals(head.status, 302);
    assertEquals(head.headers.get("Location"), "https://creator.example/page");
    assertNoindex(head);
    assertEquals(head.headers.get("Referrer-Policy"), "no-referrer");
  },
);

Deno.test("a GET is counted once, through the counting lookup", async () => {
  const { follow, peek, both } = lookups("https://creator.example/page");
  const get = await answerCreatorLink("GET", ITEM, both);
  await answerCreatorLink("HEAD", ITEM, both);
  // One GET plus one HEAD: one call to follow_creator_link, not two.
  assertEquals(follow.asked, [ITEM]);
  assertEquals(peek.asked, [ITEM]);
  assertEquals(get.status, 302);
  assertEquals(get.headers.get("Location"), "https://creator.example/page");
  assertNoindex(get);
  assertEquals(get.headers.get("Referrer-Policy"), "no-referrer");
});

Deno.test(
  "a HEAD to an unknown id, a non-UUID or an item without a link answers 404 and counts nothing",
  async () => {
    const none = lookups(null);
    const unknown = await answerCreatorLink(
      "HEAD",
      "00000000-0000-4000-8000-000000000000",
      none.both,
    );
    const noLink = await answerCreatorLink("HEAD", ITEM, none.both);
    assertEquals(unknown.status, 404);
    assertEquals(noLink.status, 404);
    assertEquals(noLink.headers.get("Location"), null);

    const linked = lookups("https://creator.example/page");
    const notAnId = await answerCreatorLink("HEAD", "not-an-id", linked.both);
    assertEquals(notAnId.status, 404);
    assertEquals(notAnId.headers.get("Location"), null);
    assertEquals(linked.peek.asked, []);

    assertEquals(none.follow.asked, []);
    assertEquals(linked.follow.asked, []);
  },
);

// #73: a /go/ address that leads nowhere answers 404 with a Querino page a
// visitor can read and leave, not an empty body the browser replaces with its
// own error screen.
async function assertReadablePage(res: Response, label: string) {
  assertEquals(res.status, 404, label);
  assertEquals(res.headers.get("Location"), null, label);
  assertEquals(
    res.headers.get("Content-Type"),
    "text/html; charset=utf-8",
    label,
  );
  assertNoindex(res);
  const body = await res.text();
  for (const piece of [
    '<meta name="robots" content="noindex" />',
    '<a href="/">Querino</a>',
    "This link is not available",
    'href="/discover"',
  ]) {
    assertEquals(body.includes(piece), true, `${label}: ${piece}`);
  }
}

Deno.test(
  "an unknown id, an item without an approved link and a malformed id show the not-available page",
  async () => {
    await assertReadablePage(
      await followCreatorLink(
        "00000000-0000-4000-a000-000000000000",
        stub({ data: null, error: null }).lookup,
      ),
      "unknown id",
    );
    await assertReadablePage(
      await answerCreatorLink("GET", ITEM, lookups(null).both),
      "no approved link",
    );
    await assertReadablePage(
      await answerCreatorLink("GET", ITEM, lookups("javascript:alert(1)").both),
      "stored address not http(s)",
    );
    await assertReadablePage(
      await answerCreatorLink("GET", "nope", lookups(null).both),
      "malformed id",
    );
    for (const path of ["/go/nope", "/go/https://evil.example", "/go/"]) {
      await assertReadablePage(unfollowableGoPath(path)!, path);
    }
  },
);

Deno.test(
  "a HEAD that leads nowhere gets the page's status and headers, without the page",
  async () => {
    for (const res of [
      await answerCreatorLink("HEAD", ITEM, lookups(null).both),
      await answerCreatorLink("HEAD", "nope", lookups(null).both),
      unfollowableGoPath("/go/nope", "HEAD")!,
      unfollowableGoPath("/go/nope", "head")!,
    ]) {
      assertEquals(res.status, 404);
      assertEquals(res.headers.get("Content-Type"), "text/html; charset=utf-8");
      assertNoindex(res);
      assertEquals(res.body, null);
    }
  },
);

Deno.test("an approved link's redirect carries no page", async () => {
  const res = await answerCreatorLink(
    "GET",
    ITEM,
    lookups("https://creator.example/page").both,
  );
  assertEquals(res.status, 302);
  assertEquals(res.body, null);
});
