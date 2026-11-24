import { assert, assertEquals } from "@std/assert";
import { collectionPage } from "@/lib/collectionHead.ts";

// pageHead() (seo.ts) turns this into the tags: it trims the description to
// 160 characters, adds og:title/og:description/og:url/og:type and the
// canonical link, and writes robots noindex only when noIndex is set.
const ID = "0b6f5c1e-8a51-4d1b-9a43-6c1d2b6f7a10";

Deno.test("a public collection has its own indexable head", () => {
  const page = collectionPage({
    id: ID,
    title: "Writing helpers",
    description: "Prompts I use for drafting blog posts.",
    is_public: true,
  });
  assertEquals(page.title, "Writing helpers");
  assertEquals(page.description, "Prompts I use for drafting blog posts.");
  assertEquals(page.canonical, `/collections/${ID}`);
  assert(!page.noIndex);
});

Deno.test("a public collection without a description names itself", () => {
  for (const description of [null, undefined, "", "   "]) {
    const page = collectionPage({
      id: ID,
      title: "Writing helpers",
      description,
      is_public: true,
    });
    assert(page.description!.startsWith("Writing helpers, a collection"));
  }
});

Deno.test(
  "a private collection and a miss stay noindex, without a canonical",
  () => {
    const priv = collectionPage({
      id: ID,
      title: "Mine",
      description: "x",
      is_public: false,
    });
    assertEquals(priv, { title: "Mine", noIndex: true });
    assertEquals(collectionPage(undefined), {
      title: "Collection Not Found",
      noIndex: true,
    });
    assertEquals(collectionPage(null), {
      title: "Collection Not Found",
      noIndex: true,
    });
  },
);
