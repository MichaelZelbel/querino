# n8n ausphasen — Pilot: Prompt Refinement

## Ja, das ist absolut machbar — und sinnvoll

Deine Argumentation stimmt:

- **Logging**: Wir haben mit `llm_usage_events` bereits eine zentrale Postgres-Tabelle für Token-Verbrauch (`prompt_tokens`, `completion_tokens`, `total_tokens`, `milli_credits_charged`, Idempotenz pro User). Der Schreibweg dorthin geht heute über n8n → `Update Token Usage` → DB. Den können wir genauso gut direkt aus einer Edge Function bedienen.
- **Last**: Korrekt — ein LLM-Call ist I/O-bound. Eine Deno Edge Function `await fetch(...)` blockiert nichts. Der einzige reale Vorteil von n8n war "fertig verdrahtetes Token-Tracking" — und das können wir in ~30 Zeilen nativ ersetzen.
- **Open Source / Adoption**: Ein Self-Hoster will nicht erst eine n8n-Instanz aufsetzen, 16 Workflows importieren und Webhook-Keys pflegen, nur um Querino lokal laufen zu lassen. Das ist die größte Adoptionsbremse im Repo.

Plan: Wir **nehmen Prompt Refinement als Pilot**, weil es einer der einfachsten Flows ist (ein einziger LLM-Call, klares Input/Output-Schema, keine Tools/Memory/Branches). Wenn das sauber läuft, migrieren wir die anderen 15 Flows nach demselben Muster.

---

## Pilot-Scope: nur Prompt Refinement

**Heute:**
```
Frontend → supabase/functions/refine-prompt → n8n /webhook/prompt-refinement → Azure/OpenAI
                                                  ↓
                                         (Update Token Usage Workflow → llm_usage_events)
```

**Nach dem Pilot:**
```
Frontend → supabase/functions/refine-prompt → Lovable AI Gateway → Modell
                                                  ↓
                                         direkt in llm_usage_events schreiben
```

n8n bleibt für alle anderen Flows unverändert aktiv. Nur dieser eine Webhook wird nicht mehr aufgerufen.

---

## Was geändert wird

### 1. Edge Function `supabase/functions/refine-prompt/index.ts` neu schreiben

- Auth: Supabase JWT validieren (`auth.getUser()` mit dem Caller-Token), `user_id` daraus ableiten — nicht mehr aus dem Request-Body vertrauen.
- Credits-Gate: Vor dem LLM-Call `v_ai_allowance_current` lesen; bei `remaining <= 0` → 402 mit klarer Meldung (gleiches Verhalten wie heute via `useAICreditsGate`).
- LLM-Call: `POST https://ai.gateway.lovable.dev/v1/chat/completions` mit `LOVABLE_API_KEY`, Modell `google/gemini-3-flash-preview` (Default), `stream: false`, **Tool Calling** für strukturierte Ausgabe `{ refinedPrompt, explanation }` — vermeidet das fragile JSON-Parsing aus der heutigen Implementierung.
- System-Prompt: Wird 1:1 aus dem n8n-Workflow `n8n/Prompt Refinement.json` übernommen (Framework-aware, RISEN/CRISPE/etc.). Bleibt server-side.
- Token-Logging: Aus der OpenAI-kompatiblen Response `usage.prompt_tokens` / `usage.completion_tokens` / `usage.total_tokens` lesen und einen Insert in `llm_usage_events` ausführen mit:
  - `feature = 'prompt-refinement'`
  - `provider = 'lovable-ai'`, `model = '<modell-id>'`
  - `idempotency_key = crypto.randomUUID()` (oder Hash aus user+timestamp+contentHash)
  - `milli_credits_charged` / `credits_charged` über die bestehende Konvertierungslogik (`tokens_per_credit` aus `ai_credit_settings`).
- Fehlerbehandlung: 429 / 402 vom Gateway sauber durchreichen (siehe AI-Gateway-Skill).

### 2. Helper-Modul `supabase/functions/_shared/llm.ts` (neu)

Damit die Folge-Migrationen trivial werden, kapseln wir einmal sauber:

- `callLovableAI({ messages, model, tools?, user_id, feature })` → ruft Gateway, schreibt `llm_usage_events`, gibt geparste Antwort + Token-Metriken zurück.
- `assertCredits(user_id)` → einheitliches Credit-Gate, wirft `CreditsExhaustedError`.
- `chargeCredits(user_id, tokens, model)` → einheitliche Cost-Berechnung.

Jeder spätere Flow (Prompt Coach, Skill Coach, Suggest Metadata, …) ist dann ~20 Zeilen in seiner Edge Function statt eines kompletten n8n-Workflows.

### 3. Frontend

Keine Änderungen nötig. `useRefinePrompt` ruft weiterhin `supabase.functions.invoke('refine-prompt', …)` mit demselben Payload (`prompt`, `framework`, `goal`). Output-Shape `{ refinedPrompt, explanation }` bleibt identisch.

### 4. n8n-Seite

- `n8n/Prompt Refinement.json` bleibt im Repo als Referenz (für andere Self-Hoster, die noch auf n8n bleiben wollen, und für unseren Vergleich).
- Auf der Live-n8n-Instanz wird der Workflow **nicht gelöscht**, nur **deaktiviert** — falls wir einen Rollback brauchen, ein Klick.
- `N8N_BASE_URL` / `N8N_WEBHOOK_KEY` bleiben gesetzt (alle anderen Flows brauchen sie weiter).

---

## Was *nicht* in diesem Schritt passiert

- Die anderen 15 n8n-Flows (Coaches, Insights, Suggest Metadata, Translate, Wizard) werden **nicht** angefasst.
- Die `Update Token Usage`-Pipeline für die verbliebenen n8n-Flows bleibt aktiv.
- Keine DB-Migration nötig — `llm_usage_events` existiert bereits und passt schon perfekt.
- Keine UI-Änderung am Refinement-Modal.

---

## Verifikation nach dem Pilot

1. Refinement im UI auslösen → Output erscheint wie vorher.
2. `select * from llm_usage_events where feature = 'prompt-refinement' order by created_at desc limit 5;` → neuer Eintrag mit korrekten Token-Zahlen.
3. Credits-Anzeige im Settings/Header dekrementiert sich entsprechend.
4. Credits auf 0 setzen → 402-Toast wie gewohnt.
5. n8n-Webhook `/webhook/prompt-refinement` prüfen → keine neuen Executions mehr.

Wenn Punkt 1–5 sauber sind, machen wir genau dasselbe als Nächstes mit z. B. **Suggest Metadata** (auch nur ein Call, strukturierte Ausgabe) und arbeiten uns dann zu den Coaches vor (etwas komplexer wegen Chat-History, aber gleiches Muster).

---

## Technische Details (für später)

- Modellwahl: Default `google/gemini-3-flash-preview` (schnell, billig, gut für Refinement). Optional pro Feature überschreibbar via `ai_credit_settings` oder Konstante im Helper.
- Idempotenz: `(user_id, idempotency_key)` ist bereits UNIQUE in `llm_usage_events` — bei Retry desselben Calls mit gleichem Key kein Doppel-Charge.
- Cost-Berechnung: Heute macht n8n `Update Token Usage` die Mathe. Wir replizieren dieselbe Formel im Helper (siehe Migration `20260126161443`): `milli_credits = round(total_tokens * 1000 / tokens_per_credit)`. Quelle of truth bleibt `ai_credit_settings`.
- Memory: Gemini-Modelle haben in `LOVABLE_API_KEY` Quota-Pool — relevant fürs spätere Skalieren, aber für den Pilot kein Thema.

OK so? Wenn du zustimmst, baue ich im nächsten Schritt genau diesen Pilot.
