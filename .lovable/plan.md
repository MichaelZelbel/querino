## Ziel

Statt manuellem "Sync to GitHub"-Button sollen Prompts (und konsequenterweise auch Skills, Workflows und Prompt Kits) **automatisch** mit GitHub synchronisiert werden:
- beim **Speichern** (Create / Update) → Datei in GitHub anlegen oder aktualisieren
- beim **Löschen** → Datei in GitHub entfernen

Der manuelle "Sync now"-Button bleibt als Fallback / Full-Resync erhalten.

## Wie es funktionieren soll

1. **Trigger**: Datenbank-Trigger auf `prompts`, `skills`, `workflows`, `prompt_kits` reagieren auf `INSERT`, `UPDATE`, `DELETE`.
2. **Queue**: Trigger schreiben einen Eintrag in eine neue Tabelle `github_sync_queue` (artifact_type, artifact_id, operation: `upsert` | `delete`, user_id, status).
3. **Worker**: Eine Edge Function `github-sync-worker` verarbeitet die Queue:
   - Holt den Author / Workspace-Owner und dessen GitHub-Settings (`github_sync_enabled`, `github_repo`, `github_branch`, `github_folder`, PAT aus `user_credentials`).
   - Wenn Sync für den User deaktiviert oder kein PAT vorhanden → Eintrag als `skipped` markieren.
   - Bei `upsert`: Markdown rendern (vorhandene Generatoren in `github-sync/index.ts` wiederverwenden) und über GitHub Contents API mit dem aktuellen `sha` updaten / neu anlegen.
   - Bei `delete`: Datei via Contents API DELETE entfernen.
4. **Auslösung des Workers**:
   - Direkt aus dem Trigger via `pg_net` HTTP-Aufruf an die Edge Function (asynchron, blockiert das Save nicht), **plus**
   - `pg_cron` Job alle 1 Minute als Sicherheitsnetz, um liegengebliebene `pending` / `failed` (mit retry < 3) Einträge nachzuarbeiten.
5. **Pfade**: Stabiler Dateipfad pro Artefakt: `<github_folder>/<type>s/<slug>-<shortId>.md`. Slug-Änderungen: alten Pfad zusätzlich löschen (über letzten gespeicherten Pfad in `github_sync_state`).
6. **UI**:
   - In Settings: Toggle "Auto-sync on save" (default an, sobald GitHub Sync aktiviert ist).
   - Pro Artefakt klein anzeigbarer Sync-Status (last_synced_at, error).
   - Manueller "Full resync"-Button bleibt.
7. **Doku**: Sektion `#github-sync` in `src/pages/Docs.tsx` aktualisieren — "When does sync run?" beschreibt das neue Verhalten (auto on save & delete, plus optionaler Full Resync).

## Technische Details

### Neue Tabelle `github_sync_queue`
```text
id uuid pk
user_id uuid               -- Owner, dessen GitHub-Repo betroffen ist
artifact_type text         -- 'prompt' | 'skill' | 'workflow' | 'prompt_kit'
artifact_id uuid
operation text             -- 'upsert' | 'delete'
payload jsonb              -- Snapshot bei DELETE (slug, path), sonst {}
status text                -- 'pending' | 'processing' | 'done' | 'failed' | 'skipped'
attempts int default 0
last_error text
created_at, updated_at timestamptz
```
RLS: nur service_role schreibt/liest; User dürfen ihre eigenen Einträge SELECTen (für Status-UI).

### Neue Tabelle `github_sync_state`
Pro (artifact_type, artifact_id): zuletzt verwendeter `path` und `sha`, damit Renames/Deletes sauber sind.

### Trigger (Migration)
- AFTER INSERT OR UPDATE OF (title, slug, content, description, category, tags, is_public/published) ON `prompts` → `enqueue_github_sync('prompt', NEW.id, 'upsert', NEW.author_id)`
- AFTER DELETE → `enqueue_github_sync('prompt', OLD.id, 'delete', OLD.author_id, payload mit slug)`
- Analog für `skills`, `workflows`, `prompt_kits` (Owner = `author_id`, bei Team-Artefakten zusätzlich `team_id` berücksichtigen — Phase 2, im ersten Wurf nur Personal).
- Trigger ruft am Ende `pg_net.http_post` auf den Worker auf (best effort, Fehler ignorieren).

### Edge Function `github-sync-worker`
- `verify_jwt = false`, intern via `SERVICE_ROLE_KEY`.
- Locked Batch Pull aus `github_sync_queue` (max 25, `status='pending'` oder `failed AND attempts<3`), `FOR UPDATE SKIP LOCKED`.
- Pro Eintrag: GitHub Settings + PAT laden, Markdown bauen, Contents API call, State updaten, Queue-Eintrag auf `done` / `failed` (+attempts++).
- Logging in `activity_events` (`github_sync_triggered`) bleibt.

### `pg_cron`
Job `github-sync-worker-tick` jede Minute → ruft Edge Function via `pg_net` an. Anlage über die Insert-/SQL-Tools (enthält Anon-Key + URL).

### Refactor bestehende `github-sync` Function
- Behält den "Full snapshot"-Modus für den manuellen Resync-Button.
- Markdown-Generatoren werden in ein Modul ausgelagert und vom Worker mitgenutzt.

## Offen / explizit out of scope (erstmal)
- **Team-Repos**: erst Personal-Repos automatisch syncen. Team-Sync bleibt manuell, bis das Verhalten stabil ist.
- **Debouncing** mehrfacher schneller Saves: Worker dedupliziert beim Pull (pro artifact_id letzten `upsert`-Eintrag nehmen, ältere als `done` markieren).
- **Konfliktauflösung**: Sync bleibt einseitig Querino → GitHub. Externe Änderungen am Repo werden überschrieben (wie heute).