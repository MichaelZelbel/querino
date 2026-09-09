// The worker and the manual sync must agree on paths and bodies, and this is
// the file both import, so the shapes it promises are pinned here.

import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildPath,
  generateMarkdown,
  managedFolders,
  normalizeBaseFolder,
} from "./githubSyncFormat.ts";

const ID = "0123abcd-9999-4000-8000-000000000000";

Deno.test("buildPath is slug plus short id inside the type folder", () => {
  assertEquals(
    buildPath("", "prompt", { slug: "hello-world", id: ID }),
    "prompts/hello-world-0123abcd.md",
  );
  assertEquals(
    buildPath("/notes/ai/", "prompt_kit", { slug: "kit", id: ID }),
    "notes/ai/prompt-kits/kit-0123abcd.md",
  );
});

Deno.test("buildPath falls back to the id when there is no slug", () => {
  assertEquals(
    buildPath(null, "skill", { slug: null, id: ID }),
    `skills/${ID}-0123abcd.md`,
  );
});

Deno.test("managedFolders lists the four folders the sync owns", () => {
  assertEquals(managedFolders(""), [
    "prompts/",
    "skills/",
    "workflows/",
    "prompt-kits/",
  ]);
  assertEquals(managedFolders("/base/"), [
    "base/prompts/",
    "base/skills/",
    "base/workflows/",
    "base/prompt-kits/",
  ]);
  assertEquals(normalizeBaseFolder(undefined), "");
});

Deno.test("every managed path starts with one of the managed folders", () => {
  const folders = managedFolders("x");
  for (const type of ["prompt", "skill", "workflow", "prompt_kit"] as const) {
    const path = buildPath("x", type, { slug: "s", id: ID });
    assertEquals(
      folders.some((f) => path.startsWith(f)),
      true,
      path,
    );
  }
});

Deno.test("generateMarkdown carries the content and escapes quotes", () => {
  const md = generateMarkdown("workflow", {
    id: ID,
    title: 'Say "hi"',
    description: "d",
    content: "step one",
    tags: ["a", "b"],
    published: true,
  });
  assertStringIncludes(md, 'title: "Say \\"hi\\""');
  assertStringIncludes(md, 'tags: ["a", "b"]');
  assertStringIncludes(md, "published: true");
  assertStringIncludes(md, "## Workflow\n\nstep one");
});
