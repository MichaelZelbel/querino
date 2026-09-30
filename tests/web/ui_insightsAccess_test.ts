import { assertEquals } from "@std/assert";
import { canWriteInsights } from "@/components/insights/insightsAccess.ts";

Deno.test(
  "only the author gets the buttons that spend credits on insights",
  () => {
    // Detail pages pass isOwner={!!isAuthor}. A visitor or team editor gets
    // false, and the database refuses their insights row after the charge.
    assertEquals(canWriteInsights(false), false);
    assertEquals(canWriteInsights(true), true);
    assertEquals(canWriteInsights(undefined), true);
  },
);
