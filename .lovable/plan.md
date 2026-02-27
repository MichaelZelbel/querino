

## Plan: Artifact Translation Feature

### Overview
Add a "Translate" button on each artifact detail page (Prompt, Skill, Workflow, Claw) that opens a language picker modal. When the user selects a target language, a new edge function calls Lovable AI to translate the title, description, content, and tags, then navigates to the corresponding "Create New" page with all fields prefilled.

### Architecture

```text
Detail Page → [Translate button] → TranslateModal (pick target language)
                                          ↓
                              supabase.functions.invoke("translate-artifact")
                                          ↓
                              Edge function calls Lovable AI Gateway
                                          ↓
                              Returns { title, description, content, tags }
                                          ↓
                              Navigate to /prompts/new?title=...&content=...&language=de
```

The edge function will be designed with a `provider` abstraction so swapping to n8n later is a config change, not a rewrite.

### Implementation Steps

**1. Create edge function `translate-artifact`**
- File: `supabase/functions/translate-artifact/index.ts`
- Accepts: `{ artifactType, title, description, content, tags, sourceLanguage, targetLanguage }`
- Uses LOVABLE_API_KEY + Lovable AI Gateway (google/gemini-3-flash-preview)
- System prompt instructs the LLM to translate all fields, returning structured JSON via tool calling
- Returns: `{ title, description, content, tags }` (translated)
- Handles 429/402 errors properly
- Add to `supabase/config.toml` with `verify_jwt = false`

**2. Create shared `TranslateModal` component**
- File: `src/components/shared/TranslateModal.tsx`
- Props: `artifactType`, `sourceLanguage`, `title`, `description`, `content`, `tags`, `category`, `open`, `onOpenChange`
- Shows a language dropdown (filtered to exclude current artifact language)
- On confirm: calls the edge function, shows loading state, then navigates to the "Create New" page with URL params
- Gated by `checkCredits()` (AI credits gate, available to all users)

**3. Add URL param prefilling to SkillNew and WorkflowNew**
- SkillNew.tsx and WorkflowNew.tsx currently don't read URL search params
- Add `useSearchParams` support for `title`, `description`, `content`, `tags`, `category`, `language` — same pattern as PromptNew.tsx
- ClawNew.tsx already partially supports this; extend it to include `language` and `tags`

**4. Add "Translate" button to all 4 detail pages**
- PromptDetail.tsx, SkillDetail.tsx, WorkflowDetail.tsx, ClawDetail.tsx
- Place alongside existing action buttons (near Clone/Copy)
- Visible to all logged-in users
- Icon: `Languages` from lucide-react

### Technical Details

**Edge function prompt strategy:**
- Use tool calling (not raw JSON) to extract structured output
- Tool schema: `translate_artifact` with properties `title`, `description`, `content`, `tags[]`
- System prompt: "Translate the following artifact from {sourceLanguage} to {targetLanguage}. Preserve formatting, markdown structure, and template variables like {{variable}}. Translate tags contextually."

**n8n-readiness:**
- The edge function will check for an optional `TRANSLATION_PROVIDER` env var (default: `"lovable"`)
- When set to `"n8n"`, it will proxy to the n8n webhook instead — same input/output contract
- This makes the n8n migration a single env var change + n8n workflow creation

**Files to create:**
1. `supabase/functions/translate-artifact/index.ts`
2. `src/components/shared/TranslateModal.tsx`

**Files to modify:**
1. `supabase/config.toml` — add translate-artifact function
2. `src/pages/PromptDetail.tsx` — add Translate button + TranslateModal
3. `src/pages/SkillDetail.tsx` — add Translate button + TranslateModal
4. `src/pages/WorkflowDetail.tsx` — add Translate button + TranslateModal
5. `src/pages/ClawDetail.tsx` — add Translate button + TranslateModal
6. `src/pages/SkillNew.tsx` — add URL param prefilling
7. `src/pages/WorkflowNew.tsx` — add URL param prefilling
8. `src/pages/ClawNew.tsx` — extend URL param prefilling (add language, tags)

