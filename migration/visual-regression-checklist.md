# What to compare the moment Tailwind v4 lands

The screenshot baseline catches most of this on its own. This file is for the parts a
screenshot cannot explain, and for the specific v3-to-v4 mechanics that are known to
drop tokens quietly.

Counted on 2026-08-24: **76 CSS custom properties** in `src/index.css` (42 in `:root`,
34 overridden in `.dark`), plus a `theme.extend` block in `tailwind.config.ts` carrying
3 font families, 4 display sizes, 13 colour groups, 3 radii, 4 shadows, 7 keyframes and
7 animations.

All of it renders on one page: **`/__tokens`**, both themes side by side.
`migration/baseline/__tokens@desktop.png` and `@mobile.png` are the before.

## The five v4 mechanics most likely to lose something here

1. **The colour tokens are HSL triples, not colours.** `--primary: 239 67% 59%`, consumed
   as `hsl(var(--primary))`. Custom CSS in `index.css` also does
   `hsl(var(--primary) / 0.08)` in the hero surfaces. If the migration ports these into
   `@theme` as complete colours (`--color-primary: hsl(239 67% 59%)`), every one of those
   slash-opacity usages breaks, and it breaks silently: an invalid colour renders as
   nothing, not as an error. Either keep the triples or convert every consumer.

2. **`darkMode: ["class"]` has no config equivalent in v4.** It becomes
   `@custom-variant dark (&:where(.dark, .dark *))`. `next-themes` sets the class with
   `attribute="class"` and `defaultTheme="system"`; if the variant is not declared, dark
   mode does not stop working loudly, it just stops applying.

3. **The `container` settings disappear.** `center: true`, `padding: "2rem"` and the
   1400px `2xl` screen are a config object v4 dropped; it needs `@utility container`.
   Every page uses the container, so this one shows up immediately in the screenshots.

4. **The three custom utilities are in `@layer utilities`,** which v4 replaces with
   `@utility`: `.text-gradient`, `.shadow-glow`, `.card-gradient`. All three read
   gradient or shadow variables, so a missed one is a blank box, not a crash.

5. **The display type scale carries per-size line height and letter spacing.**
   `'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }]`. In v4
   these become three separate `--text-*` variables each. Dropping the modifiers keeps
   the font size and quietly loses the tracking, which is the kind of thing that looks
   "slightly off" for months.

## Things not driven by Tailwind at all

These live in `index.css` as plain CSS and should survive untouched. Check them anyway,
because they read the same tokens:

- The hero: `.hero-stage`, `.stage-bg`, `.stage-grid`, `.speech-bubble` and its `::after`
  tail, plus seven `@keyframes` (`querioBob`, `querioBlink`, `querioSparkle`,
  `bubblePop`, `blinkCaret`, `floatCard0` through `floatCard4`).
- The `prefers-reduced-motion` block, which kills hero animation but deliberately keeps
  the typing caret blinking.
- `.ProseMirror` styling for the Prompt Kit editor: headings, blockquote, code, pre,
  lists, `hr`, links, `mark`, task lists, and the empty-editor placeholder. These are
  written out explicitly because `prose` specificity was not reliable against preflight.
- `.querino-grad-text`, which uses `--grad-primary`, a different variable from the
  `--gradient-primary` that `.text-gradient` uses. Two similarly named gradients, one
  letter apart. This is the single easiest token in the file to lose.

## One thing already wrong, to be left alone

`--gradient-primary`, `--gradient-subtle` and `--gradient-card` are defined only in
`:root` and never overridden in `.dark`. `--grad-primary` is overridden. So in dark mode
`.card-gradient` paints the light gradient and shows as a white block, visible in the
right-hand pane of `__tokens@desktop.png`.

That is a pre-existing design bug, not a migration hazard, and it was deliberately not
fixed: fixing it changes the design, and the point of the baseline is that the
before-and-after differ in nothing. Fix it after the comparison, not before.

## Fonts

Bricolage Grotesque, Inter and JetBrains Mono load from Google Fonts via a `<link>` in
`index.html`, using the print-media swap pattern to avoid render-blocking. Under SSR the
document head is generated rather than served as a static file, so confirm all three
still load and that the swap has not become a flash of unstyled text.
