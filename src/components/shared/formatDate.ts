// Dates and counts that a page renders on the server as well as in the browser.
//
// A detail page is rendered first on the server (UTC, en-US) and then again in
// the visitor's browser (their time zone and locale). date-fns' format() and a
// bare toLocaleString() use whichever zone and locale run them, so an item
// created at 23:00 UTC said "Sep 23" on the server and "Sep 24" in Berlin, and
// React threw hydration error #418 and re-rendered the whole page in the
// browser. Measured live on 2026-09-30: 8 of 9 public skill and workflow pages
// for a visitor at UTC+14, 1 of 9 at UTC-7. Fixing zone and locale makes both
// renders agree; a calendar date in UTC is exact enough for "Created ...".

const SHORT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const LONG = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** "Sep 23, 2026" in UTC, or "" for a missing or unreadable date. */
export function formatUtcDate(
  value: string | number | Date | null | undefined,
  style: "short" | "long" = "short",
): string {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return (style === "long" ? LONG : SHORT).format(d);
}

/** 1,234 whatever the visitor's locale, so server and browser agree. */
export function formatCount(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString("en-US");
}
