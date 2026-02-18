
## Add Welcome Message to Prompt Coach on New Prompt Page

### What needs to change

Only **one file** needs a small change: `src/components/studio/PromptCoachPanel.tsx`.

### How it works today

The `messages` state is initialized as an empty array:
```ts
const [messages, setMessages] = useState<ChatMessage[]>([]);
```
When the array is empty, the component renders a static placeholder (bot icon + italic text). No AI call is made on load.

### The fix

The `PromptCoachPanel` already receives props from its parent page. We add one optional boolean prop — `isNewPrompt` — to the component. When `true`, the initial state of `messages` is pre-seeded with the coach's greeting instead of an empty array.

```ts
// NEW optional prop
interface PromptCoachPanelProps {
  ...
  isNewPrompt?: boolean;  // <-- add this
}

// Pre-seed the greeting when on the new prompt page
const [messages, setMessages] = useState<ChatMessage[]>(
  isNewPrompt
    ? [{ role: "assistant", content: "What do you want this prompt to do?" }]
    : []
);
```

The greeting is **hardcoded locally** — no AI API call is fired on page load. This keeps it fast, free, and simple.

### Where the prop gets passed

We need to check where `PromptCoachPanel` is used and pass `isNewPrompt={true}` on the New Prompt page only (not on the Edit page).

### Files to change

| File | Change |
|---|---|
| `src/components/studio/PromptCoachPanel.tsx` | Add optional `isNewPrompt` prop; change `useState` initial value |
| New Prompt page (wherever `PromptCoachPanel` is rendered for `/prompts/new`) | Pass `isNewPrompt={true}` |

### No risk

- No edge function changes
- No database changes
- No new dependencies
- The empty-state placeholder (`messages.length === 0`) already handles the Edit page correctly since `isNewPrompt` defaults to `false`
