import { assertEquals } from "@std/assert";
import {
  getActionLabel,
  itemDisplayTitle,
  itemTypeLabel,
} from "@/components/activity/activityLabels.ts";

Deno.test("every action the app records reads as a sentence", () => {
  // All 13 events in production on 2026-09-30 were one of these two, and the
  // feed printed "performed ai_insights_generated on a prompt".
  assertEquals(
    getActionLabel("ai_insights_generated", "prompt"),
    "generated AI insights for a prompt",
  );
  assertEquals(
    getActionLabel("ai_insights_refreshed", "skill"),
    "refreshed the AI insights of a skill",
  );
  assertEquals(
    getActionLabel("comment", "workflow"),
    "commented on a workflow",
  );
  assertEquals(
    getActionLabel("publish", "prompt_kit"),
    "published a prompt kit",
  );
  assertEquals(getActionLabel("something_new", "prompt"), "changed a prompt");
  assertEquals(getActionLabel("create", null), "created an item");
});

Deno.test("no column value reaches the page", () => {
  assertEquals(itemTypeLabel("prompt_kit"), "prompt kit");
  assertEquals(itemTypeLabel("some_future_type"), "some future type");
});

Deno.test("an event without a title names the kind of item", () => {
  assertEquals(itemDisplayTitle({}, "prompt_kit"), "Prompt kit");
  assertEquals(itemDisplayTitle(null, "skill"), "Skill");
  assertEquals(itemDisplayTitle({ title: "My prompt" }, "prompt"), "My prompt");
  assertEquals(itemDisplayTitle({ name: "Team A" }, "team"), "Team A");
});
