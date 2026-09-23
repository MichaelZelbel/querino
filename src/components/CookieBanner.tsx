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

  // The banner renders last in the page, so a keyboard user would otherwise
  // reach it only after tabbing through everything. Move focus to it when it
  // appears, unless the visitor is already typing somewhere.
  useEffect(() => {
    if (!isVisible) return;
    const active = document.activeElement as HTMLElement | null;
    const typing =
      !!active &&
      (active.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName));
    if (!typing) bannerRef.current?.focus({ preventScroll: true });
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
      tabIndex={-1}
      className="fixed bottom-0 left-0 right-0 z-50 p-2 outline-hidden animate-fade-in sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-3 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex-1">
            <h3
              id="cookie-banner-title"
              className="sr-only font-display text-base font-semibold text-foreground sm:not-sr-only sm:text-lg"
            >
              Our site uses cookies.
            </h3>
            <p className="font-sans text-sm text-muted-foreground sm:hidden">
              We use cookies, and Accept all also counts your visit.{" "}
              <a
                href="/cookies"
                className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Learn more
              </a>
            </p>
            <p className="mt-1 hidden font-sans text-sm text-muted-foreground sm:block">
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => choose("essential")}
              className="h-8 flex-1 px-3 text-xs sm:h-9 sm:flex-none sm:min-w-[80px] sm:text-sm"
            >
              Just the essentials
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => choose("all")}
              className="h-8 flex-1 px-3 text-xs sm:h-9 sm:flex-none sm:min-w-[80px] sm:text-sm"
            >
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
