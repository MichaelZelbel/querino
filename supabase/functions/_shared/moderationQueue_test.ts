import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
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
