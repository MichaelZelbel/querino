import { startSuggestServer } from "../_shared/suggest.ts";

startSuggestServer({
  feature: "suggest-skill-metadata",
  artifact: "skill",
  bodyFields: ["skill_content"],
  systemPrompt: `You generate concise metadata for reusable AI Skills (text-based frameworks for prompting) in the Querino library.
A Skill describes a reusable thinking framework, methodology, or technique — not a one-off prompt.

Return:
- A short, descriptive title (max 60 chars), naming the framework or technique.
- A single-sentence description (max 160 chars) explaining what the skill helps you do.
- A single category from this fixed list.
- 3–6 lowercase tags (single words or short kebab-case phrases) describing the domain and technique.

Allowed categories:
- Reasoning
- Writing
- Analysis
- Coding
- Research
- Communication
- Productivity
- Decision Making
- Creative
- Other

Pick the single best-fitting category. Tags must be specific, not generic.`,
});
