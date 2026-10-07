import { assertEquals } from "@std/assert";
import {
  COACH_OWNER_KEY,
  settleCoachChats,
  shouldForgetCoachChats,
} from "@/lib/coachChats.ts";

// The AI coach chats quote whole artifacts, private and team ones included,
// and used to stay in localStorage after sign-out and account switches
// (2026-10-07).
Deno.test("coach chats go on sign-out and on another account", () => {
  // Signed out in this tab.
  assertEquals(shouldForgetCoachChats(null, "a", "a"), true);
  // Another account signs in, in this tab or after a reload.
  assertEquals(shouldForgetCoachChats("b", "a", "a"), true);
  assertEquals(shouldForgetCoachChats("b", undefined, "a"), true);
  assertEquals(shouldForgetCoachChats("b", null, "a"), true);
});

Deno.test("coach chats stay for their own account and a doubtful start", () => {
  assertEquals(shouldForgetCoachChats("a", undefined, "a"), false);
  assertEquals(shouldForgetCoachChats("a", null, "a"), false);
  // Chats from before the owner was recorded are kept for whoever is here.
  assertEquals(shouldForgetCoachChats("a", undefined, null), false);
  // "Nobody" as the first answer may be a network hiccup, not a sign-out.
  assertEquals(shouldForgetCoachChats(null, undefined, "a"), false);
});

Deno.test(
  "settling removes the chats and the session ids, nothing else",
  () => {
    const store = new Map<string, string>();
    const g = globalThis as { window?: unknown };
    const previous = g.window;
    g.window = {
      localStorage: {
        get length() {
          return store.size;
        },
        key: (i: number) => [...store.keys()][i] ?? null,
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
    try {
      store.set(COACH_OWNER_KEY, "a");
      store.set("prompt_coach_messages:ws:a:p1", "[]");
      store.set("prompt_coach_messages:5f0c-draft", "[]");
      store.set("prompt_coach_session:prompt:ws:a:p1", "ws:a:p1");
      store.set("querino_current_workspace", "team-1");

      settleCoachChats("a", undefined);
      assertEquals(store.get("prompt_coach_messages:ws:a:p1"), "[]");

      settleCoachChats("b", "a");
      assertEquals(
        [...store.keys()].filter((k) => k.startsWith("prompt_coach_")),
        [],
      );
      assertEquals(store.get("querino_current_workspace"), "team-1");
      assertEquals(store.get(COACH_OWNER_KEY), "b");

      settleCoachChats(null, "b");
      assertEquals(store.has(COACH_OWNER_KEY), false);
    } finally {
      g.window = previous;
    }
  },
);
