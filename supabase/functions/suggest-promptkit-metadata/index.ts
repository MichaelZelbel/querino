import { startSuggestServer } from "../_shared/suggest.ts";

startSuggestServer({
  feature: "suggest-promptkit-metadata",
  artifact: "prompt kit",
  bodyFields: ["kit_content", "prompt_kit_content", "content"],
  systemPrompt: `You generate concise metadata for Prompt Kits in the Querino library.
A Prompt Kit is a single Markdown document bundling multiple related prompts. Each prompt inside starts with a "## Prompt: <Title>" heading.

Return:
- A short, descriptive title (max 60 chars) naming the bundle / use case (NOT a single prompt).
- A single-sentence description (max 160 chars) explaining what use case the kit covers as a whole.
- A single category from this fixed list.
- 3–6 lowercase tags (single words or short kebab-case phrases). Tags should describe the kit's domain and the type of prompts inside.

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

Pick the single best-fitting category for the kit overall. Tags must be specific to the kit's domain, not generic ("ai", "prompt", "kit").`,
});
