import { assertEquals } from "@std/assert";
import { canAutosavePost } from "@/components/blog/admin/blogAutosave.ts";

Deno.test(
  "a published post never autosaves, whatever the status select says",
  () => {
    // The old rule looked at the form alone: switching the select to Draft
    // started writing into the live post.
    assertEquals(
      canAutosavePost({
        isNew: false,
        savedStatus: "published",
        formStatus: "draft",
      }),
      false,
    );
    assertEquals(
      canAutosavePost({
        isNew: false,
        savedStatus: "draft",
        formStatus: "draft",
      }),
      true,
    );
    assertEquals(
      canAutosavePost({
        isNew: false,
        savedStatus: "draft",
        formStatus: "published",
      }),
      false,
    );
    assertEquals(
      canAutosavePost({
        isNew: true,
        savedStatus: undefined,
        formStatus: "draft",
      }),
      false,
    );
  },
);
