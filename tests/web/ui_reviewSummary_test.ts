import { assertEquals } from "@std/assert";
import {
  ratingMode,
  reviewSummary,
} from "@/components/reviews/reviewSummary.ts";

Deno.test("the rating card follows the reviews once they have loaded", () => {
  // The page's copy of the item still says 0 reviews after the first rating.
  assertEquals(reviewSummary([{ rating: 4 }], false, { avg: 0, count: 0 }), {
    avg: 4,
    count: 1,
  });
  // ...and 4.0 from 1 review after the last one was deleted.
  assertEquals(reviewSummary([], false, { avg: 4, count: 1 }), {
    avg: 0,
    count: 0,
  });
  assertEquals(
    reviewSummary([{ rating: 5 }, { rating: 4 }], false, {
      avg: null,
      count: null,
    }),
    { avg: 4.5, count: 2 },
  );
});

Deno.test("while the reviews load, the item's own numbers stand in", () => {
  assertEquals(reviewSummary([], true, { avg: 4.2, count: 5 }), {
    avg: 4.2,
    count: 5,
  });
  assertEquals(reviewSummary([], true, { avg: null, count: undefined }), {
    avg: 0,
    count: 0,
  });
});

Deno.test("a private item offers no stars", () => {
  assertEquals(ratingMode({ signedIn: true, isPublic: false }), "closed");
  assertEquals(ratingMode({ signedIn: false, isPublic: false }), "closed");
  assertEquals(ratingMode({ signedIn: true, isPublic: true }), "rate");
  assertEquals(ratingMode({ signedIn: false, isPublic: true }), "sign-in");
  assertEquals(ratingMode({ signedIn: true }), "rate");
});
