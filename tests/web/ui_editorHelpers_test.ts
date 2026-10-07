import { assertEquals } from "@std/assert";
import {
  cleanBlogSlug,
  slugForSave,
} from "@/components/blog/admin/blogSlug.ts";
import { parseBlogPage } from "@/components/blog/blogPage.ts";
import { blogMediaPath } from "@/components/blog/admin/blogMediaPath.ts";
import { slugInputProblem } from "@/components/shared/slugInput.ts";
import {
  DELETED_COMMENT_TEXT,
  countReadableComments,
  isDeletedComment,
} from "@/components/comments/deletedComment.ts";

// Pure parts of the 2026-10-07 frontend fixes.

Deno.test("a typed blog slug is cleaned into an address", () => {
  assertEquals(cleanBlogSlug("  My Post: Über Café! "), "my-post-uber-cafe");
  assertEquals(cleanBlogSlug("--a__b--"), "a-b");
  assertEquals(cleanBlogSlug("???"), "");
});

Deno.test("a new post sends null unless the admin typed a slug", () => {
  assertEquals(slugForSave({ isNew: true, formSlug: "", savedSlug: null }), {
    slug: null,
  });
  assertEquals(slugForSave({ isNew: true, formSlug: "!!!", savedSlug: null }), {
    slug: null,
  });
  assertEquals(
    slugForSave({ isNew: true, formSlug: "Hello World", savedSlug: null }),
    { slug: "hello-world" },
  );
});

Deno.test(
  "an existing post keeps its address unless the admin changed it",
  () => {
    assertEquals(
      slugForSave({ isNew: false, formSlug: "hello", savedSlug: "hello" }),
      {},
    );
    // A stored slug that is not in today's clean form is left exactly as it is.
    assertEquals(
      slugForSave({
        isNew: false,
        formSlug: "Old_Slug",
        savedSlug: "Old_Slug",
      }),
      {},
    );
    assertEquals(
      slugForSave({ isNew: false, formSlug: "", savedSlug: "hello" }),
      {},
    );
    assertEquals(
      slugForSave({ isNew: false, formSlug: "New One", savedSlug: "hello" }),
      { slug: "new-one" },
    );
  },
);

Deno.test("a blog page parameter that is not a page number is page 1", () => {
  assertEquals(parseBlogPage(null), 1);
  assertEquals(parseBlogPage("abc"), 1);
  assertEquals(parseBlogPage("0"), 1);
  assertEquals(parseBlogPage("-2"), 1);
  assertEquals(parseBlogPage("2.5"), 1);
  assertEquals(parseBlogPage(""), 1);
  assertEquals(parseBlogPage("3"), 3);
});

Deno.test("the storage path of a blog image comes from its public URL", () => {
  assertEquals(
    blogMediaPath(
      "https://abc.supabase.co/storage/v1/object/public/blog-media/blog/1f2e.png",
    ),
    "blog/1f2e.png",
  );
  assertEquals(
    blogMediaPath(
      "https://abc.supabase.co/storage/v1/object/public/blog-media/blog/a%20b.jpg",
    ),
    "blog/a b.jpg",
  );
  assertEquals(blogMediaPath("https://example.com/somewhere/else.png"), null);
  assertEquals(blogMediaPath("not a url"), null);
  assertEquals(blogMediaPath(null), null);
});

Deno.test("a slug needs a letter or a digit before it is sent", () => {
  assertEquals(slugInputProblem("   "), "Slug cannot be empty");
  assertEquals(
    slugInputProblem("???"),
    "Invalid slug: use at least one letter or number",
  );
  assertEquals(slugInputProblem("my-kit"), null);
  assertEquals(slugInputProblem("привет"), null);
  assertEquals(slugInputProblem("2026"), null);
});

Deno.test("a blanked comment is a placeholder and is not counted", () => {
  assertEquals(isDeletedComment({ content: DELETED_COMMENT_TEXT }), true);
  assertEquals(
    isDeletedComment({ content: `${DELETED_COMMENT_TEXT} ` }),
    false,
  );
  assertEquals(
    countReadableComments([
      {
        content: DELETED_COMMENT_TEXT,
        replies: [{ content: "a reply" }, { content: "another" }],
      },
      { content: "top", replies: [] },
    ]),
    3,
  );
});
