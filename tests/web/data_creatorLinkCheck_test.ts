import { assertEquals } from "@std/assert";
import {
  CREATOR_LINK_LIMIT_HINT,
  creatorLinkErrorText,
} from "@/lib/creatorLink.ts";

// The seven-day limit is decided by the database (#47); the browser shows the
// database's own message whenever the refusal carries the limit's hint.
Deno.test(
  "a refusal for the seven-day limit is shown in the database's words",
  () => {
    const message = "New accounts can add a link to at most three items.";
    assertEquals(
      creatorLinkErrorText({
        message,
        code: "P0001",
        hint: CREATOR_LINK_LIMIT_HINT,
      }),
      message,
    );
  },
);

Deno.test("any other failure has no special message", () => {
  assertEquals(creatorLinkErrorText({ message: "boom", hint: null }), null);
  assertEquals(creatorLinkErrorText(new Error("network")), null);
  assertEquals(creatorLinkErrorText(null), null);
  assertEquals(creatorLinkErrorText(CREATOR_LINK_LIMIT_HINT), null);
  assertEquals(creatorLinkErrorText({ hint: CREATOR_LINK_LIMIT_HINT }), null);
});
