# Performance-Optimierungen für Querino

Beim Durchgehen des Codes habe ich vier konkrete Stellen gefunden, die spürbar Bremswirkung im Browser haben — alle ohne Funktionsverlust korrigierbar. Sortiert nach Wirkung.

## 1. Route-basiertes Code-Splitting (größte Wirkung)

**Problem:** `src/App.tsx` importiert alle ~60 Seitenkomponenten statisch (Admin, Blog-CMS, Editoren mit Tiptap, Recharts, etc.). Dadurch landet der gesamte Anwendungscode in **einem JS-Bundle**, das beim ersten Aufruf der Landingpage geladen, geparst und ausgeführt werden muss — auch wenn der Nutzer nie ins Admin-Panel oder den Blog-Editor geht. Tiptap allein bringt ~12 Extensions mit.

**Lösung:** Statische Imports in `React.lazy(() => import(...))` umstellen und `<Routes>` in einen `<Suspense fallback={...}>` wickeln. Index/Discover/Auth bleiben eager (häufigste Einstiegspunkte), alles andere wird lazy geladen.

Erwarteter Effekt: Initial-Bundle schrumpft je nach Aufteilung um 50–70%, deutlich schnellerer Time-to-Interactive auf der Landingpage.

## 2. `useUserRole` als geteilten Cache statt N-fache Direktabfrage

**Problem:** Den Konsolen-Logs ist klar zu entnehmen, dass `[useUserRole] Fetched role: admin` pro Navigation **4–6 mal** feuert. Der Hook nutzt `useState`/`useEffect` direkt mit Supabase — jede Komponente, die ihn aufruft (Header, PremiumGate, PremiumBadge, usePremiumCheck, BlogAdminLayout, Admin, LibraryPromptEdit), öffnet ihre eigene Anfrage. Das sind unnötige DB-Roundtrips bei jedem Routenwechsel.

**Lösung:** `useUserRole` auf TanStack Query umstellen (`useQuery` mit `queryKey: ['user-role', user.id]`, `staleTime: 5min`). Damit teilen sich alle Aufrufer denselben Cache und es feuert genau **eine** Anfrage pro Session, statt 4–6 pro Seite. Die externe API des Hooks (`role`, `isAdmin`, `isPremium`, `refetch`) bleibt identisch — kein Aufrufer muss angepasst werden.

## 3. Globale QueryClient-Defaults

**Problem:** `new QueryClient()` in `App.tsx` verwendet die Standardwerte, d.h. `staleTime: 0` und `refetchOnWindowFocus: true`. Folge: Beim Tab-Wechsel werden alle aktiven Queries (Prompts, Skills, Workflows, Reviews, Activity-Feed, …) erneut abgeschickt. Das kostet Bandbreite und macht die App träge wirken.

**Lösung:** Sinnvolle Defaults setzen — `staleTime: 60_000`, `gcTime: 5min`, `refetchOnWindowFocus: false`, `retry: 1`. Einzelne Queries können bei Bedarf weiterhin individuell abweichen. Funktional ändert sich nichts, nur das Refetch-Verhalten wird ruhiger.

## 4. Aufräumen: Logging & Font-Loading

- **Konsolen-Logs:** `[useUserRole] Fetched role:` und ein paar `console.log`/`console.warn` in den Hooks aus Production-Builds entfernen oder durch `import.meta.env.DEV`-Guard schützen. Console-Calls sind im Browser nicht gratis — vor allem bei jedem Render.
- **Google Fonts:** Drei Font-Familien (Bricolage Grotesque mit Variable-Range, Inter, JetBrains Mono) werden synchron im `<head>` geladen → render-blocking. Stattdessen mit `media="print"` + `onload`-Swap-Pattern asynchron laden, plus `<link rel="preload">` für die wirklich kritische Familie (Inter). Spart ~200–400 ms First-Paint.

## Technische Details

**Dateien, die angefasst werden:**

- `src/App.tsx` — alle Page-Imports auf `lazy()` umstellen, `<Suspense>` einsetzen, `QueryClient` mit Defaults konfigurieren
- `src/hooks/useUserRole.ts` — Refactor auf `useQuery` (öffentliche API unverändert)
- `src/hooks/useAuth.ts`, `src/hooks/useUserRole.ts`, `src/hooks/useEmbeddings.ts` — `console.log` hinter DEV-Guard
- `index.html` — Google-Fonts-Tag auf async-Load-Pattern umbauen

**Was sich NICHT ändert:**

- Keine API-Signaturen, keine entfernten Features, keine UI-Änderungen
- Keine zusätzlichen Dependencies
- TanStack Query und Suspense sind bereits im Projekt vorhanden

**Risiko:** Sehr gering. Lazy Loading kann beim ersten Aufruf einer Route einen kurzen Suspense-Fallback zeigen — daher ein dezenter Loading-Spinner als Fallback. Der `useUserRole`-Refactor behält die exakt gleiche Rückgabe-API, sodass alle 7+ Aufrufer unverändert weiterlaufen.

## Reihenfolge der Umsetzung

1. QueryClient-Defaults + `useUserRole`-Refactor (sofort spürbar weniger Netzwerk-Traffic)
2. Code-Splitting in `App.tsx` (größter Bundle-Impact)
3. Logging-Cleanup + Font-Loading (Feinschliff)

Soll ich es so umsetzen?
