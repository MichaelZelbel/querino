

# Make "Suggest metadata" button subtly visible

## Problem
The "Suggest title, description, category & tags" button uses `variant="ghost"` with `text-muted-foreground`, making it essentially invisible (white-on-white) until hovered.

## Solution
Change from `variant="ghost"` to `variant="outline"` and remove the forced `text-muted-foreground` class. This gives the button a subtle border so it's discoverable, without being loud or attention-grabbing. The Sparkles icon already provides a visual hint of its AI nature.

## Files to update (9 occurrences across 9 files)

All use the same pattern -- change:
```
variant="ghost"
className="gap-1.5 text-muted-foreground hover:text-foreground"
```
to:
```
variant="outline"
className="gap-1.5"
```

1. `src/pages/PromptNew.tsx`
2. `src/pages/LibraryPromptEdit.tsx`
3. `src/pages/SkillNew.tsx`
4. `src/pages/SkillEdit.tsx`
5. `src/pages/WorkflowNew.tsx`
6. `src/pages/WorkflowEdit.tsx`
7. `src/pages/ClawNew.tsx` (2 occurrences)
8. `src/pages/ClawEdit.tsx`
9. `src/components/prompts/PromptForm.tsx`

This is a minimal, consistent change -- the outline variant provides just enough visual weight (a thin border) to be discoverable without being pushy.
