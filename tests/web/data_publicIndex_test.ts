import { assertEquals, assertRejects } from "@std/assert";
import {
  collectPublicIndex,
  INDEX_PAGE,
  type IndexPageResult,
  isTransientStatus,
} from "@/lib/publicIndex.ts";

const noWait = () => Promise.resolve();

const ROWS = [
  { slug: "a-kit", title: "A kit", description: "first" },
  { slug: "b-kit", title: "B kit", description: null },
];

const ok = (data: unknown[]): IndexPageResult => ({
  data,
  error: null,
  status: 200,
});
const failed = (status: number, message: string): IndexPageResult => ({
  data: null,
  error: { message },
  status,
});

/** A stubbed request that answers from `answers` in turn and counts the tries. */
function stub(answers: IndexPageResult[]) {
  const calls: Array<[number, number]> = [];
  const fetchPage = (from: number, to: number) => {
    calls.push([from, to]);
    const next = answers[Math.min(calls.length - 1, answers.length - 1)];
    return Promise.resolve(next);
  };
  return { fetchPage, calls };
}

// The failure seen in the app check of PR #26 (issue #27).
Deno.test(
  "one 500 'Project not specified' then success returns the list",
  async () => {
    const { fetchPage, calls } = stub([
      failed(500, "Project not specified"),
      ok(ROWS),
    ]);
    const entries = await collectPublicIndex("prompt_kits", fetchPage, noWait);
    assertEquals(entries, ROWS);
    assertEquals(calls.length, 2);
    assertEquals(calls[1], [0, INDEX_PAGE - 1]);
  },
);

Deno.test(
  "one network failure (status 0) then success returns the list",
  async () => {
    const { fetchPage, calls } = stub([
      failed(0, "TypeError: Failed to fetch"),
      ok(ROWS),
    ]);
    assertEquals(await collectPublicIndex("prompts", fetchPage, noWait), ROWS);
    assertEquals(calls.length, 2);
  },
);

Deno.test("a 5xx on every try fails after exactly two tries", async () => {
  for (const status of [500, 502, 503, 504]) {
    const { fetchPage, calls } = stub([
      failed(status, "Project not specified"),
    ]);
    await assertRejects(
      () => collectPublicIndex("skills", fetchPage, noWait),
      Error,
      "Index query for skills failed: Project not specified",
    );
    assertEquals(calls.length, 2, `HTTP ${status}`);
  }
});

Deno.test("a 4xx is tried once and surfaces as before", async () => {
  for (const status of [400, 401, 403, 404]) {
    const { fetchPage, calls } = stub([
      failed(status, "bad request"),
      ok(ROWS),
    ]);
    await assertRejects(
      () => collectPublicIndex("workflows", fetchPage, noWait),
      Error,
      "Index query for workflows failed: bad request",
    );
    assertEquals(calls.length, 1, `HTTP ${status}`);
  }
});

Deno.test(
  "a normal load makes one request and keeps only rows with slug and title",
  async () => {
    const { fetchPage, calls } = stub([
      ok([...ROWS, { slug: null, title: "x", description: null }]),
    ]);
    assertEquals(await collectPublicIndex("prompts", fetchPage, noWait), ROWS);
    assertEquals(calls.length, 1);
  },
);

Deno.test(
  "the retry is per page: a full first page, then a transient failure, then the rest",
  async () => {
    const full = Array.from({ length: INDEX_PAGE }, (_, i) => ({
      slug: `s${i}`,
      title: `t${i}`,
      description: null,
    }));
    const { fetchPage, calls } = stub([
      ok(full),
      failed(500, "Project not specified"),
      ok(ROWS),
    ]);
    const entries = await collectPublicIndex("prompts", fetchPage, noWait);
    assertEquals(entries.length, INDEX_PAGE + ROWS.length);
    assertEquals(calls, [
      [0, INDEX_PAGE - 1],
      [INDEX_PAGE, 2 * INDEX_PAGE - 1],
      [INDEX_PAGE, 2 * INDEX_PAGE - 1],
    ]);
  },
);

Deno.test("which statuses count as transient", () => {
  for (const s of [0, 500, 502, 503, 504, 520, 599]) {
    assertEquals(isTransientStatus(s), true, `${s}`);
  }
  for (const s of [200, 206, 400, 401, 403, 404, 406, 409, 429, 600]) {
    assertEquals(isTransientStatus(s), false, `${s}`);
  }
});
