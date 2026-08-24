// Reported August 2026 from a Claude Code session that had just stored a skill
// through the MCP server and then could not find it again:
//
//   search_skills("implement")                     -> the skill
//   search_skills("alamops implement orchestrator") -> nothing
//
// The skill is titled "Implement (alamops): eight-phase feature orchestrator,
// kept dormant". Every word of the failing query is in that title.
//
// The session's own conclusion was that search hides unpublished records. That
// was wrong -- every search_* tool filters on author_id and has never filtered
// on published -- but the conclusion is the point. The whole query string was
// being used as ONE `%...%` pattern, so words had to appear side by side in a
// single column. One word worked. Two usually did not. The result was an empty
// list, which reads exactly like an empty library, and an agent that cannot
// tell those apart will report the absence as fact.
//
// These tests are here because that failure is invisible: nothing errors,
// nothing logs, the caller is simply told "no".

import { test, expect } from "@playwright/test";
import { callMcpTool } from "./helpers/api";
import {
  createSearchableSkill,
  mintMcpToken,
  type SkillFixture,
  type MintedMcpToken,
} from "./helpers/fixtures";

let mcp: MintedMcpToken;
let skill: SkillFixture;

test.beforeAll(async () => {
  mcp = await mintMcpToken();
  skill = await createSearchableSkill();
});

test.afterAll(async () => {
  await skill?.remove();
  await mcp?.revoke();
});

async function search(query: string) {
  const res = await callMcpTool(mcp.token, "search_skills", { query });
  expect(
    res.isError,
    `searching for ${JSON.stringify(query)} errored: ${res.text}`,
  ).toBe(false);
  return res.text;
}

test.describe("search finds a record when the words are spread across it", () => {
  test("a single word from the title finds it (the control)", async () => {
    expect(await search(skill.marker)).toContain(skill.title);
  });

  test("an unpublished skill is searchable, not hidden", async () => {
    // The reported diagnosis. Kept as a test so nobody 'fixes' it by adding a
    // published filter: these tools search the caller's own shelf.
    const text = await search(skill.marker);
    expect(text).toContain(skill.title);
    expect(text).toMatch(/"published":\s*false/);
  });

  test("two words from the title, given out of order, still find it", async () => {
    expect(
      await search(`${skill.lastTitleWord} ${skill.firstTitleWord}`),
    ).toContain(skill.title);
  });

  test("a word from the title plus a word from the description finds it", async () => {
    // These two can never be adjacent: they are in different columns.
    expect(
      await search(`${skill.firstTitleWord} ${skill.descriptionWord}`),
    ).toContain(skill.title);
  });

  test("a word that only appears in the body finds it", async () => {
    // Before the fix the MCP server searched title and description only, while
    // the website's command palette already searched content. Same shelf, two
    // different answers.
    expect(await search(skill.contentWord)).toContain(skill.title);
  });

  test("all three columns at once finds it", async () => {
    const query = `${skill.firstTitleWord} ${skill.descriptionWord} ${skill.contentWord}`;
    expect(await search(query)).toContain(skill.title);
  });

  test("a quoted phrase still has to be adjacent", async () => {
    // Quoting is how a caller asks for the old behaviour deliberately.
    expect(await search(`"${skill.adjacentPhrase}"`)).toContain(skill.title);
    expect(await search(`"${skill.reversedPhrase}"`)).not.toContain(
      skill.title,
    );
  });

  test("one impossible word does not erase the rest of the answer", async () => {
    // Every word matching is the strict pass. When it finds nothing, the loose
    // pass runs, so a caller who guessed one word wrong gets the near miss it
    // can reject rather than a clean 'nothing found' it will repeat as fact.
    const query = `${skill.firstTitleWord} zzz${skill.marker}nothingmatchesthis`;
    expect(await search(query)).toContain(skill.title);
  });

  test("a query where nothing matches is still empty", async () => {
    // The loose pass must not turn into 'return everything'.
    const text = await search(
      `zzz${skill.marker}nope zzz${skill.marker}alsonope`,
    );
    expect(text).not.toContain(skill.title);
  });

  test("the search is still scoped to the caller", async () => {
    const text = await search(skill.marker);
    const ids = [...text.matchAll(/"id":\s*"([0-9a-f-]{36})"/g)].map(
      (m) => m[1],
    );
    for (const id of ids) {
      expect([skill.id]).toContain(id);
    }
  });
});
