

# UX Audit: Identified Problem Areas and Fixes

After reviewing all key pages (Detail views, Library, Create/Edit pages, Discover, Header), here are the UX issues I found and proposed fixes.

---

## Issue 1: Action buttons below content canvas are unreachable on long prompts

**Where:** PromptDetail, SkillDetail, WorkflowDetail pages

**Problem:** The action bar (Copy, Save, Edit, Pin, Clone, Refine, etc.) is placed *after* the content `<pre>` block. For long prompts, users must scroll past potentially hundreds of lines to find the buttons. This is the most impactful UX issue.

**Fix:** Move the primary action bar *above* the content canvas (between the header/meta section and the content). Keep it as a `flex-wrap` row. Optionally also make it sticky so it stays visible while scrolling through long content.

---

## Issue 2: Library page has no "Create" button

**Where:** `/library` page

**Problem:** The Library page shows all your content but has no visible "Create New Prompt/Skill/Workflow" button on the page itself. The only way to create is via the header's small "Create" dropdown. For a page that's the user's home base, there should be an obvious call-to-action.

**Fix:** Add a prominent "+ Create" button (or a small row of quick-create buttons) next to the "Sync to GitHub" button in the Library page header area.

---

## Issue 3: "Create" button on New pages is easy to confuse with Coach chat

**Where:** `/prompts/new`, `/skills/new`, `/workflows/new`

**Problem:** On desktop, the layout is a two-column split: editor on the left, AI Coach on the right. The "Create Prompt" button is in the top-right corner of the top bar, visually close to the AI Coach panel. Users may think it belongs to the coach rather than the editor form. Additionally, scrolling down the form pushes the button out of view.

**Fix:** 
- Add a second "Create" button at the bottom of the form (after all fields), so users who scroll down can submit without scrolling back up.
- Visually separate the top "Create" button from the Coach panel (e.g., add a subtle divider or place it closer to the form heading).

---

## Issue 4: Detail page "Send to LLM" section buried below action bar

**Where:** PromptDetail page

**Problem:** The "Send to LLM" buttons section appears *after* the large action bar and *after* the modals block in the JSX. It's easy to miss entirely, even though it's a key feature.

**Fix:** Move the "Send to LLM" section directly below the content canvas (and above the action buttons), or integrate it into the action bar itself as a dropdown button.

---

## Issue 5: No quick "Copy" button directly on the content canvas

**Where:** PromptDetail, SkillDetail content blocks

**Problem:** The content block is a plain `<pre>` without a copy button on the block itself. Users must find the "Copy Prompt" button in the action bar (which may be far away, per Issue 1).

**Fix:** Add a small floating "Copy" icon button in the top-right corner of the content `<pre>` block, similar to how code blocks work in documentation sites.

---

## Issue 6: Inconsistent back-link destinations on Detail pages

**Where:** PromptDetail, SkillDetail

**Problem:** Both always link "Back to Discover" even if the user came from their Library. This can be disorienting.

**Fix:** Either detect the referrer and show contextual back text, or simply change it to a generic "Back" with `navigate(-1)` behavior (with a fallback to `/discover`).

---

## Technical Implementation Plan

### Files to modify:

1. **`src/pages/PromptDetail.tsx`**
   - Move the action bar `<div>` (lines 407-570) to above the content section (before line 382)
   - Add a floating copy button to the content `<pre>` block
   - Move "Send to LLM" up to just after the content block
   - Change back link to use `navigate(-1)` with fallback

2. **`src/pages/SkillDetail.tsx`**
   - Same pattern: move action bar (lines 289-374) above content (before line 278)
   - Add floating copy button to content block
   - Change back link behavior

3. **`src/pages/WorkflowDetail.tsx`**
   - Same pattern as above (need to verify structure, likely mirrors SkillDetail)

4. **`src/pages/Library.tsx`**
   - Add a `+ Create` dropdown button in the page header area (lines 377-393), next to the GitHub sync button

5. **`src/pages/PromptNew.tsx`**
   - Add a duplicate "Create Prompt" button at the bottom of the form (after the visibility toggle, around line 530)

6. **`src/pages/SkillNew.tsx`**
   - Add a duplicate "Create Skill" button at the bottom of the form (after line 382)

7. **`src/pages/WorkflowNew.tsx`**
   - Add a duplicate "Create Workflow" button at the bottom of the form (after line 387)

