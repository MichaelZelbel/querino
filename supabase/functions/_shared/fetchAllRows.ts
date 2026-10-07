// Every row a query matches, not the first thousand.
//
// PostgREST answers at most 1,000 rows per request unless asked for a range,
// and says nothing when it stops there. github-sync learned this on
// 2026-09-16, when the rows past the first thousand were deleted from a
// user's GitHub repository as if the user had deleted them. On 2026-10-07 the
// same unpaged read was found in four more places: the nightly model sync
// (which retires every stored model it does not see, and llm_models only ever
// grows, about 520 rows that day), the public model catalogue, the admin
// panel's model list, and the allowance batch over every profile.
//
// So the loop lives here once. Two things make it correct, not just longer:
// the query error is thrown instead of becoming an empty list, and the rows
// come in a total order. Without one, PostgreSQL may hand back the same row
// on two pages and skip another, so the order has to end in the primary key.

export const PAGE_SIZE = 1000;

export interface OrderColumn {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
}

/** One page's answer, the shape every supabase-js query resolves to. */
export interface PageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/** The part of a supabase-js select builder this needs, structurally. */
export interface PageableQuery<T> {
  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean },
  ): PageableQuery<T>;
  range(from: number, to: number): PromiseLike<PageResult<T>>;
}

/**
 * Read every row of a query, a page at a time, in the given order.
 *
 * `build` returns a fresh query each time it is called (a supabase-js builder
 * is changed in place by .order() and .range(), so one cannot be reused for
 * the next page). `orderBy` must end in the table's primary key so the order
 * is total. Throws an Error with PostgREST's message if any page fails.
 */
export async function fetchAllRows<T>(
  build: () => PageableQuery<T>,
  orderBy: readonly OrderColumn[],
  pageSize: number = PAGE_SIZE,
): Promise<T[]> {
  if (orderBy.length === 0) {
    throw new Error("fetchAllRows needs an order that ends in the primary key");
  }
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    let query = build();
    for (const o of orderBy) {
      query = query.order(o.column, {
        ascending: o.ascending ?? true,
        ...(o.nullsFirst === undefined ? {} : { nullsFirst: o.nullsFirst }),
      });
    }
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}
