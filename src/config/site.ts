// The one place the app asks where it is running.
//
// Nine render-path sites built canonical URLs, RSS links and JSON-LD out of
// `window.location.origin`. On a server there is no window, so each of them is a crash
// the moment any of those pages renders outside a browser. Routing them through here
// turns nine crash sites into one.
//
// In a browser this returns exactly what `window.location.origin` returned before, so
// nothing about the rendered page changes. Only off the browser does the fallback apply.
//
// Known, deliberately unchanged: because the browser branch still wins, a page served
// from a preview host publishes canonical URLs pointing at that preview host. Fixing
// that means changing what the app publishes, which is a product decision and not
// migration preparation. It is recorded in migration/migration-risks.md, and SSR will
// resolve it on its own by taking the configured origin instead.

const CONFIGURED_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN?.replace(/\/+$/, "") || "https://querino.ai";

export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return CONFIGURED_ORIGIN;
}
