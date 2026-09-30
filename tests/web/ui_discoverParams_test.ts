import { assertEquals } from "@std/assert";
import {
  readDiscoverParams,
  sortOptionsFor,
  writeDiscoverParams,
} from "@/components/discover/discoverParams.ts";

const p = (s: string) => new URLSearchParams(s);

Deno.test("a plain visit is the Prompts tab, trending, all categories", () => {
  assertEquals(readDiscoverParams(p("")), {
    tab: "prompts",
    q: "",
    sort: "trending",
    category: "all",
    tag: "",
  });
});

Deno.test("search, sort and category come back from the address", () => {
  // Back from a card used to lose all three.
  assertEquals(
    readDiscoverParams(p("type=skills&q=meeting&sort=rating&category=coding")),
    {
      tab: "skills",
      q: "meeting",
      sort: "rating",
      category: "coding",
      tag: "",
    },
  );
});

Deno.test("a sort a tab lacks falls back to that tab's default", () => {
  assertEquals(
    readDiscoverParams(p("type=skills&sort=trending")).sort,
    "newest",
  );
  assertEquals(readDiscoverParams(p("type=nonsense")).tab, "prompts");
  assertEquals(sortOptionsFor("prompts"), ["trending", "newest", "rating"]);
  assertEquals(sortOptionsFor("kits"), ["newest", "rating"]);
});

Deno.test("defaults stay out of the address, other values go in", () => {
  assertEquals(
    writeDiscoverParams(p("type=skills"), { tab: "prompts" }).toString(),
    "",
  );
  assertEquals(
    writeDiscoverParams(p(""), { q: "  memory  " }).toString(),
    "q=memory",
  );
  assertEquals(writeDiscoverParams(p("q=memory"), { q: "" }).toString(), "");
  assertEquals(
    writeDiscoverParams(p("type=skills"), { sort: "newest" }).toString(),
    "type=skills",
  );
  assertEquals(
    writeDiscoverParams(p(""), { sort: "newest" }).toString(),
    "sort=newest",
  );
  assertEquals(
    writeDiscoverParams(p("category=coding&tag=x"), {
      category: "all",
    }).toString(),
    "tag=x",
  );
});

Deno.test("switching tabs keeps the search and the tag", () => {
  const next = writeDiscoverParams(p("q=memory&tag=planning"), {
    tab: "workflows",
  });
  assertEquals(readDiscoverParams(next).q, "memory");
  assertEquals(readDiscoverParams(next).tag, "planning");
  assertEquals(readDiscoverParams(next).tab, "workflows");
});
