## Favicon ersetzen

**Aktueller Zustand:**
- Favicon: `public/favicon.png` (96 × 100 px, nicht-quadratisch)
- Eingebunden in `index.html` via `<link rel="icon" href="/favicon.png" type="image/png">`

**Neue Datei:**
- `user-uploads://Querino-Favicon-96.png` (96 × 96 px, quadratisch, neues Querino-Logo in Lila/Blau)

### Schritte

1. **Neue Favicon-Datei in das Projekt kopieren**
   - `user-uploads://Querino-Favicon-96.png` → `public/favicon.png` (überschreibt die bestehende Datei)

2. **Alte `favicon.ico` prüfen**
   - Falls `public/favicon.ico` existiert, entfernen, damit Browser nicht standardmäßig die alte ICO-Datei laden.

3. **`index.html`**
   - Der bestehende `<link rel="icon" href="/favicon.png" type="image/png">` bleibt unverändert (Pfad und Dateiname sind gleich). Keine Codeänderung nötig.

### Ergebnis
Das neue, quadratische Querino-Logo (96 × 96 px) erscheint als Browser-Tab-Icon.