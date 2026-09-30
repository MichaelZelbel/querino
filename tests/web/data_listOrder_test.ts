import { assert, assertEquals } from "@std/assert";
import {
  applyOrder,
  type OrderTerm,
  promptBrowseOrder,
  withIdTiebreak,
} from "@/lib/listOrder.ts";

type Row = Record<string, number | string>;

// A stand-in for Postgres: sort by the given terms, and leave rows the terms
// do not tell apart in whatever order this particular query happens to see
// them. Each page is its own query, so each page gets its own shuffle.
function queryPage(
  rows: Row[],
  terms: OrderTerm[],
  from: number,
  size: number,
  seed: number,
): Row[] {
  let state = seed + 1;
  const random = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const shuffled = [...rows].sort(() => random() - 0.5);
  const sorted = shuffled.sort((a, b) => {
    for (const { column, ascending } of terms) {
      if (a[column] === b[column]) continue;
      const lower = a[column] < b[column] ? -1 : 1;
      return ascending ? lower : -lower;
    }
    return 0;
  });
  return sorted.slice(from, from + size);
}

function pageThrough(rows: Row[], terms: OrderTerm[], size: number) {
  const seen: string[] = [];
  for (let page = 0; page * size < rows.length; page++) {
    seen.push(
      ...queryPage(rows, terms, page * size, size, page).map((r) =>
        String(r.id),
      ),
    );
  }
  return seen;
}

// Most public prompts have never been rated or copied.
const rows: Row[] = Array.from({ length: 128 }, (_, i) => ({
  id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
  rating_avg: i < 10 ? 5 - (i % 3) : 0,
  rating_count: i < 10 ? 1 : 0,
  copies_count: i < 20 ? i % 4 : 0,
  created_at: `2026-09-${String(1 + (i % 5)).padStart(2, "0")}`,
}));

Deno.test("every prompt browse order ends in the primary key", () => {
  for (const sort of ["trending", "newest", "rating"] as const) {
    assertEquals(promptBrowseOrder(sort).at(-1)?.column, "id", sort);
  }
});

Deno.test("paging a browse order shows every prompt exactly once", () => {
  // The order the Top Rated tab used before: two tied columns and nothing
  // after them. The stand-in reproduces what production did.
  const before: OrderTerm[] = [
    { column: "rating_avg", ascending: false },
    { column: "rating_count", ascending: false },
  ];
  const shownBefore = pageThrough(rows, before, 24);
  assert(new Set(shownBefore).size < rows.length, "the stand-in shows the bug");

  for (const sort of ["trending", "newest", "rating"] as const) {
    const shown = pageThrough(rows, promptBrowseOrder(sort), 24);
    assertEquals(shown.length, rows.length, sort);
    assertEquals(new Set(shown).size, rows.length, sort);
  }
});

Deno.test("withIdTiebreak adds the key once", () => {
  const once = withIdTiebreak([{ column: "title", ascending: true }]);
  assertEquals(
    once.map((t) => t.column),
    ["title", "id"],
  );
  assertEquals(
    withIdTiebreak(once).map((t) => t.column),
    ["title", "id"],
  );
});

Deno.test("applyOrder passes each term to the query in order", () => {
  const calls: unknown[] = [];
  const query = {
    order(column: string, options?: object) {
      calls.push([column, options]);
      return query;
    },
  };
  applyOrder(query, promptBrowseOrder("trending"));
  assertEquals(calls, [
    ["copies_count", { ascending: false, nullsFirst: false }],
    ["rating_avg", { ascending: false }],
    ["created_at", { ascending: false }],
    ["id", { ascending: true }],
  ]);
});
