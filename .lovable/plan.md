

## Plan: Remove Premium Gate from Metadata Suggestion Button

All 9 files that have the "Suggest title, description, category & tags" button currently gate it behind `isPremium`. The change is to remove the premium check from the `disabled` prop and remove the Lock icon / tooltip, while keeping the existing `checkCredits()` guard in the handler.

### Files to update (same pattern in each):

1. **`src/components/prompts/PromptForm.tsx`** — Remove `!isPremium` from disabled, remove Lock icon, remove premium tooltip
2. **`src/pages/PromptNew.tsx`** — Same
3. **`src/pages/LibraryPromptEdit.tsx`** — Same
4. **`src/pages/SkillNew.tsx`** — Same
5. **`src/pages/SkillEdit.tsx`** — Same
6. **`src/pages/WorkflowNew.tsx`** — Same
7. **`src/pages/WorkflowEdit.tsx`** — Same
8. **`src/pages/ClawNew.tsx`** — Same (2 buttons)
9. **`src/pages/ClawEdit.tsx`** — Same

### Per-file changes:

- **Button `disabled` prop**: Change from `disabled={!isPremium || isGeneratingMetadata || !content.trim()}` to `disabled={isGeneratingMetadata || !content.trim()}`
- **Lock icon**: Remove the `{!isPremium && <Lock ... />}` conditional
- **Tooltip**: Remove the `{!isPremium && <TooltipContent>...</TooltipContent>}` block (the Tooltip wrapper can stay or be simplified)
- **Import cleanup**: Remove `usePremiumCheck` import and `isPremium` destructure if no longer used elsewhere in the file; remove `Lock` from lucide imports if unused

The `checkCredits()` call already exists in each `handleSuggestMetadata` function, so the AI credits gate remains intact for all users.

