import { assertEquals } from "@std/assert";
import {
  CONSENT_KEY,
  forgetScrollPositions,
  keepConveniencesInMemory,
  mayRemember,
  PREFERRED_LLM_KEY,
  saveConsent,
} from "@/lib/consent.ts";
import { getPreferredLLM, setPreferredLLM } from "@/lib/openLLM.ts";

// Issue #52: with "Just the essentials" a Send button still left the preferred
// assistant in localStorage, and browsing left the router's scroll positions in
// sessionStorage. Only "Accept all" may keep either beyond the page visit.

function fakeStorage(store: Map<string, string>) {
  return {
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
}

function withWindow(
  local: Map<string, string>,
  session: Map<string, string>,
  run: (pagehide: () => void) => void,
) {
  const g = globalThis as { window?: unknown; document?: unknown };
  const previous = { window: g.window, document: g.document };
  const onPagehide: (() => void)[] = [];
  g.window = {
    localStorage: fakeStorage(local),
    sessionStorage: fakeStorage(session),
    addEventListener: (type: string, listener: () => void) => {
      if (type === "pagehide") onPagehide.push(listener);
    },
  };
  g.document = { cookie: "" };
  try {
    run(() => onPagehide.forEach((listener) => listener()));
  } finally {
    g.window = previous.window;
    g.document = previous.document;
  }
}

Deno.test("only Accept all lets a convenience outlive the page visit", () => {
  assertEquals(mayRemember(null), false);
  assertEquals(mayRemember("essential"), false);
  assertEquals(mayRemember("all"), true);
});

// openLLM keeps the visit's preference in module state, so these run in order.
Deno.test(
  "Just the essentials: the preferred assistant stays in memory",
  () => {
    const local = new Map([
      [CONSENT_KEY, "essential"],
      [PREFERRED_LLM_KEY, "chatgpt"],
    ]);
    withWindow(local, new Map(), () => {
      assertEquals(getPreferredLLM(), null);
      setPreferredLLM("claude");
      assertEquals(local.get(PREFERRED_LLM_KEY), "chatgpt");
      assertEquals(getPreferredLLM(), "claude");
    });
  },
);

Deno.test("no choice yet: nothing is stored", () => {
  const local = new Map<string, string>();
  withWindow(local, new Map(), () => {
    setPreferredLLM("perplexity");
    assertEquals(local.size, 0);
  });
});

Deno.test("Accept all: the preferred assistant is remembered", () => {
  const local = new Map([[CONSENT_KEY, "all"]]);
  withWindow(local, new Map(), () => {
    setPreferredLLM("gemini");
    assertEquals(local.get(PREFERRED_LLM_KEY), "gemini");
  });
});

Deno.test("scroll positions go, other session entries stay", () => {
  const session = new Map([
    ["tsr-scroll-restoration-v1_3", "{}"],
    ["querino_draft_handoff", "x"],
  ]);
  withWindow(new Map(), session, () => {
    forgetScrollPositions();
    assertEquals([...session.keys()], ["querino_draft_handoff"]);
  });
});

Deno.test("choosing Just the essentials removes what Accept all kept", () => {
  const local = new Map([
    [CONSENT_KEY, "all"],
    [PREFERRED_LLM_KEY, "claude"],
  ]);
  const session = new Map([["tsr-scroll-restoration-v1_3", "{}"]]);
  withWindow(local, session, () => {
    saveConsent("essential");
    assertEquals([...local.entries()], [[CONSENT_KEY, "essential"]]);
    assertEquals(session.size, 0);
  });
});

// The router writes its scroll positions on pagehide; an entry stored before
// the choice governed the preference is still there for an earlier visitor.
function leavePage(consent: string | null) {
  const local = new Map([[PREFERRED_LLM_KEY, "chatgpt"]]);
  if (consent) local.set(CONSENT_KEY, consent);
  const session = new Map([["querino_draft_handoff", "x"]]);
  withWindow(local, session, (pagehide) => {
    keepConveniencesInMemory();
    session.set("tsr-scroll-restoration-v1_3", "{}");
    pagehide();
  });
  return { local: [...local.keys()], session: [...session.keys()] };
}

Deno.test(
  "leaving the page with Just the essentials leaves only the choice",
  () => {
    assertEquals(leavePage("essential"), {
      local: [CONSENT_KEY],
      session: ["querino_draft_handoff"],
    });
  },
);

Deno.test("leaving the page before any choice leaves nothing", () => {
  assertEquals(leavePage(null), {
    local: [],
    session: ["querino_draft_handoff"],
  });
});

Deno.test("leaving the page with Accept all keeps both", () => {
  assertEquals(leavePage("all"), {
    local: [PREFERRED_LLM_KEY, CONSENT_KEY],
    session: ["querino_draft_handoff", "tsr-scroll-restoration-v1_3"],
  });
});
