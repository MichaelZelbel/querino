// Consent for the one optional thing on this site: the host's visitor statistics
// (Lovable's analytics script, /~flock.js, which the host injects into every page).
// We cannot remove that script, so GATE_SCRIPT runs first, inline in <head>, and holds it:
// until the visitor chooses "Accept all" it may neither write its session-id cookie
// nor send a report to /~api/analytics. The choice is stored in localStorage, which is
// strictly necessary to remember it (§ 25 (2) TDDDG).
//
// The same choice governs two conveniences: the preferred assistant of the Send
// buttons and the router's scroll positions. Only "Accept all" lets them outlive
// the page visit; with "Just the essentials", or before any choice, they live in
// memory only and nothing of theirs is left in localStorage or sessionStorage.

import { safeStorage } from "@/lib/safeStorage.ts";

export const CONSENT_KEY = "querino-consent";
export const CONSENT_EVENT = "querino-consent-open";
export type Consent = "all" | "essential";
export const PREFERRED_LLM_KEY = "querino_preferred_llm";
// The router copies its scroll positions to sessionStorage under
// `tsr-scroll-restoration-v<N>` on pagehide; the version suffix follows the router.
export const SCROLL_STORAGE_PREFIX = "tsr-scroll-restoration";

export const GATE_SCRIPT = `(function(){
var K=${JSON.stringify(CONSENT_KEY)};
function ok(){try{return localStorage.getItem(K)==="all"}catch(e){return false}}
var A="/~api/analytics";
try{
var d=Object.getOwnPropertyDescriptor(Document.prototype,"cookie");
Object.defineProperty(document,"cookie",{configurable:true,
get:function(){return d.get.call(document)},
set:function(v){v=String(v);if(!ok()&&/^\\s*session-id=/.test(v)&&!/max-age=0/i.test(v))return;d.set.call(document,v)}});
}catch(e){}
var X=XMLHttpRequest.prototype,o=X.open,s=X.send;
X.open=function(m,u){this.__qStat=String(u).indexOf(A)!==-1;return o.apply(this,arguments)};
X.send=function(){if(this.__qStat&&!ok())return;return s.apply(this,arguments)};
if(window.fetch){var f=window.fetch;window.fetch=function(i){var u=typeof Request!=="undefined"&&i instanceof Request?i.url:String(i);if(String(u).indexOf(A)!==-1&&!ok())return Promise.resolve(new Response(null,{status:204}));return f.apply(this,arguments)}}
if(navigator.sendBeacon){var b=navigator.sendBeacon.bind(navigator);navigator.sendBeacon=function(u){if(String(u).indexOf(A)!==-1&&!ok())return true;return b.apply(null,arguments)}}
})();`;

export function readConsent(): Consent | null {
  const v = safeStorage.getItem(CONSENT_KEY);
  return v === "all" || v === "essential" ? v : null;
}

export function mayRemember(consent: Consent | null): boolean {
  return consent === "all";
}

export function saveConsent(choice: Consent) {
  // storage blocked: the banner simply asks again next time
  safeStorage.setItem(CONSENT_KEY, choice);
  if (choice === "essential") {
    // withdrawing is as easy as agreeing: drop the statistics cookie and the
    // remembered conveniences at once
    document.cookie = "session-id=; Max-Age=0; path=/; secure";
    forgetConveniences();
  }
}

function forgetConveniences(): void {
  safeStorage.removeItem(PREFERRED_LLM_KEY);
  forgetScrollPositions();
}

export function forgetScrollPositions(): void {
  try {
    if (typeof window === "undefined") return;
    const store = window.sessionStorage;
    // Collected first: removing while walking by index skips keys.
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith(SCROLL_STORAGE_PREFIX)) doomed.push(key);
    }
    for (const key of doomed) store.removeItem(key);
  } catch {
    // Nothing to do: what cannot be read cannot need removing.
  }
}

// TanStack keeps scroll positions in memory and writes them to sessionStorage
// from its own pagehide listener, registered while the router is constructed.
// Listeners run in registration order, so calling this after createRouter
// removes that copy in the same task unless the visitor chose "Accept all".
// It also removes a preferred assistant stored before the choice governed it:
// those visitors never see the banner again, so saveConsent never runs for them.
export function keepConveniencesInMemory(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("pagehide", () => {
    if (!mayRemember(readConsent())) forgetConveniences();
  });
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
