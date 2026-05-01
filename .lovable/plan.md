## Add light/dark mode toggle to the header

The project already has everything needed for theming — it just isn't wired up:
- `next-themes` is in `package.json`
- `tailwind.config.ts` has `darkMode: ["class"]`
- `src/index.css` defines both `:root` (light) and `.dark` (dark) token sets
- `src/components/ui/sonner.tsx` already calls `useTheme()` from `next-themes`

Currently no `ThemeProvider` wraps the app, so the toggle can't take effect without that. Plan:

### 1. Wrap the app with `ThemeProvider`
In `src/main.tsx` (or `src/App.tsx`), wrap the tree with `next-themes` `ThemeProvider`:
- `attribute="class"` so it toggles the `.dark` class on `<html>`
- `defaultTheme="system"`
- `enableSystem`
- `disableTransitionOnChange`

### 2. Create `src/components/ThemeToggle.tsx`
Small icon button using existing shadcn `Button` (variant `ghost`, `size="icon"`):
- Uses `useTheme()` from `next-themes`
- Shows `Sun` icon in light mode, `Moon` in dark (Lucide icons, with the standard rotate/scale transition classes)
- Click cycles `light` ↔ `dark`
- Wrapped in the existing `Tooltip` ("Toggle theme")
- Renders nothing until mounted (avoid SSR/hydration flicker)

### 3. Place it in the header
In `src/components/layout/Header.tsx`:
- Desktop: insert the `ThemeToggle` in the right-side action row, right next to the existing Command Palette button (before the auth/avatar block) — matches the icon-button style already there.
- Mobile: add a row in the mobile menu's bottom section labeled "Theme" with the same toggle, so mobile users can switch too.

### 4. Verify
- Toggle flips `<html class="dark">` on/off
- Existing CSS tokens already cover both themes, so all pages adapt automatically
- `sonner` toaster picks up the theme through its existing `useTheme()` hook

### Files touched
- `src/main.tsx` — add `ThemeProvider` wrapper
- `src/components/ThemeToggle.tsx` — new component
- `src/components/layout/Header.tsx` — mount the toggle (desktop + mobile)

No DB, edge function, or memory changes required.