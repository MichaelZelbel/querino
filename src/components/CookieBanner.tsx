import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "declined" | null;

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
    if (!consent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 pr-8">
            <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">
              We value your privacy
            </h3>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking "Accept", you consent to our use of cookies.{" "}
              <a 
                href="/privacy" 
                className="text-primary underline-offset-4 hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="min-w-[80px]"
            >
              Decline
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAccept}
              className="min-w-[80px]"
            >
              Accept
            </Button>
          </div>
          
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground sm:right-6 sm:top-6"
            aria-label="Close cookie banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
