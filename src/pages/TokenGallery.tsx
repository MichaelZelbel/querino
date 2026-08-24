/**
 * MIGRATION SCAFFOLDING — delete after the post-migration screenshot comparison.
 *
 * Renders every design token the app defines, in light and dark side by side, so a
 * single screenshot pair covers all of them. Tailwind v3 -> v4 ports these by hand and
 * a dropped token breaks no build; this page is what makes the drop visible.
 *
 * Reached at /__tokens. Unlinked, and excluded from migration/routes.txt on purpose.
 */

const COLOR_TOKENS = [
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "accent-warm", "accent-warm-foreground",
  "destructive", "destructive-foreground",
  "success", "success-foreground",
  "warning", "warning-foreground",
  "border", "input", "ring",
  "sidebar-background", "sidebar-foreground",
  "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground",
  "sidebar-border", "sidebar-ring",
];

const GRADIENT_TOKENS = ["gradient-primary", "gradient-subtle", "gradient-card", "grad-primary"];
const SHADOW_TOKENS = ["shadow-sm", "shadow-md", "shadow-lg", "shadow-glow"];

// Utility classes the Tailwind config generates from the tokens above. Listed literally
// rather than composed, so Tailwind's content scanner actually emits them.
const BG_CLASSES: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  card: "bg-card text-card-foreground",
  popover: "bg-popover text-popover-foreground",
};

// Literal class strings, not composed ones: Tailwind's content scanner only sees literals.
const FONT_SIZES = [
  { name: "text-display-xl", cls: "text-display-xl" },
  { name: "text-display-lg", cls: "text-display-lg" },
  { name: "text-display-md", cls: "text-display-md" },
  { name: "text-display-sm", cls: "text-display-sm" },
];
const RADII = [
  { name: "rounded-sm", cls: "rounded-sm" },
  { name: "rounded-md", cls: "rounded-md" },
  { name: "rounded-lg", cls: "rounded-lg" },
];
const ANIMATIONS = [
  "animate-fade-in", "animate-fade-in-up", "animate-scale-in",
  "animate-slide-in-right", "animate-pulse-soft",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 border-b border-border pb-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-10 w-10 shrink-0 rounded border border-border"
        style={{ background: `hsl(var(--${token}))` }}
      />
      <code className="text-[11px] leading-tight text-foreground">--{token}</code>
    </div>
  );
}

function Pane({ dark }: { dark: boolean }) {
  return (
    <div className={dark ? "dark" : undefined}>
      <div className="min-h-full bg-background p-6 text-foreground">
        <h1 className="mb-6 font-display text-display-md">
          {dark ? "Dark" : "Light"} tokens
        </h1>

        <Section title="Colour tokens (raw CSS variables)">
          <div className="grid grid-cols-3 gap-2">
            {COLOR_TOKENS.map((t) => <Swatch key={t} token={t} />)}
          </div>
        </Section>

        <Section title="Colour tokens as Tailwind utilities">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(BG_CLASSES).map(([name, cls]) => (
              <div key={name} className={`${cls} rounded-md border border-border px-3 py-2 text-xs`}>
                {name}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Gradients">
          <div className="grid grid-cols-2 gap-2">
            {GRADIENT_TOKENS.map((t) => (
              <div key={t} className="rounded-md border border-border p-2">
                <div className="h-10 rounded" style={{ background: `var(--${t})` }} />
                <code className="text-[11px]">--{t}</code>
              </div>
            ))}
          </div>
          <p className="mt-3 text-display-sm querino-grad-text font-display">
            .querino-grad-text
          </p>
          <p className="text-gradient font-display text-display-sm">.text-gradient</p>
        </Section>

        <Section title="Shadows">
          <div className="grid grid-cols-4 gap-4 p-2">
            {SHADOW_TOKENS.map((t) => (
              <div key={t} className="rounded-lg bg-card p-3" style={{ boxShadow: `var(--${t})` }}>
                <code className="text-[10px]">--{t}</code>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4 p-2">
            <div className="shadow-sm rounded-lg bg-card p-3"><code className="text-[10px]">shadow-sm</code></div>
            <div className="shadow-md rounded-lg bg-card p-3"><code className="text-[10px]">shadow-md</code></div>
            <div className="shadow-lg rounded-lg bg-card p-3"><code className="text-[10px]">shadow-lg</code></div>
            <div className="shadow-glow rounded-lg bg-card p-3"><code className="text-[10px]">shadow-glow</code></div>
          </div>
          <div className="card-gradient mt-4 rounded-lg border border-border p-3">
            <code className="text-[10px]">.card-gradient</code>
          </div>
        </Section>

        <Section title="Type scale and families">
          {FONT_SIZES.map((s) => (
            <p key={s.name} className={`font-display ${s.cls} truncate`}>
              {s.name} Querino
            </p>
          ))}
          <p className="mt-3 font-sans">font-sans: Inter, the quick brown fox 0123456789</p>
          <p className="font-display">font-display: Bricolage Grotesque, the quick brown fox</p>
          <p className="font-mono">font-mono: JetBrains Mono, the quick brown fox 0123</p>
          <div className="mt-3 space-y-1">
            <h1 className="text-2xl">h1 element (font-display, tracking-tight)</h1>
            <h2 className="text-xl">h2 element</h2>
            <h3 className="text-lg">h3 element</h3>
          </div>
        </Section>

        <Section title="Radii, borders, focus ring">
          <div className="flex gap-3">
            {RADII.map((r) => (
              <div key={r.name} className={`${r.cls} border border-border bg-secondary px-3 py-2 text-xs`}>
                {r.name}
              </div>
            ))}
            <button className="rounded-md border border-input bg-background px-3 py-2 text-xs ring-2 ring-ring">
              ring-ring
            </button>
          </div>
        </Section>

        <Section title="Animations (Tailwind config keyframes)">
          <div className="flex flex-wrap gap-2">
            {ANIMATIONS.map((a) => (
              <div key={a} className={`${a} rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground`}>
                {a}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Editor styles (.ProseMirror, used by the Prompt Kit editor)">
          <div className="ProseMirror rounded-md border border-border p-3">
            <h1>ProseMirror h1</h1>
            <h2>ProseMirror h2</h2>
            <h3>ProseMirror h3</h3>
            <p>Paragraph with <a href="#top">a link</a>, <code>inline code</code> and <mark>a mark</mark>.</p>
            <blockquote>A blockquote, bordered with --border.</blockquote>
            <pre><code>a preformatted block</code></pre>
            <ul><li>bulleted item</li></ul>
            <ol><li>numbered item</li></ol>
            <hr />
          </div>
        </Section>

        <Section title="Hero surfaces (index.css, token-dependent)">
          <div className="hero-stage" style={{ height: 220 }}>
            <div className="stage-bg" />
            <div className="stage-grid" />
            <div className="speech-bubble">speech-bubble</div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default function TokenGallery() {
  return (
    <div className="grid min-h-screen grid-cols-2">
      <Pane dark={false} />
      <Pane dark />
    </div>
  );
}
