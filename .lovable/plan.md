## Problem

Im Prompt-Kit-Editor sehen H1/H2/H3 aus wie Normaltext. Zwei Ursachen:

1. **Duplicate Underline-Extension** – `StarterKit` enthält bereits `Underline`, wir registrieren ihn zusätzlich noch einmal. Tiptap meldet `Duplicate extension names found: ['underline']`. Das destabilisiert die Extension-Registrierung.
2. **Kein sichtbares Heading-Styling** – Tailwind setzt Headings standardmäßig auf `1em` zurück (Preflight). Die `prose`-Klasse stylt zwar Headings, aber durch die Schachtelung `prose > .ProseMirror > h1` greifen einige `:where()`-Selektoren nicht zuverlässig. Ergebnis: Der Befehl funktioniert, das DOM wird zu `<h1>` – nur sieht es identisch zu `<p>` aus.

## Änderungen

### 1. `src/components/editors/PromptKitRichEditor.tsx`
- **Underline-Duplikat entfernen**: Entweder `import Underline from "@tiptap/extension-underline"` löschen und sich auf StarterKit verlassen, **oder** in `StarterKit.configure({ ... })` `underline: false` setzen und den separaten Extension-Import behalten. Empfehlung: separaten Import behalten + `underline: false` im StarterKit (zukunftssicherer, falls StarterKit-Version wechselt).
- Außerdem in `StarterKit.configure` sicherstellen, dass `heading: { levels: [1,2,3] }` nicht durch eine andere Heading-Extension überschrieben wird (aktuell ok, nur prüfen).

### 2. `src/index.css` – Editor-spezifische Heading-Styles
Einen Scope-Block für den Tiptap-Editor hinzufügen, der die Tailwind-Reset-Größen explizit überschreibt – unabhängig von `prose`:

```css
.ProseMirror h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 0.8em 0 0.4em; }
.ProseMirror h2 { font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin: 0.7em 0 0.35em; }
.ProseMirror h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; margin: 0.6em 0 0.3em; }
.ProseMirror p  { margin: 0.4em 0; }
.ProseMirror blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1em; color: hsl(var(--muted-foreground)); }
.ProseMirror code { background: hsl(var(--muted)); padding: 0.1em 0.3em; border-radius: 4px; font-size: 0.9em; }
.ProseMirror pre  { background: hsl(var(--muted)); padding: 0.8em 1em; border-radius: 6px; overflow-x: auto; }
.ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0.4em 0; }
.ProseMirror hr { border: 0; border-top: 1px solid hsl(var(--border)); margin: 1em 0; }
.ProseMirror :is(h1,h2,h3).is-empty::before,
.ProseMirror p.is-empty:first-child::before {
  content: attr(data-placeholder);
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  float: left;
  height: 0;
}
```

Das macht Headings sofort sichtbar **und** funktioniert auch in der Detail-Ansicht (Article-View nutzt ebenfalls `.ProseMirror`-ähnliche Klassen – falls nicht, separat scopen).

### 3. Validierung
Nach der Änderung in `/prompt-kits/new` testen:
- `# ` + Space → wird zu großer H1 ✓
- Dropdown „Heading 2" → sichtbar mittlere Größe ✓
- Konsole frei von `Duplicate extension names` Warnung ✓

## Warum so

- CSS-Scope auf `.ProseMirror` ist robuster als `prose`, weil ProseMirror diese Klasse garantiert auf den Editor-Root setzt.
- Wir nutzen die Theme-Variablen (`hsl(var(--border))` etc.) → dunkles und helles Theme funktionieren automatisch.
- Keine Markdown-/DB-Schema-Änderungen nötig.