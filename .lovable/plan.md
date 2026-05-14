## Was schiefläuft

Beim Anlegen eines neuen Prompts passiert in Sachen Menerio aktuell **gar nichts** — und das ist ein echter Bug, nicht nur eine fehlende Einstellung.

In deinem Screenshot ist alles korrekt eingestellt:
- "Auto‑Sync" an
- "Integration active" an
- "Prompts" als Artefakt‑Typ angehakt
- Letzter Sync 30.04. — also vor diesem neuen Prompt

Trotzdem landet das neue Prompt nicht in Menerio. Ursache liegt in der Datenbank.

## Root Cause (technisch)

In `supabase/migrations/20260328162230_…queue_menerio_sync.sql` ist die Auto‑Sync‑Logik so gebaut:

1. Es gibt **nur Trigger für `AFTER UPDATE` und `AFTER DELETE`** auf `prompts`, `skills`, `workflows`, `claws` — **kein `AFTER INSERT`**.
2. Im Trigger‑Body steht zusätzlich: `IF OLD.menerio_synced = true …` — d. h. die Queue‑Insertion läuft **nur, wenn das Artefakt schon einmal gesynct war**.
3. Die Felder `auto_sync` und `sync_artifact_types` aus `menerio_integration` werden vom Trigger gar nicht gelesen — die UI‑Toggles haben heute also nur Wirkung auf den manuellen "Sync all"‑Flow, nicht auf das automatische Queueing.

Konsequenz: Ein **neu** erstelltes Prompt wird nie in `menerio_sync_queue` eingetragen → der Worker (`process-menerio-sync-queue`, alle 30 s per Cron) sieht es nie → es kommt nie in Menerio an. Erst wenn du es einmal manuell über den "Sync to Menerio"‑Button schickst, greift der UPDATE‑Trigger bei zukünftigen Änderungen.

Das passt auch zu deinem Screenshot: "Prompts 37 / 61 synced" — die 24 nicht gesyncten sind genau die, die nie manuell angestoßen wurden.

## Fix‑Plan

### 1. Neue Migration: INSERT‑Trigger + Settings respektieren

Neue Datei `supabase/migrations/<timestamp>_menerio_autosync_on_insert.sql`:

- `queue_menerio_sync()` so erweitern, dass sie:
  - bei `TG_OP = 'INSERT'` einen `pending`‑Eintrag in `menerio_sync_queue` schreibt, **wenn**
    - `NEW.author_id IS NOT NULL`,
    - eine aktive `menerio_integration` für diesen User existiert (`is_active = true`),
    - `auto_sync = true`,
    - und `v_artifact_type = ANY(sync_artifact_types)`.
  - bei `UPDATE` die Bedingung `OLD.menerio_synced = true` ergänzt um „**oder** Auto‑Sync ist aktiv und Typ ist erlaubt", damit auch Updates an noch nie gesyncten Artefakten erfasst werden.
  - `auto_sync` / `sync_artifact_types` zusätzlich auch im UPDATE‑ und DELETE‑Pfad prüft.
- Trigger `queue_menerio_sync_on_<table>_insert AFTER INSERT` auf `prompts`, `skills`, `workflows` anlegen (Claws sind laut Memory aus dem Produkt entfernt — überspringen oder für Konsistenz mitnehmen, ohne UI dafür).

Damit funktioniert Auto‑Sync für alle künftigen neuen Artefakte, und die UI‑Toggles ("Auto‑Sync", "Artifact types to sync") bekommen endlich echte serverseitige Wirkung.

### 2. Backfill für das jetzt fehlende Prompt (und die anderen 24)

Einmaliger SQL‑Block in derselben Migration, der für jeden User mit aktiver Integration + `auto_sync = true` alle eigenen, **noch nicht gesyncten** Artefakte der erlaubten Typen in `menerio_sync_queue` mit Status `pending` einreiht (mit Dedupe gegen bestehende `pending`‑Einträge). Der bestehende Cron‑Worker arbeitet sie dann innerhalb von ≤ 30 s ab.

Alternativ ohne Backfill: du klickst einmalig in den Settings auf „Sync all" — das funktioniert heute schon und holt das fehlende Prompt rein. Empfehlung: Backfill mitnehmen, damit es „einfach geht".

### 3. Verifikation

- Migration anwenden.
- Neues Test‑Prompt anlegen → in `menerio_sync_queue` muss sofort ein `pending`‑Row auftauchen.
- Edge‑Function‑Logs von `process-menerio-sync-queue` prüfen (`supabase--edge_function_logs`), Status muss innerhalb 30 s auf `completed` gehen.
- In Menerio sollte das Prompt erscheinen; in der UI „Last sync" aktualisiert sich.
- `prompts.menerio_synced` für die neue Zeile = `true`.

## Was nicht Teil des Fixes ist

- UI‑Änderungen an `MenerioIntegrationSection` / Sync‑Buttons — die bleiben wie sie sind.
- Änderungen an `render-for-menerio` oder am Worker — beide sind in Ordnung, sie werden heute nur nicht angetriggert.
- Claws — gemäß Produktentscheidung entfernt; Trigger lassen wir auf den drei aktiven Typen.
