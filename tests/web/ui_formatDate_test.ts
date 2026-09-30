import { assertEquals } from "@std/assert";
import { formatCount, formatUtcDate } from "@/components/shared/formatDate.ts";

// 23:30 UTC is already the next day east of UTC and still the same day west of
// it. The server (UTC) and every browser must print the same text, or React
// throws hydration error #418.
const LATE = "2026-09-23T23:30:00Z";

Deno.test(
  "a date is the UTC calendar date, whatever zone runs the test",
  () => {
    // The old format(new Date(x), "MMM d, yyyy") gave "Sep 24, 2026" for LATE on
    // any machine east of UTC (this one runs Europe/Berlin) and "Sep 23" on the
    // UTC server. The test runner may not change TZ, so it pins both sides of
    // midnight instead.
    assertEquals(formatUtcDate(LATE), "Sep 23, 2026");
    assertEquals(formatUtcDate("2026-09-24T00:30:00Z"), "Sep 24, 2026");
    assertEquals(formatUtcDate(new Date(LATE)), "Sep 23, 2026");
  },
);

Deno.test("long style, and missing or broken dates print nothing", () => {
  assertEquals(formatUtcDate(LATE, "long"), "September 23, 2026");
  assertEquals(formatUtcDate(null), "");
  assertEquals(formatUtcDate(undefined), "");
  assertEquals(formatUtcDate("not a date"), "");
});

Deno.test("counts use one grouping whatever the visitor's locale", () => {
  assertEquals(formatCount(1234567), "1,234,567");
  assertEquals(formatCount(null), "0");
});
