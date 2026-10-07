import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  classificationWindows,
  combineClassifications,
  MAX_MODERATION_ATTEMPTS,
  planAttempt,
  statusAfterFailure,
  violationEmail,
} from "./moderationQueue.ts";

Deno.test(
  "a fresh row is attempt 1, counted before anything is paid for",
  () => {
    assertEquals(planAttempt(0), { giveUp: false, attempt: 1 });
  },
);

Deno.test(
  "a row re-claimed after a killed tick counts the attempt it already had",
  () => {
    // The claim re-issues a stale 'processing' row with the retry_count it
    // had. Attempt 1 wrote 1 before it died, so the re-claim is attempt 2.
    assertEquals(planAttempt(1), { giveUp: false, attempt: 2 });
    assertEquals(planAttempt(2), { giveUp: false, attempt: 3 });
  },
);

Deno.test(
  "a row that has used every attempt is closed without a paid call",
  () => {
    assertEquals(planAttempt(MAX_MODERATION_ATTEMPTS), { giveUp: true });
    assertEquals(planAttempt(MAX_MODERATION_ATTEMPTS + 7), { giveUp: true });
  },
);

Deno.test("a missing or broken count is treated as no attempts yet", () => {
  assertEquals(planAttempt(null), { giveUp: false, attempt: 1 });
  assertEquals(planAttempt(undefined), { giveUp: false, attempt: 1 });
  assertEquals(planAttempt(Number.NaN), { giveUp: false, attempt: 1 });
  assertEquals(planAttempt(-3), { giveUp: false, attempt: 1 });
});

Deno.test(
  "however a tick dies, a row is classified at most MAX times in total",
  () => {
    // Simulate the worst case: every tick is killed right after it counts
    // the attempt and pays, so the row is re-claimed with the count the
    // worker wrote. Before 2026-09-30 nothing was written and this ran for
    // ever.
    let retryCount = 0;
    let paidCalls = 0;
    for (let tick = 0; tick < 50; tick++) {
      const plan = planAttempt(retryCount);
      if (plan.giveUp) break;
      retryCount = plan.attempt; // written before the call
      paidCalls++; // then the tick is killed mid-call
    }
    assertEquals(paidCalls, MAX_MODERATION_ATTEMPTS);
  },
);

Deno.test("a failed attempt goes back to pending until the last one", () => {
  assertEquals(statusAfterFailure(1), "pending");
  assertEquals(statusAfterFailure(MAX_MODERATION_ATTEMPTS - 1), "pending");
  assertEquals(statusAfterFailure(MAX_MODERATION_ATTEMPTS), "error");
});

Deno.test("the violation email escapes the title the author chose", () => {
  const mail = violationEmail({
    itemType: "prompt",
    title: '<a href="https://evil.example">Click to restore</a>',
    category: "hate",
  });
  assertEquals(mail.html.includes('<a href="https://evil.example"'), false);
  assertStringIncludes(
    mail.html,
    "&lt;a href=&quot;https://evil.example&quot;&gt;",
  );
  assertStringIncludes(mail.html, "Hateful or abusive content");
});

Deno.test("the violation email subject is one line", () => {
  const mail = violationEmail({
    itemType: "skill",
    title: "Nice\r\nBcc: someone@example.com",
    category: "none-of-the-above",
  });
  assertEquals(/[\r\n]/.test(mail.subject), false);
  assertStringIncludes(mail.html, "Content policy violation");
});

Deno.test("an untitled artifact is called Untitled", () => {
  const mail = violationEmail({
    itemType: "workflow",
    title: null,
    category: "pii",
  });
  assertStringIncludes(mail.subject, '"Untitled"');
});

Deno.test("short text is read in one slice, whole", () => {
  const w = classificationWindows("hello", 12_000, 500, 8);
  assertEquals(w.windows, ["hello"]);
  assertEquals(w.coveredChars, 5);
  assertEquals(w.totalChars, 5);
});

Deno.test(
  "long text is read to the end in overlapping slices, not cut at 4,000",
  () => {
    const text = "a".repeat(29_000) + "TAIL";
    const w = classificationWindows(text, 12_000, 500, 8);
    assertEquals(w.windows.length, 3);
    assertEquals(w.coveredChars, text.length);
    assertStringIncludes(w.windows[w.windows.length - 1], "TAIL");
    // Each slice starts 500 characters before the previous one ended.
    assertEquals(w.windows[1].slice(0, 500), w.windows[0].slice(-500));
  },
);

Deno.test("text past the last slice is reported as not read", () => {
  const w = classificationWindows("x".repeat(100_000), 12_000, 500, 8);
  assertEquals(w.windows.length, 8);
  assertEquals(w.coveredChars, 7 * 11_500 + 12_000);
  assertEquals(w.totalChars, 100_000);
});

Deno.test("text exactly one slice long needs no second slice", () => {
  assertEquals(classificationWindows("y".repeat(12_000)).windows.length, 1);
  assertEquals(classificationWindows("y".repeat(12_001)).windows.length, 2);
});

Deno.test(
  "one confident violation in any slice decides, however safe the rest",
  () => {
    const safe = {
      safe: true,
      category: "none",
      confidence: 0.99,
      reason: "ok",
    };
    const weak = {
      safe: false,
      category: "pii",
      confidence: 0.4,
      reason: "maybe",
    };
    const strong = {
      safe: false,
      category: "malware",
      confidence: 0.95,
      reason: "payload",
    };
    assertEquals(combineClassifications([safe, weak, strong, safe]), strong);
    assertEquals(combineClassifications([safe, weak]), weak);
    assertEquals(combineClassifications([safe, safe]), safe);
  },
);

Deno.test(
  "a removed comment gets its own mail, not the unpublished one",
  () => {
    const { subject, html } = violationEmail({
      itemType: "comment",
      title: null,
      category: "hate",
    });
    assertStringIncludes(subject, "comment");
    assertStringIncludes(html, "replaced with a note");
    assertEquals(html.includes("set to private"), false);
  },
);
