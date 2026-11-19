import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import mcpServerSource from "../mcp-server/index.ts" with { type: "text" };

// A creator's link (#46) is shown under an item on the site and never travels
// inside the item: a get_* tool's content is the item row alone. The server
// does not read creator_links today. If it ever returns an approved link, it
// must be a separate field next to the content, never part of it; change this
// test together with that decision.
Deno.test(
  "the MCP server never puts a creator link into an item's content",
  () => {
    assert(
      !mcpServerSource.includes("creator_link"),
      "mcp-server/index.ts mentions creator_link: keep the link out of `content`",
    );
  },
);
