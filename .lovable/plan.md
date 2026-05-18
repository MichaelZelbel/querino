# Plan: Pricing-Page und alle Referenzen wirklich entfernen

## Ziel
Die Pricing-Page soll nicht nur ins Leere laufen, sondern vollständig aus App, Navigation, SEO/Sitemap, Komponenten und Doku entfernt werden.

## Was aktuell noch übrig ist
Es gibt noch mehrere Pricing-Reste im Projekt, u. a.:
- Route `/pricing` in `src/App.tsx` (derzeit auf `NotFound` umgebogen)
- komplette Seite `src/pages/Pricing.tsx`
- Pricing-Komponenten und Config:
  - `src/components/landing/PricingPreview.tsx`
  - `src/components/pricing/PricingCards.tsx`
  - `src/components/pricing/FeatureComparisonTable.tsx`
  - `src/config/pricing.ts`
- Navigationseintrag „Go to Pricing“ in `src/components/CommandPalette.tsx`
- CTA in `src/pages/PromptDetail.tsx`, die noch nach `/pricing` navigiert
- Sitemap/API-Referenz auf `/pricing` in `supabase/functions/api/index.ts`
- mehrere Doku-/Test-Verweise auf Pricing und Checkout

## Umsetzung
1. Routing und Seiten entfernen
- `src/pages/Pricing.tsx` löschen
- verbliebene `/pricing`-Route aus `src/App.tsx` entfernen
- sicherstellen, dass kein Lazy-/Page-Import mehr darauf zeigt

2. UI-Referenzen entfernen
- „Go to Pricing“ aus der Command Palette entfernen
- alle verbleibenden Buttons/Links auf `/pricing` entfernen oder auf den bereits gewünschten Nicht-Verkaufs-Flow umstellen
- speziell in `PromptDetail.tsx` den Upgrade-Redirect auf `/pricing` durch eine nicht-kommerzielle Alternative ersetzen (z. B. Support-/Info-Kontakt statt Pricing-Seite)

3. Tote Pricing-Module aufräumen
- ungenutzte Pricing-Komponenten löschen
- ungenutzte `src/config/pricing.ts` löschen
- prüfen, ob danach Imports/Hooks bereinigt werden müssen

4. SEO, Sitemap und API bereinigen
- `/pricing` aus der Sitemap-Erzeugung in `supabase/functions/api/index.ts` entfernen
- verbleibende SEO-/Canonical-/Structured-Data-Reste der Pricing-Seite entfernen

5. Doku und Backlog bereinigen
- UX-/Test-/API-Dokumente von Pricing-Page-Referenzen säubern oder als historisch/obsolet entfernen
- insbesondere Stellen mit `/pricing`, „pricing preview“, „create-checkout“, „customer-portal“ und vergleichbaren Page-Verweisen prüfen

6. Abschlussprüfung
- projektweite Suche nach `/pricing`, `Pricing`, `PricingCards`, `FeatureComparisonTable`, `PricingPreview`
- verifizieren, dass kein Nutzerpfad mehr auf eine Pricing-Seite verweist

## Technische Hinweise
- Ich ändere nur die Entfernung der Pricing-Page und ihrer Referenzen, nicht die allgemeine Premium-/Rollenlogik.
- Zahlungs-/Subscription-Backends bleiben nur dann unberührt, wenn sie keine sichtbaren Pricing-Page-Verweise mehr erzeugen; offensichtliche Dokumentations- und Sitemap-Reste werden aber bereinigt.
- Nach der Umsetzung sollte `/pricing` nirgends mehr in App-Navigation, CTA-Flows, SEO oder Docs auftauchen.