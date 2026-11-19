import { assert, assertEquals } from "@std/assert";
import {
  baselineLoaded,
  initialSaveState,
  isDirtyAgainst,
  recordSave,
} from "@/lib/saveState.ts";

const loaded = { title: "Skill", tags: ["a"] };

Deno.test("loading a row sets the baseline but records no save (#83)", () => {
  // Every editor took its loaded row as saved, and the footer read
  // "Saved · just now" before the user had saved anything.
  const state = baselineLoaded(initialSaveState, loaded);
  assertEquals(state.savedAt, null);
  assertEquals(isDirtyAgainst(state, loaded), false);
  assertEquals(isDirtyAgainst(state, { ...loaded, title: "Edited" }), true);
});

Deno.test("a real save sets the baseline and stamps the save time", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  const edited = { ...loaded, title: "Edited" };
  const state = recordSave(
    baselineLoaded(initialSaveState, loaded),
    edited,
    now,
  );
  assertEquals(state.savedAt, now);
  assertEquals(isDirtyAgainst(state, edited), false);
  assertEquals(isDirtyAgainst(state, loaded), true);
});

Deno.test("a reload after a save keeps the time of that save", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  const saved = recordSave(initialSaveState, loaded, now);
  const reloaded = baselineLoaded(saved, { ...loaded, title: "From DB" });
  assertEquals(reloaded.savedAt, now);
  assertEquals(
    isDirtyAgainst(reloaded, { ...loaded, title: "From DB" }),
    false,
  );
});

Deno.test("nothing is dirty before a baseline exists", () => {
  assert(!isDirtyAgainst(initialSaveState, loaded));
});
