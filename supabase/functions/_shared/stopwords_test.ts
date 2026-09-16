import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { findStopwordHits, normalizeText } from "./stopwords.ts";

function words(...list: string[]) {
  return list.map((word) => ({ word, category: "test" }));
}

function hitWords(text: string, ...list: string[]): string[] {
  return findStopwordHits(text, words(...list)).map((h) => h.word);
}

Deno.test("normalizeText: leet, punctuation and repeats collapse", () => {
  assertStrictEquals(normalizeText("S3x!"), "sexi");
  assertStrictEquals(normalizeText("seeex"), "seex");
  assertStrictEquals(normalizeText("  Rm   -rf  /  "), "rm rf");
});

Deno.test("a whole word still hits", () => {
  assertEquals(hitWords("phishing awareness training", "phishing"), [
    "phishing",
  ]);
});

Deno.test("a stopword inside a longer word does not hit", () => {
  assertEquals(hitWords("a conspicuous choice", "spic"), []);
  assertEquals(hitWords("denude the hillside", "nude"), []);
  // Each is a substring of "windows"; neither is a word of its own there.
  assertEquals(hitWords("windows 10", "win", "dow"), []);
});

Deno.test("a multi-word stopword with punctuation matches the text", () => {
  assertEquals(hitWords("please run rm -rf / now", "rm -rf"), ["rm -rf"]);
  assertEquals(hitWords("then format c: and reboot", "format c:"), [
    "format c:",
  ]);
});

Deno.test("a multi-word stopword needs the whole phrase", () => {
  assertEquals(hitWords("rm the rf folder", "rm -rf"), []);
});

Deno.test("a stopword that normalises to nothing is ignored", () => {
  assertEquals(hitWords("anything at all", "---", "***", ""), []);
});

Deno.test("hits carry the stored word and its category", () => {
  const hits = findStopwordHits("a phishing kit", [
    { word: "phishing", category: "malware" },
    { word: "kit", category: null },
  ]);
  assertEquals(hits, [
    { word: "phishing", category: "malware" },
    { word: "kit", category: null },
  ]);
});
