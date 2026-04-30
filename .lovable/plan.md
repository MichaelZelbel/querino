## Problem

Embeddings sind vollständig generiert und die SQL-Funktionen `search_*_semantic` funktionieren. Aber die App nutzt sie nirgends — alle Such-Eingabefelder (Discover, Library, Landing, Command Palette) gehen über `useSearchPrompts` / `useCommandPaletteSearch`, die **nur** PostgreSQL Full-Text-Search auf `config: "english"` verwenden. Deshalb findet "Hochformat Vorschaubild Kurzvideo" den YouTube→TikTok Thumbnail-Prompt nicht — die Wörter stehen schlicht nicht drin, und FTS kann Bedeutung nicht.

## Ziel

Semantische Suche so verdrahten, dass jede sinnvolle Sucheingabe (≥ 3 Zeichen) zusätzlich Embedding-basierte Treffer liefert — ohne dass der Nutzer etwas umstellen muss und ohne FTS-Treffer zu verlieren.

## Lösung: Hybrid-Suche (FTS ∪ Semantik), automatisch

### 1. Neuer Hook `useHybridSearchPrompts`
- Führt parallel aus:
  - bestehenden `useSearchPrompts` (FTS, sofort, billig)
  - `useSemanticSearchPrompts` (Embedding via `generate-embedding` Edge Function, dann RPC)
- Merged Ergebnisse:
  - Dedupe per `id`
  - Reihenfolge: erst FTS-Treffer (Exakt-Matches gewinnen), dann semantische Ergänzungen sortiert nach `similarity`
  - Behalte `similarity`-Score auf semantischen Treffern, damit wir später optional ein "ähnlich"-Badge zeigen können
- `matchThreshold`: 0.25 (niedrig, weil text-embedding-3-small konservativ scort und wir bei wenig Content im Tail sonst nichts mehr finden)
- `matchCount`: 30

### 2. Discover / PromptLibrary / PublicPromptDiscovery / Library umstellen
- Überall, wo `useSearchPrompts({ searchQuery, isPublic: true })` verwendet wird, durch `useHybridSearchPrompts` ersetzen.
- Bei `searchQuery` leer → identisches Verhalten wie vorher (kein Embedding-Call, keine Kosten).
- Bei `isPublic: false` (eigene Library) → nur FTS, weil Semantic-RPCs `is_public = true` filtern (siehe RPC-Body). Das ist OK — bewusste Entscheidung. *(Falls gewünscht: separate RPC `search_prompts_semantic_owner` ergänzen, Scope kann der User später entscheiden.)*

### 3. Analog für Skills und Workflows
- `useHybridSearchSkills`, `useHybridSearchWorkflows` nach gleichem Muster.
- Claws haben aktuell 0 Embeddings → Backfill nochmal über das Admin-Panel laufen lassen (wahrscheinlich Timeout / Batch nicht alle 4 Typen erreicht). Kein Code-Change nötig, nur Re-Run.

### 4. Command Palette (⌘K)
- `useCommandPaletteSearch` zusätzlich semantisch füttern, aber **nur bei `query.length >= 3`** und mit Debounce, damit nicht jeder Tastendruck einen OpenAI-Call auslöst (ist schon im Hook drin, aber der semantische Part muss ein eigenes Debounce + minLength haben).
- Embedding-Call gated: nur wenn FTS < 5 Treffer liefert → spart Token.

### 5. FTS-Sprache verbessern (Bonus, klein)
- `useSearchPrompts` und Geschwister: `config: "english"` → `config: "simple"`.
- Begründung: `english` macht Stemming + Stopwords nur für Englisch, Deutschsuchen werden zerschossen. `simple` macht keinen Stemmer, dafür funktioniert's für alle Sprachen halbwegs gleich. Die wirkliche Sprachintelligenz übernehmen jetzt die Embeddings.

### 6. Test-Case nach Deploy
- "Hochformat Vorschaubild Kurzvideo" → muss YouTube→TikTok Thumbnail Converter (`3f9a2d43-…`) als semantischen Treffer zeigen.
- "short form video preview image" → derselbe Treffer.
- "AI" (FTS-starker Begriff) → FTS-Treffer wie heute, plus ggf. semantische Ergänzungen am Ende.

## Technische Details

**Datenfluss neuer Hybrid-Hook:**
```
searchQuery
  ├─► useSearchPrompts (FTS)              ──► ftsResults
  └─► generateEmbedding (Edge Function)
        └─► search_prompts_semantic RPC   ──► semResults
                                              │
            mergeAndDedupe(fts, sem) ◄────────┘
                    │
                    ▼
            PromptWithAuthor[]
```

**Geschätzte Kosten:** text-embedding-3-small ≈ $0.02 / 1M Token. Eine Suchquery hat ~10 Token → ~$0.0000002 pro Suche. Vernachlässigbar, kein Caching-Zwang. Trotzdem: TanStack Query mit `staleTime: 5min` für identische Queries.

**Keine DB-Migration nötig.** RPCs existieren, Embedding-Spalten gefüllt.

## Files

- `src/hooks/useHybridSearchPrompts.ts` (neu)
- `src/hooks/useHybridSearchSkills.ts` (neu)
- `src/hooks/useHybridSearchWorkflows.ts` (neu)
- `src/hooks/useSearchPrompts.ts` (FTS-Config tweak)
- `src/hooks/useCommandPaletteSearch.ts` (semantischer Fallback)
- Konsumenten umstellen: `src/pages/Discover.tsx`, `src/pages/PromptLibrary.tsx`, `src/pages/PublicPromptDiscovery.tsx`, `src/pages/Library.tsx`, `src/components/landing/PromptsSection.tsx` (jeweils nur Hook-Import + Aufruf tauschen)

## Offene Frage

Soll ich für Claws den Backfill nochmal anstoßen (Admin-Panel zeigt vermutlich noch missing > 0 an)? Oder reicht dir, dass du es selbst klickst, sobald der Code-Change live ist?
