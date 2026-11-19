import { assert } from "@std/assert";
import { buildMarkdownContent } from "@/lib/markdown.ts";
import { buildPromptForLLM } from "@/lib/openLLM.ts";
import { stripPromptEndMarkers } from "@/lib/promptKitParser.ts";

// A detail page's row as the route loader returns it, link included.
const row = {
  id: "11111111-2222-4333-8444-555555555555",
  title: "Summarise a paper",
  description: "Turns a paper into five bullets",
  tags: ["research"],
  content: "Summarise the paper below.\n\n<!-- end -->",
  creator_link: { label: "My Book", url: "https://creator.example/buy" },
};

function assertNoLink(output: string, builder: string) {
  for (const part of ["creator.example", "My Book"]) {
    assert(
      !output.includes(part),
      `${builder} carries the creator link: ${output}`,
    );
  }
}

// Copy, "Download .md" and "Send to ..." are fed exactly these fields by the
// detail pages, DownloadMarkdownButton and SendToLLMButtons.
Deno.test("copy, download and send never carry the creator link", () => {
  assertNoLink(row.content, "Copy");
  assertNoLink(stripPromptEndMarkers(row.content), "Copy (kit)");
  for (const type of ["prompt", "skill", "workflow", "prompt_kit"] as const) {
    assertNoLink(
      buildMarkdownContent({
        title: row.title,
        type,
        description: row.description,
        tags: row.tags,
        content: row.content,
      }),
      `Download .md (${type})`,
    );
  }
  assertNoLink(buildPromptForLLM(row.title, row.content), "Send to");
});
