## Goal

Auf `/settings` werden die Sidebar-Links (Profile, Notifications, Privacy & Security, Billing) zu funktionierenden In-Page-Sprungankern. Billing wird komplett entfernt (kein Verkauf, kein Premium-Status-Banner). Die einzelnen Sektionen werden im gleichen kompakten Karten-Stil aufgebaut wie die `MenerioIntegrationSection` (klare CardHeader mit Icon + Titel, eindeutige Aktionen, Connected/Status-Badges wo sinnvoll).

## Änderungen in `src/pages/Settings.tsx`

### 1. Sidebar-Links funktionsfähig machen
- Alle Sidebar-Buttons werden zu echten In-Page-Anchors (`<a href="#profile">` als `Button asChild`), Scroll-Verhalten via globalem `scroll-smooth` (bzw. `scrollIntoView`).
- Aktive Sektion wird per `IntersectionObserver` (oder einfacher `useState` + `scroll`-Listener) hervorgehoben (Active-State auf dem aktuellen Button).
- Sidebar wird auf großen Screens `sticky top-24`, damit sie beim Scrollen sichtbar bleibt — analog zur Menerio-UX.
- Jede Sektions-Card bekommt eine passende `id`: `#profile`, `#notifications`, `#privacy`, `#appearance`, `#teams`, `#integrations`.
- „Sign Out" wird zu einem echten Button, der `signOut()` aus `useAuthContext` aufruft und auf `/` weiterleitet.

### 2. Billing vollständig entfernen
- „Billing"-Sidebar-Eintrag entfernen.
- Plan-Status-Card (Crown/Premium-Banner mit „Contact Support") oben auf der Seite entfernen.
- `useSubscription`-Import und `subscription`/`isPremium`/`subscriptionLoading`-State entfernen.
- `showUpgradeSuccess`-Banner und der zugehörige `?checkout=success`-Handler entfernen.
- `CreditsDisplay` bleibt erhalten, wandert aber in eine eigene kleine Card unter „Profile" (Kontext: AI-Credits sind kein Billing).
- Im GitHub-Sync-Block den „Premium Feature"-Lock-Branch entfernen — GitHub Sync ist für alle nutzbar (es gibt kein Premium mehr). Die `Crown`/„Premium"-Badges in der Card-Header-Logik entfallen.
- Teams-Card: Bedingung `{isPremium && …}` entfernen, Card immer anzeigen.

### 3. Neue Sektion: Profile (echter Inhalt statt Dummy)
Aktuell ist die Profile-Card nur ein Mock mit leeren Feldern. Da auf `/profile/edit` (`EditProfile.tsx`) bereits ein vollwertiger Profil-Editor existiert, ersetzen wir die Dummy-Felder durch eine kompakte Karten-Übersicht im Menerio-Stil:
- CardHeader mit `User`-Icon, Titel „Profile", rechts ein Badge mit dem aktuellen Display-Name/Username.
- CardContent zeigt Avatar + Username + Email read-only und einen primären Button „Edit Profile" → `navigate('/profile/edit')`.
- Damit funktioniert der Sidebar-Link „Profile" sauber als Anker und der Nutzer landet bei vollem Klick auf der echten Edit-Seite.

### 4. Neue Sektion: Privacy & Security
Bisher fehlt komplett. Neue Card mit `id="privacy"`:
- CardHeader: `Shield`-Icon, Titel „Privacy & Security".
- Inhalt:
  - Link-Row „Change password" (öffnet Supabase-Reset-Flow per `supabase.auth.resetPasswordForEmail(user.email)` mit Toast-Bestätigung — gleicher Mechanismus, den wir auch sonst nutzen).
  - Link-Row „Cookie preferences" → öffnet das bestehende Cookie-Banner (oder navigiert auf `/cookies`).
  - Link-Row „Privacy policy" → `/privacy`.
- Die bestehende „Delete Account"-Card bleibt strukturell erhalten, wird aber visuell als Sub-Block innerhalb der Privacy-Section gruppiert (eigene Card direkt darunter, ebenfalls unter `id="privacy"`), damit der Privacy-Link alle Datenschutz-Aktionen erreicht.

### 5. Notifications-Sektion
Layout bleibt, bekommt nur `id="notifications"` und denselben kompakten Header-Stil wie Menerio (Icon + Titel, optional „Coming soon"-Badge falls die Switches noch nicht persistiert werden — sie sind aktuell ohne Backend-Anbindung).

### 6. Appearance-Sektion
Bekommt `id="appearance"`. Inhalt unverändert (Dark-Mode-Toggle funktioniert bereits).

### 7. Integrationen
Sidebar-Eintrag „Integrations" wird hinzugefügt (passt zum Menerio-Vorbild). Anker `id="integrations"` umfasst:
- GitHub Sync Card (Premium-Lock entfernt, Header-Badges bereinigt).
- Menerio Integration (`MenerioIntegrationSection`) — bleibt unverändert, dient als visuelles Referenz-Pattern.
- Menerio Bulk Sync.
- MCP Server / API.

### 8. Workspace-Indicator
Bleibt oben stehen, aber kompakter (eine Zeile, kein eigener farbiger Container nötig sobald das Premium-Banner weg ist).

## Technische Details

- **Sticky Sidebar**: `<nav className="lg:sticky lg:top-24 lg:self-start space-y-2">`.
- **Anchor-Buttons**:
  ```tsx
  <Button asChild variant={active === "profile" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
    <a href="#profile">…</a>
  </Button>
  ```
- **Active section tracking**: Ein einzelner `useEffect` mit `IntersectionObserver` über alle Section-IDs setzt `active`-State.
- **Sign Out**: `const { signOut } = useAuthContext();` → `await signOut(); navigate('/');`.
- Entfernte Imports: `useSubscription`, `Crown`, `Sparkles`, `CreditCard` (nur noch verwendet, falls anderswo nötig — sonst raus), `useSearchParams` (nicht mehr nötig nach Entfernung des Checkout-Banners).
- **Keine DB-Migrationen** nötig.
- **Keine neuen Routes** nötig — Profil-Edit und Cookies-/Privacy-Seiten existieren bereits.

## Out of Scope

- Echte Persistierung der Notification-Switches (wird separat gemacht, falls gewünscht — aktuell nur „Coming soon"-Badge).
- Redesign der `EditProfile`-Seite selbst.
- Reaktivierung von Premium/Stripe (laut Memory bewusst deaktiviert).
