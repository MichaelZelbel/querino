import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  CREATOR_LINK_LIMIT_ERROR,
  CREATOR_LINK_LIMIT_HINT,
  CREATOR_LINK_NEW_ACCOUNT_DAYS,
  CREATOR_LINK_NEW_ACCOUNT_LIMIT,
  creatorLinkErrorText,
} from "@/lib/creatorLink.ts";

// The seven-day limit is decided by the database (#47); the browser only
// shows its message. There is no database to run here, so this holds the
// two sides to the same words and numbers.
const MIGRATION = await Deno.readTextFile(
  "supabase/migrations/20261119140000_every_creator_link_is_checked.sql",
);

Deno.test(
  "the database refuses a new account's fourth link with the message the browser shows",
  () => {
    assertStringIncludes(
      MIGRATION,
      `RAISE EXCEPTION '${CREATOR_LINK_LIMIT_ERROR}'`,
    );
    assertStringIncludes(MIGRATION, `HINT = '${CREATOR_LINK_LIMIT_HINT}'`);
    assertStringIncludes(
      MIGRATION,
      `interval '${CREATOR_LINK_NEW_ACCOUNT_DAYS} days'`,
    );
    assertStringIncludes(
      MIGRATION,
      `v_links >= ${CREATOR_LINK_NEW_ACCOUNT_LIMIT}`,
    );
    assertStringIncludes(MIGRATION, "BEFORE INSERT ON public.creator_links");
  },
);

Deno.test("a refusal for the seven-day limit is shown in plain words", () => {
  assertEquals(
    creatorLinkErrorText({
      message: CREATOR_LINK_LIMIT_ERROR,
      code: "P0001",
      hint: CREATOR_LINK_LIMIT_HINT,
    }),
    CREATOR_LINK_LIMIT_ERROR,
  );
});

Deno.test("any other failure has no special message", () => {
  assertEquals(creatorLinkErrorText({ message: "boom", hint: null }), null);
  assertEquals(creatorLinkErrorText(new Error("network")), null);
  assertEquals(creatorLinkErrorText(null), null);
  assertEquals(creatorLinkErrorText("creator_link_new_account_limit"), null);
});
