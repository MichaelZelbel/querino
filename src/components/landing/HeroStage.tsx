import { useEffect, useState } from "react";
import { Quentin } from "./Quentin";
import { TypingPrompt } from "./TypingPrompt";
import { FloatingCards } from "./FloatingCards";

/**
 * HeroStage — the right-column "stage" behind Quentin:
 * indigo→coral gradient plate + 32×32 dot grid (center-fade mask)
 * + 5 floating cards + Quentin (with glasses) + TypingPrompt + speech bubble.
 *
 * The gradient + grid live in src/index.css (.stage-bg / .stage-grid)
 * because they need color-mix-equivalent tokens that respond to dark mode.
 */
export function HeroStage() {
  // Detect dark mode (class on <html>) so SVG palettes can swap.
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="hero-stage">
      <div className="stage-bg">
        <div className="stage-grid" />
      </div>

      <FloatingCards dark={isDark} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <Quentin size={320} glasses dark={isDark} />
        <TypingPrompt dark={isDark} />
      </div>

      <div className="speech-bubble">
        <span>Hi! I'm Quentin.</span>
        <span style={{ opacity: 0.6, fontSize: 11 }}>I wrangle prompts.</span>
      </div>
    </div>
  );
}
