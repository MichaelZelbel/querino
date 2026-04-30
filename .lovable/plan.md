
# Claws raus, Prompt Kits rein

## Datenstand & Entscheidung

DB-Check: 5 Claws total (3 von dir „Mister Q", 2 verwaist). **Hartes Löschen ist sicher** — keine fremden Nutzerdaten betroffen.

---

## Teil A: Claws komplett entfernen

### A1. Datenbank-Migration (DROP)
- Tabellen droppen: `claws`, `claw_versions`, `claw_reviews`, `claw_pins`
- Funktionen droppen: `set_claw_slug()`, `get_similar_claws()`, `search_claws_semantic()`
- Aus polymorphen Funktionen den `claw`-Branch entfernen: `is_item_public`, `is_item_owner`, `is_team_member_for_item`, `update_embedding`, `generate_unique_slug`
- Trigger `queue_menerio_sync` auf claws automatisch weg (Tabelle weg)
- `menerio_integration.sync_artifact_types` Default von `{prompt,skill,claw,workflow}` → `{prompt,skill,workflow}`; bestehende Werte updaten

### A2. Frontend: Routen, Pages, Hooks, Components löschen
- **Pages**: `ClawNew.tsx`, `ClawDetail.tsx`, `ClawEdit.tsx`
- **Hooks**: `useClaws.ts`, `useCloneClaw.ts`, `useClawVersions.ts`, `useClawReviews.ts`, `useCopyClawToTeam.ts`, `usePinnedClaws.ts`
- **Components**: ganzer Ordner `src/components/claws/`
- **Types**: `src/types/claw.ts`
- **App.tsx**: 3 Claw-Routen + Imports raus
- **Header.tsx**: „New Claw"-Menüpunkte (Desktop + Mobile) raus
- **Library.tsx**: ganzer Claws-Block, Hook-Aufruf, Filter-Logik raus
- **Discover.tsx**: Claws-Tab raus (nur noch Prompts/Skills/Workflows)
- **CommandPalette**: Claw-Suche entfernen (falls vorhanden)
- **Docs.tsx, CommunityGuidelines.tsx**: Claw-Erwähnungen entfernen/ersetzen
- **Cross-cutting cleanup** in: `useDuplicateArtifact.ts`, `useAIInsights.ts`, `useMarkdownImport.ts`, `useEmbeddings.ts`, `useSemanticMerge.ts`, `useCollections.ts` (item_type 'claw'), `MenerioSyncButton.tsx`, `MenerioBulkSync.tsx`, `AIInsightsPanel.tsx`, `skillSourceParser.ts`
- **Types**: `activity.ts`, `aiInsights.ts`, `collection.ts` — `'claw'` aus Union-Types raus

### A3. Edge Functions
- **Löschen**: `suggest-claw-metadata`
- **Anpassen**: `mcp-server`, `api`, `ai-insights`, `ai-moderate-content`, `fetch-skill-md`, `render-for-menerio`, `process-menerio-sync-queue`, `backfill-embeddings`, `generate-embedding` — alle `claw`-Branches/Tools entfernen
- `supabase/config.toml`: `suggest-claw-metadata` Eintrag entfernen

### A4. Sonstiges
- `n8n/Claw Insights.json` und `n8n/Suggest Claw Metadata.json` aus Repo löschen
- `docs/SCHEMA.md`, `CLAUDE.md`, `README.md`: Claw-Erwähnungen entfernen
- Memory `mem://features/claws-artifact-type` und `mem://features/clawbot-metadata-webhook` löschen; `mem://index.md` Core-Zeile „Artifact Types" auf „Prompts, Skills, Workflows, Prompt Kits" ändern

---

## Teil B: Prompt Kits einführen

### B1. Datenmodell
Neue Tabelle `prompt_kits` (eigenständiges Single-Markdown-Dokument, **keine** Item-Tabelle):

```text
prompt_kits
  id              uuid PK
  slug            text unique
  title           text NOT NULL
  description     text
  content         text         -- Markdown mit Konvention "## Prompt: <Titel>"
  category        text
  tags            text[]
  language        text default 'en'
  author_id       uuid -> profiles.id
  team_id         uuid (nullable)
  published       boolean default false
  rating_avg      numeric
  rating_count    int
  embedding       vector(1536)
  menerio_synced  boolean
  menerio_note_id text
  menerio_synced_at timestamptz
  created_at, updated_at
```

Plus Hilfstabellen analog Skills:
- `prompt_kit_versions` (Versionierung)
- `prompt_kit_reviews` (Ratings/Comments)
- `prompt_kit_pins`

**RLS**: Spiegel der Skills-Policies (eigene + team + published).

**Trigger/Funktionen**: `set_prompt_kit_slug`, `update_prompt_kit_rating`, `get_similar_prompt_kits`, `search_prompt_kits_semantic`, `update_embedding`-Branch erweitern, `is_item_public`/`is_item_owner`/`is_team_member_for_item`/`generate_unique_slug` um `'prompt_kit'`-Branch erweitern, Menerio-Sync-Trigger anhängen.

### B2. Editor-UX (Single-Markdown)
**Konvention**: Items werden über Markdown-Heading getrennt — `## Prompt: <Titel>` markiert den Beginn eines neuen Prompts. Alles dazwischen ist der Prompt-Body.

**Editor-Page** (`PromptKitEdit.tsx`):
- Layout wie SkillEdit: links Metadaten (Titel, Description, Tags, Category, Language, Published-Toggle), rechts großer `LineNumberedEditor`
- **Toolbar über dem Editor**:
  - „Add Prompt"-Button → fügt am Cursor `\n\n## Prompt: Untitled\n\n` ein
  - Live-Counter rechts oben: „N Prompts erkannt" (regex-Parser zählt `^## Prompt:` Headings)
- **Outline-Panel** (rechts vom Editor, einklappbar): Liste der erkannten Prompt-Titel mit Click-to-Scroll
- Manuelles Speichern (kein Autosave, gemäß Memory)
- Standard-Action-Bar: Save, Publish-Toggle, Delete

**Detail-Page** (`PromptKitDetail.tsx`):
- Header (Titel, Author, Tags, Rating)
- Gerenderter Markdown-Body
- **Pro erkanntem Prompt**: kleiner „Copy this prompt"-Button neben dem `## Prompt: ...`-Heading, der **nur den Body dieses Items** in die Zwischenablage kopiert
- „Copy entire kit"-Button oben (kopiert ganzes Markdown)
- Standard: Reviews, Comments, Similar, Versions, AI Insights, Menerio-Sync

**New-Page** (`PromptKitNew.tsx`): minimal, mit Default-Template:
```markdown
## Prompt: My first prompt

Write your prompt here…
```

### B3. Frontend-Struktur
- `src/types/promptKit.ts`
- `src/hooks/usePromptKits.ts` (Hybrid-Search wie Skills)
- `src/hooks/usePromptKitVersions.ts`, `usePromptKitReviews.ts`, `usePinnedPromptKits.ts`, `useClonePromptKit.ts`, `useCopyPromptKitToTeam.ts`
- `src/components/promptKits/PromptKitCard.tsx`, `PromptKitReviewSection.tsx`, `PromptKitVersionHistoryPanel.tsx`, `CopyPromptKitToTeamModal.tsx`
- `src/lib/promptKitParser.ts` — Utility: parst Markdown nach `## Prompt: <title>`-Headings, gibt `[{title, body, lineStart, lineEnd}]` zurück (für Outline und Copy-Buttons)
- **Routen** in `App.tsx`: `/prompt-kits/new`, `/prompt-kits/:slug`, `/prompt-kits/:slug/edit`
- **Header**: „New Prompt Kit" im Create-Menü (Icon: `Package` oder `BookOpen` aus lucide)
- **Library.tsx**: neuer „My Prompt Kits"-Block analog zu Skills
- **Discover.tsx**: neuer „Prompt Kits"-Tab
- **Collections**: `item_type` 'prompt_kit' zulassen
- **CommandPalette**: Prompt Kits in globaler Suche
- **Cross-cutting**: `useDuplicateArtifact`, `useAIInsights`, `useMarkdownImport` (mit YAML-Frontmatter `type: prompt_kit`), `useEmbeddings`, `useSemanticMerge`

### B4. Edge Functions & Backend
- `backfill-embeddings`: prompt_kit-Branch
- `generate-embedding`: prompt_kit-Branch
- `ai-insights`: optional Branch (kann anfangs Skill-Logik wiederverwenden)
- `mcp-server`, `api`: prompt_kit-Endpunkte
- `process-menerio-sync-queue`, `render-for-menerio`: prompt_kit-Support
- Moderation: prompt_kit in `ai-moderate-content`

### B5. Doku & Memory
- `docs/SCHEMA.md`: prompt_kits-Sektion ergänzen
- `Docs.tsx` (in-app): neuer Abschnitt „Prompt Kits"
- Neue Memory: `mem://features/prompt-kits-artifact-type` (Modell, Editor-Konvention `## Prompt:`, Single-Markdown)
- `mem://index.md` Core-Liste aktualisieren

---

## Reihenfolge der Umsetzung
1. Migration A1 (DROP claws + cleanup polymorpher Funktionen)
2. Migration B1 (CREATE prompt_kits + Hilfstabellen + Funktionen, polymorphe Funktionen erweitern)
3. Frontend A2 + A4 (Claws-Code raus, Build muss grün bleiben)
4. Edge Functions A3 (Claw-Branches raus)
5. Frontend B3 (Prompt-Kit-Pages, Hooks, Components, Routen, Library/Discover-Integration)
6. Edge Functions B4 (prompt_kit-Branches)
7. Memory + Doku-Updates

---

## Offene Detail-Frage (kein Blocker, kann nach Approval beantwortet werden)
**Heading-Konvention**: Reicht `## Prompt: <Titel>` als Trenner, oder lieber strikter `### Prompt: <Titel>` damit `##` für Sektionsüberschriften innerhalb eines Prompts frei bleibt? Empfehlung: `## Prompt:` — gut sichtbar, gut copy-paste-bar, und Subsections können `###` nutzen.
