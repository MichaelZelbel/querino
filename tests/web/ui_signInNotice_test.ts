import { assertEquals } from "@std/assert";
import { signInNotice, signInNoticeSentence } from "@/lib/signInNotice.ts";

Deno.test("the four edit addresses read the same way, naming the type", () => {
  assertEquals(
    signInNoticeSentence("/skills/my-skill/edit"),
    "Sign in to edit this skill.",
  );
  assertEquals(
    signInNoticeSentence("/workflows/my-flow/edit"),
    "Sign in to edit this workflow.",
  );
  assertEquals(
    signInNoticeSentence("/prompt-kits/my-kit/edit"),
    "Sign in to edit this prompt kit.",
  );
  assertEquals(
    signInNoticeSentence("/prompts/my-prompt/edit"),
    "Sign in to edit this prompt.",
  );
  // The prompt edit page also answers at its older /library address.
  assertEquals(
    signInNoticeSentence("/library/my-prompt/edit"),
    "Sign in to edit this prompt.",
  );
});

Deno.test("the other notices keep their meaning", () => {
  const cases: Array<[string, string]> = [
    ["/dashboard", "Sign in to access your dashboard."],
    ["/library", "Sign in to access your library."],
    ["/settings", "Sign in to access your settings."],
    ["/activity", "Sign in to access your activity feed."],
    ["/collections", "Sign in to access your collections."],
    ["/prompts/new", "Sign in to create a new prompt."],
    ["/skills/new", "Sign in to create a new skill."],
    ["/workflows/new", "Sign in to create a new workflow."],
    ["/prompt-kits/new", "Sign in to create a new prompt kit."],
    ["/team/abc/settings", "Sign in to access your team workspace."],
    ["/library/my-prompt/versions", "Sign in to access this page."],
  ];
  for (const [path, sentence] of cases) {
    assertEquals(signInNoticeSentence(path), sentence, path);
  }
});

Deno.test("no notice says 'access create' or 'access edit'", () => {
  for (
    const path of [
      "/prompts/new",
      "/skills/new",
      "/workflows/new",
      "/prompt-kits/new",
      "/prompts/a/edit",
      "/skills/a/edit",
      "/workflows/a/edit",
      "/prompt-kits/a/edit",
      "/library/a/edit",
    ]
  ) {
    const sentence = signInNoticeSentence(path) ?? "";
    assertEquals(/access (create|edit)/.test(sentence), false, sentence);
  }
});

Deno.test("a query string or hash does not change the notice", () => {
  assertEquals(
    signInNoticeSentence("/dashboard?tab=x"),
    "Sign in to access your dashboard.",
  );
  assertEquals(
    signInNoticeSentence("/skills/a/edit#top"),
    "Sign in to edit this skill.",
  );
});

Deno.test("no redirect, or the home page, shows no notice", () => {
  assertEquals(signInNotice(null), null);
  assertEquals(signInNotice(""), null);
  assertEquals(signInNotice("/"), null);
});
