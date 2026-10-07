import { assert, assertEquals } from "@std/assert";
import {
  ARTIFACT_DETAIL_COLUMNS,
  ARTIFACT_LIST_COLUMNS,
  artifactDetailSelect,
  artifactListSelect,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";

const TABLES: ArtifactListTable[] = [
  "prompts",
  "skills",
  "workflows",
  "prompt_kits",
];

// The columns that exist only for the database: the vector, the word index
// and the embedding job's bookkeeping.
const INTERNAL = [
  "embedding",
  "embedding_attempts",
  "embedding_claimed_at",
  "embedding_error",
  "embedding_failed_at",
  "fts",
];

// Until 2026-09-30 the lists asked for `*`, which carried every row's
// embedding vector and search vector to the browser; prompts kept doing it
// until 2026-10-07, and so did the detail pages' second fetch.
Deno.test(
  "no list or detail page asks for everything, the vectors included",
  () => {
    for (const table of TABLES) {
      for (const [what, select, columns] of [
        ["list", artifactListSelect(table), ARTIFACT_LIST_COLUMNS[table]],
        ["detail", artifactDetailSelect(table), ARTIFACT_DETAIL_COLUMNS[table]],
      ] as const) {
        assert(!/(^|[\s,])\*/.test(select), `${table} ${what} selects *`);
        for (const internal of INTERNAL) {
          assert(
            !columns.includes(internal),
            `${table} ${what} selects ${internal}`,
          );
          assert(
            !new RegExp(`(^|[\\s,(])${internal}([\\s,)]|$)`).test(select),
            `${table} ${what} select string names ${internal}`,
          );
        }
      }
    }
  },
);

Deno.test("a list still carries what the cards and the Library read", () => {
  for (const table of TABLES) {
    for (const column of [
      "id",
      "slug",
      "title",
      "description",
      "content",
      "author_id",
      "team_id",
      "rating_avg",
      "menerio_synced",
      "updated_at",
    ]) {
      assert(
        ARTIFACT_LIST_COLUMNS[table].includes(column),
        `${table}.${column}`,
      );
    }
  }
  for (const table of ["skills", "workflows", "prompt_kits"] as const) {
    assert(ARTIFACT_LIST_COLUMNS[table].includes("published"), table);
  }
  assertEquals(
    ["json", "filename", "scope"].every((c) =>
      ARTIFACT_LIST_COLUMNS.workflows.includes(c),
    ),
    true,
  );
});

Deno.test(
  "prompts carry their own public flag and what PromptCard shows",
  () => {
    const prompts = ARTIFACT_LIST_COLUMNS.prompts;
    assert(!prompts.includes("published"), "prompts have no `published`");
    for (const column of [
      "is_public",
      "summary",
      "example_output",
      "copies_count",
      "published_at",
      "language",
      "tags",
    ]) {
      assert(prompts.includes(column), `prompts.${column}`);
    }
  },
);

Deno.test("each column is asked for once", () => {
  for (const table of TABLES) {
    const columns = ARTIFACT_DETAIL_COLUMNS[table];
    assertEquals(new Set(columns).size, columns.length, table);
  }
});
