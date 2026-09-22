import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  CONSENT_EVENT,
  CONSENT_KEY,
  readConsent,
  saveConsent,
  type Consent,
} from "@/lib/consent";

// The old key only stored the click and nothing ever read it, so a choice saved under it
// was never honoured. Those visitors are asked again.
const OLD_CONSENT_KEY = "cookie-consent";

// Two equal choices on the first screen, and nothing optional runs before one is made
// (the gate in src/lib/consent.ts holds the host's statistics until "Accept all").
export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.removeItem(OLD_CONSENT_KEY);
    } catch {
      // storage blocked: nothing to clean up
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!readConsent()) {
      // Small delay to prevent flash on page load
      timer = setTimeout(() => setIsVisible(true), 500);
    }
    // "Cookie settings" anywhere on the site reopens the banner
    const reopen = () => setIsVisible(true);
    // a choice made in another tab of this site closes the banner here too
    const synced = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) setIsVisible(!readConsent());
    };
    window.addEventListener(CONSENT_EVENT, reopen);
    window.addEventListener("storage", synced);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(CONSENT_EVENT, reopen);
      window.removeEventListener("storage", synced);
    };
  }, []);

  // Reserve space at the bottom of the page so the fixed banner never occludes content.
  useEffect(() => {
    if (!isVisible) {
      document.body.style.paddingBottom = "";
      return;
    }
    const el = bannerRef.current;
    if (!el) return;
    const apply = () => {
      const h = el.getBoundingClientRect().height;
      document.body.style.paddingBottom = `${Math.ceil(h)}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      document.body.style.paddingBottom = "";
    };
  }, [isVisible]);

  const choose = (choice: Consent) => {
    saveConsent(choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-banner-title"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in"
    >
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3
              id="cookie-banner-title"
              className="font-display text-base font-semibold text-foreground sm:text-lg"
            >
              Our site uses cookies.
            </h3>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Think of them as harmless little prompts that help us remember
              what you like. Tap Accept all and we also count your visit, so we
              know which pages people actually read.{" "}
              <a
                href="/cookies"
                className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Learn more
              </a>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => choose("essential")}
              className="min-w-[80px]"
            >
              Just the essentials
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => choose("all")}
              className="min-w-[80px]"
            >
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
