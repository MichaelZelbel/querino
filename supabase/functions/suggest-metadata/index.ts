import { startSuggestServer } from "../_shared/suggest.ts";

startSuggestServer({
  feature: "suggest-metadata",
  artifact: "prompt",
  bodyFields: ["prompt_content"],
  systemPrompt: `You generate concise, high-quality metadata for AI prompts in the Querino library.
Return: a short imperative title (max 60 chars), a single-sentence description (max 160 chars, no marketing fluff),
a single category from this fixed list, and 3–6 lowercase tags (single words or short kebab-case phrases).

Allowed categories:
- Writing
- Coding
- Marketing
- Research
- Productivity
- Education
- Business
- Creative
- Analysis
- Other

Pick the single best-fitting category. Tags must be specific to the prompt's domain, not generic ("ai", "prompt").`,
});
