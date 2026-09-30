import { assert, assertEquals } from "@std/assert";
import {
  ARTIFACT_LIST_COLUMNS,
  artifactListSelect,
} from "@/lib/artifactListColumns.ts";

// Until 2026-09-30 the lists asked for `*`, which carried every row's
// embedding vector and search vector to the browser.
Deno.test("a list never asks for everything, the vectors included", () => {
  for (const table of ["skills", "workflows", "prompt_kits"] as const) {
    const select = artifactListSelect(table);
    assert(!/(^|[\s,])\*/.test(select), `${table} selects *`);
    for (const heavy of ["embedding", "fts"]) {
      assert(
        !ARTIFACT_LIST_COLUMNS[table].includes(heavy),
        `${table} selects ${heavy}`,
      );
    }
  }
});

Deno.test("a list still carries what the cards and the Library read", () => {
  for (const table of ["skills", "workflows", "prompt_kits"] as const) {
    for (const column of [
      "id",
      "slug",
      "title",
      "description",
      "content",
      "published",
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
  assertEquals(
    ["json", "filename", "scope"].every((c) =>
      ARTIFACT_LIST_COLUMNS.workflows.includes(c),
    ),
    true,
  );
});
