// The paging loop five edge functions read whole tables with.

import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  fetchAllRows,
  type PageableQuery,
  type PageResult,
} from "./fetchAllRows.ts";

interface Row {
  id: number;
}

interface Log {
  orders: Array<[string, unknown]>;
  ranges: Array<[number, number]>;
}

const newLog = (): Log => ({ orders: [], ranges: [] });

/**
 * A stand-in for a supabase-js builder over `rows`: it records the order and
 * range it is given and answers with that slice, the way PostgREST would.
 */
function fakeTable(rows: Row[], log: Log, failOnPage?: number) {
  let builds = 0;
  return (): PageableQuery<Row> => {
    const page = builds++;
    const query: PageableQuery<Row> = {
      order(column, options) {
        log.orders.push([column, options]);
        return query;
      },
      range(from, to): PromiseLike<PageResult<Row>> {
        log.ranges.push([from, to]);
        if (page === failOnPage) {
          return Promise.resolve({
            data: null,
            error: { message: "boom" },
          });
        }
        return Promise.resolve({
          data: rows.slice(from, to + 1),
          error: null,
        });
      },
    };
    return query;
  };
}

const rowsOf = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }));

Deno.test("past the first page, every row comes back, in order", async () => {
  const log = newLog();
  const all = await fetchAllRows(fakeTable(rowsOf(2_500), log), [
    { column: "id" },
  ]);
  assertEquals(all.length, 2_500);
  assertEquals(all[2_499], { id: 2_499 });
  assertEquals(log.ranges, [
    [0, 999],
    [1000, 1999],
    [2000, 2999],
  ]);
});

Deno.test(
  "an exact multiple of the page size ends on the empty page after it",
  async () => {
    const log = newLog();
    const all = await fetchAllRows(
      fakeTable(rowsOf(4), log),
      [{ column: "id" }],
      2,
    );
    assertEquals(all.length, 4);
    assertEquals(log.ranges, [
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
  },
);

Deno.test("every page gets the whole order, primary key last", async () => {
  const log = newLog();
  await fetchAllRows(
    fakeTable(rowsOf(3), log),
    [
      { column: "price", nullsFirst: false },
      { column: "provider" },
      { column: "model_id", ascending: false },
    ],
    2,
  );
  assertEquals(log.orders, [
    ["price", { ascending: true, nullsFirst: false }],
    ["provider", { ascending: true }],
    ["model_id", { ascending: false }],
    ["price", { ascending: true, nullsFirst: false }],
    ["provider", { ascending: true }],
    ["model_id", { ascending: false }],
  ]);
});

Deno.test("a failed page throws, never becomes a shorter list", async () => {
  // A short list is what deleted files from GitHub and would retire live
  // models; an error stops the caller before it acts on one.
  const log = newLog();
  await assertRejects(
    () => fetchAllRows(fakeTable(rowsOf(5), log, 1), [{ column: "id" }], 2),
    Error,
    "boom",
  );
});

Deno.test("no order is refused: pages without one can overlap", async () => {
  const log = newLog();
  await assertRejects(
    () => fetchAllRows(fakeTable(rowsOf(1), log), []),
    Error,
    "primary key",
  );
});
