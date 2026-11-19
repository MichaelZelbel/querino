import { assertEquals } from "@std/assert";
import {
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
