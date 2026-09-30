import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CANVAS_TRUNCATE,
  buildUserTurn,
  prepareCanvas,
  shapeCoachReply,
} from "./coach.ts";

const LONG = "x".repeat(CANVAS_TRUNCATE + 5_000);

Deno.test("a canvas within the limit reaches the model whole", () => {
  const canvas = prepareCanvas("short text");
  assertEquals(canvas, { text: "short text", truncated: false, length: 10 });
});

Deno.test("a longer canvas is cut and says so", () => {
  const canvas = prepareCanvas(LONG);
  assertEquals(canvas.text.length, CANVAS_TRUNCATE);
  assertEquals(canvas.truncated, true);
  assertEquals(canvas.length, LONG.length);
});

Deno.test("anything that is not text is an empty canvas", () => {
  assertEquals(prepareCanvas(undefined), {
    text: "",
    truncated: false,
    length: 0,
  });
  assertEquals(prepareCanvas({ a: 1 }), {
    text: "",
    truncated: false,
    length: 0,
  });
});

Deno.test(
  "an edit of a cut canvas never reaches the editor (it would drop the tail)",
  () => {
    // The model saw the first 16,000 characters and answered with a "full"
    // canvas of about that size. Applied, it replaced a 21,000-character
    // artifact with 16,000 characters, and a save made that permanent.
    const reply = shapeCoachReply(
      {
        assistantMessage: "Tightened the intro.",
        canvas: {
          updated: true,
          content: "x".repeat(CANVAS_TRUNCATE),
          changeNote: "Tighter",
        },
      },
      "collab_edit",
      prepareCanvas(LONG),
      "skill",
    );
    assertEquals(reply.canvas, { updated: false });
    assertStringIncludes(reply.assistantMessage, "Tightened the intro.");
    assertStringIncludes(reply.assistantMessage, "16,000");
    assertStringIncludes(reply.assistantMessage, "21,000");
    assertStringIncludes(reply.assistantMessage, "skill");
  },
);

Deno.test("an edit of a whole canvas still goes through", () => {
  const reply = shapeCoachReply(
    {
      assistantMessage: "Done",
      canvas: { updated: true, content: "new text", changeNote: "Rewrote" },
    },
    "collab_edit",
    prepareCanvas("old text"),
    "prompt",
  );
  assertEquals(reply, {
    assistantMessage: "Done",
    canvas: { updated: true, content: "new text", changeNote: "Rewrote" },
  });
});

Deno.test("chat_only never edits, and needs no note about length", () => {
  const reply = shapeCoachReply(
    {
      assistantMessage: "Here is what I think",
      canvas: { updated: true, content: "y" },
    },
    "chat_only",
    prepareCanvas(LONG),
    "skill",
  );
  assertEquals(reply, {
    assistantMessage: "Here is what I think",
    canvas: { updated: false },
  });
});

Deno.test("a reply that is not an object is an empty reply, not a 500", () => {
  assertEquals(
    shapeCoachReply(null, "collab_edit", prepareCanvas("a"), "prompt"),
    {
      assistantMessage: "Done.",
      canvas: { updated: false },
    },
  );
  assertEquals(
    shapeCoachReply(
      { canvas: { updated: true } },
      "collab_edit",
      prepareCanvas("a"),
      "prompt",
    ).canvas,
    { updated: false },
  );
});

Deno.test(
  "the model is told the canvas was cut, and asked not to rewrite it",
  () => {
    const turn = buildUserTurn(
      "collab_edit",
      "make it shorter",
      prepareCanvas(LONG),
      "",
    );
    assertStringIncludes(turn, "mode: chat_only");
    assertStringIncludes(
      turn,
      `first ${CANVAS_TRUNCATE} of ${LONG.length} characters`,
    );
    const whole = buildUserTurn(
      "collab_edit",
      "make it shorter",
      prepareCanvas("abc"),
      "",
    );
    assertStringIncludes(whole, "mode: collab_edit");
    assertEquals(whole.includes("characters"), false);
  },
);
