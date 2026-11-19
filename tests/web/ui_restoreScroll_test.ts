import { assertEquals } from "@std/assert";
import { restoreSavedScroll } from "@/lib/restoreScroll.ts";

function fakeWindow(scrollX = 0, scrollY = 0) {
  const calls: Array<[number, number]> = [];
  return {
    scrollX,
    scrollY,
    calls,
    scrollTo(x: number, y: number) {
      calls.push([x, y]);
      this.scrollX = x;
      this.scrollY = y;
    },
  };
}

Deno.test(
  "Back to a list: the saved position is set before the first paint",
  () => {
    // The list mounts where the detail page left the window, at the top.
    const win = fakeWindow(0, 0);
    assertEquals(restoreSavedScroll({ scrollX: 0, scrollY: 1200 }, win), true);
    assertEquals(win.calls, [[0, 1200]]);
    assertEquals(win.scrollY, 1200);
  },
);

Deno.test(
  "A list opened fresh has nothing saved and is left to the router's move to the top",
  () => {
    const win = fakeWindow(0, 600);
    assertEquals(restoreSavedScroll(undefined, win), false);
    assertEquals(win.calls, []);
  },
);

Deno.test("Already at the saved position: no scroll", () => {
  const win = fakeWindow(0, 446);
  assertEquals(restoreSavedScroll({ scrollX: 0, scrollY: 446 }, win), false);
  assertEquals(win.calls, []);
});

Deno.test("A saved position at the top is restored too", () => {
  const win = fakeWindow(0, 800);
  assertEquals(restoreSavedScroll({ scrollX: 0, scrollY: 0 }, win), true);
  assertEquals(win.calls, [[0, 0]]);
});
