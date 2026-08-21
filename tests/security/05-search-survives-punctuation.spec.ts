// Finding M2: six places build a PostgREST filter by pasting raw user input
// into a comma-separated string:
//
//   .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
//
// A comma in the query splits the filter list and the whole thing fails to
// parse. The calling code destructures { data } without looking at error, so
// the user sees an empty result and concludes there is nothing there.
//
// This is not a security hole, the ownership filter is ANDed separately and
// still holds. It is a plain bug that any user hits by typing normally, and it
// is in the seven because it is the one your users have already met.
//
// The same pattern is in src/hooks/useCommandPaletteSearch.ts (lines 48, 74,
// 100, 125, 173). Fixing only the MCP server would leave the command palette
// broken, so escape the input in one shared helper and use it in both.

import { test, expect } from "@playwright/test";
import { callMcpTool } from "./helpers/api";
import { createSearchablePrompt, mintMcpToken, type PromptFixture, type MintedMcpToken } from "./helpers/fixtures";

let mcp: MintedMcpToken;
let prompt: PromptFixture;

test.beforeAll(async () => {
  mcp = await mintMcpToken();
  prompt = await createSearchablePrompt();
});

test.afterAll(async () => {
  await prompt?.remove();
  await mcp?.revoke();
});

test.describe("M2 — punctuation in a search box does not silently return nothing", () => {
  test("a plain search finds the fixture (the control)", async () => {
    const res = await callMcpTool(mcp.token, "search_prompts", { query: prompt.plainTerm });
    expect(res.isError, `search errored: ${res.text}`).toBe(false);
    expect(res.text).toContain(prompt.title);
  });

  test("a search containing a comma finds the same fixture", async () => {
    const res = await callMcpTool(mcp.token, "search_prompts", { query: prompt.commaTerm });
    expect(res.isError, `search errored instead of returning results: ${res.text}`).toBe(false);
    expect(res.text).toContain(prompt.title);
  });

  test("a comma that matches nothing returns an empty list, not an error", async () => {
    const res = await callMcpTool(mcp.token, "search_prompts", { query: "prompts, skills" });
    expect(res.isError, `search errored: ${res.text}`).toBe(false);
    expect(res.text).not.toMatch(/failed to parse logic tree/i);
  });

  test("brackets, dots and quotes do not break the parser either", async () => {
    for (const query of ["a(b", "a)b", "a.b", 'a"b', "a\\b"]) {
      const res = await callMcpTool(mcp.token, "search_prompts", { query });
      expect(res.isError, `searching for ${JSON.stringify(query)} errored: ${res.text}`).toBe(false);
    }
  });

  test("a wildcard is treated as text, not as a wildcard", async () => {
    // Otherwise "%" quietly matches every row the user owns.
    const res = await callMcpTool(mcp.token, "search_prompts", { query: "%" });
    expect(res.isError, `search errored: ${res.text}`).toBe(false);
    expect(res.text).not.toContain(prompt.title);
  });

  test("the search is still scoped to the caller", async () => {
    // The escaping fix must not disturb the ownership filter that is ANDed on.
    const res = await callMcpTool(mcp.token, "search_prompts", { query: "e" });
    expect(res.isError, `search errored: ${res.text}`).toBe(false);
    const ids = [...res.text.matchAll(/"id":\s*"([0-9a-f-]{36})"/g)].map((m) => m[1]);
    for (const id of ids) {
      expect([prompt.id]).toContain(id);
    }
  });
});
