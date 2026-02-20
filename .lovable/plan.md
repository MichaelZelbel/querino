

# Add Line-Numbered Editor to Skills and Workflows

## What changes

Extract the line-numbered editor pattern already used in Prompt creation/editing into a shared component, then use it across all content editors for consistency.

## Pages affected

| Page | File | Current editor |
|------|------|----------------|
| Create Skill | `src/pages/SkillNew.tsx` | Plain `<Textarea>` |
| Edit Skill | `src/pages/SkillEdit.tsx` | Plain `<Textarea>` |
| Create Workflow | `src/pages/WorkflowNew.tsx` | Plain `<Textarea>` |
| Edit Workflow | `src/pages/WorkflowEdit.tsx` | Plain `<Textarea>` |

The two Prompt pages (`PromptNew.tsx`, `LibraryPromptEdit.tsx`) already have inline versions of this editor and will be refactored to use the shared component too, reducing duplication.

## Implementation

### Step 1: Create shared component
Create `src/components/editors/LineNumberedEditor.tsx` -- a reusable wrapper that renders a line-number gutter alongside a `<Textarea>`. Props: `value`, `onChange`, `placeholder`, `error` (boolean), `minHeight` (optional, default 300px).

### Step 2: Replace plain textareas in 4 pages
Swap the content `<Textarea>` in `SkillNew`, `SkillEdit`, `WorkflowNew`, and `WorkflowEdit` with the new `<LineNumberedEditor>` component.

### Step 3: Refactor existing Prompt pages
Replace the inline `renderLineNumberedEditor()` functions in `PromptNew.tsx` and `LibraryPromptEdit.tsx` with the shared component to eliminate code duplication.

## Technical details

The shared component mirrors the existing pattern from `PromptNew.tsx`:
- A flex container with a line-number gutter (monospace, right-aligned, muted color, border-right)
- The textarea sits next to it with matching `leading-[1.7rem]` line height
- Line numbers update dynamically based on newline count in the value
- The outer wrapper has `rounded-md border border-input bg-background overflow-hidden`
- Supports `resize-y` and `min-h-[300px]` by default

