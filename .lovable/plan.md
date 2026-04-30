# Embedding-Migration: n8n raus, Modell unverändert

## Kurzantwort auf deine Frage

**Nein, ich brauche keinen externen Artikel — aber wir haben eine Einschränkung, die ich klar benennen muss:**

Der **Lovable AI Gateway bietet aktuell keine Embedding-Modelle** an, nur Chat-Completions (Gemini, GPT, Claude für Text/JSON/Bilder). Embeddings sind dort nicht verfügbar.

Gleichzeitig sind in unserer DB alle Embedding-Spalten **hart auf `vector(1536)` gepinnt** (Indizes, RPCs, Spalten in `prompts`, `skills`, `workflows`, `claws`). Das ist die Dimension von OpenAI `text-embedding-3-small` — dem Modell, das n8n heute nutzt.

**Konsequenz: Wenn wir das Modell wechseln (z.B. auf Gemini-Embeddings über einen anderen Weg), würden alle ~bestehenden Embeddings unbrauchbar** (Cosine-Similarity zwischen verschiedenen Modellen ist Quatsch), und wir müssten Spalten + Indizes auf eine neue Dimension migrieren und alles neu berechnen.

**Empfehlung: Beim selben Modell bleiben (`text-embedding-3-small`, 1536 dim), nur den Aufrufweg ändern** — direkt aus der Edge Function statt über n8n. Bestehende Embeddings bleiben gültig, kein Daten-Backfill nötig.

Dafür brauche ich von dir **einen `OPENAI_API_KEY`** als Secret — den n8n heute intern verwendet. Falls du den nicht direkt zur Hand hast: holst du dir aus deinem OpenAI-Dashboard (https://platform.openai.com/api-keys), und ich frage ihn dann via Secret-Tool an.

---

## Was geändert wird

### 1. Neue Edge Function `supabase/functions/generate-embedding/index.ts`

- Auth: JWT validieren via `getCallerUserId` (wie bei den anderen migrierten Functions).
- Input: `{ text: string, itemType?: "prompt"|"skill"|"workflow"|"claw", itemId?: string }`.
- Call: `POST https://api.openai.com/v1/embeddings` mit `model: "text-embedding-3-small"`, `input: text.slice(0, 8000)`.
- Wenn `itemType` + `itemId` mitgegeben: direkt im Backend per Service-Role in die richtige Tabelle schreiben (statt Frontend → RPC). Spart einen Roundtrip und macht das Frontend dümmer.
- Token-Logging: OpenAI liefert `usage.prompt_tokens` (keine completion bei embeddings) → in `llm_usage_events` mit `feature='embedding'`, `provider='openai'`, `model='text-embedding-3-small'` einsortieren. Verwendet die existierende `record_llm_usage` RPC.
- Rückgabe: `{ embedding: number[], dimensions: 1536, written: boolean }`.
- `verify_jwt = false` in `config.toml` (Auth wird in-Code geprüft, gleicher Stil wie die anderen).

### 2. Frontend `src/hooks/useEmbeddings.ts` umbauen

- `VITE_EMBEDDING_URL` und das `fetch(url, …)` rauswerfen.
- Stattdessen `supabase.functions.invoke("generate-embedding", { body: { text, itemType, itemId } })`.
- `updateEmbedding` (RPC `update_embedding`) wird **nur noch der Fallback** für den Fall, dass jemand `generateEmbedding` ohne `itemType/itemId` aufruft — sonst macht das jetzt die Edge Function selbst.
- `RefreshEmbeddingButton` und alle anderen Aufrufer (z.B. nach Save in `usePrompts`/`useSkills`/`useWorkflows`) müssen **nicht** angefasst werden, der Hook-Vertrag bleibt identisch.

### 3. n8n-Seite

- Der Embedding-Webhook in n8n (gehört zum „Update Token Usage"-/Embedding-Workflow) bleibt im Repo als Referenz, wird aber **deaktiviert** auf der Live-Instanz, sobald das Frontend keine Calls mehr dorthin schickt.
- `VITE_EMBEDDING_URL` in `.env.example` als deprecated markieren / entfernen.

### 4. Doku

- `mem://architecture/embedding-generation-backend-requirement` aktualisieren: nicht mehr „n8n proxy required", sondern „Supabase Edge Function `generate-embedding` (OpenAI text-embedding-3-small)".
- `mem://architecture/n8n-phaseout` auf done setzen für den Embedding-Workflow → das war der letzte verbliebene Block.

---

## Was *nicht* passiert

- **Keine DB-Migration.** Spalten bleiben `vector(1536)`, Indizes bleiben, alle RPCs (`search_*_semantic`, `get_similar_*`) funktionieren weiter.
- **Kein Backfill.** Bestehende Embeddings bleiben kompatibel, weil dasselbe Modell.
- **Keine Frontend-UX-Änderung.** „Refresh Embedding"-Button und automatisches Embedding nach Save verhalten sich identisch.

---

## Verifikation nach Deploy

1. Im UI auf einem Prompt „Refresh Embedding" → Toast „successful".
2. `select id, octet_length(embedding::text) from prompts where id = '<id>';` → Wert ändert sich, Spalte ist befüllt.
3. `select * from llm_usage_events where feature = 'embedding' order by created_at desc limit 3;` → neuer Eintrag mit `model = 'text-embedding-3-small'` und Token-Zahl > 0.
4. Semantische Suche (`useSemanticSearch`) liefert weiterhin sinnvolle Treffer für vorher indexierte Artefakte (Beweis: Embeddings sind kompatibel).
5. n8n-Embedding-Webhook → keine neuen Executions.

---

## Offene Frage an dich

**Soll ich, sobald du zustimmst:**

1. Den `OPENAI_API_KEY` via Secret-Tool anfragen (du klebst ihn rein), und
2. Dann die Edge Function + Hook-Umbau machen?

Falls du langfristig **doch weg von OpenAI** willst (z.B. weil Gemini-Embeddings irgendwann im Lovable Gateway landen oder du einen anderen Provider bevorzugst): das wäre dann ein **separater, größerer Schritt** mit DB-Migration auf neue Vector-Dimension + kompletter Re-Embedding-Lauf über alle Artefakte. Das würde ich erst angehen, wenn der Gateway das nativ unterstützt — sonst tauschen wir nur eine externe Abhängigkeit gegen die nächste.
