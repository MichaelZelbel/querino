

## Problem

The `LanguageSelect` component is imported in `LibraryPromptEdit.tsx` but never rendered in the form JSX. The language field goes between Category and Tags (matching `PromptForm.tsx` pattern), but is missing from the edit page's inline form.

## Plan

**File: `src/pages/LibraryPromptEdit.tsx`**

Add `<LanguageSelect value={language} onChange={setLanguage} />` between the Category block (ends ~line 889) and the Tags block (starts ~line 892):

```tsx
{/* Language */}
<LanguageSelect value={language} onChange={setLanguage} />
```

Single insertion, no other changes needed — the import and state (`language`, `setLanguage`) already exist.

