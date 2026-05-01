import { useEffect, useState } from "react";

/**
 * TypingPrompt — typewriter card that sits below Quentin and types
 * example prompts character-by-character on a loop.
 *
 * Phase machine: typing → hold → erasing → next-line → typing.
 * This is the centerpiece of the hero — do NOT remove.
 *
 * Reduced-motion: the loop still runs (carries content) but ~2× slower.
 */
const LINES = [
  "Write a sci-fi short story about...",
  "Refactor this React component to...",
  "Plan a 3-day trip to Lisbon for...",
  "Generate a SQL query that joins...",
];

type Phase = "typing" | "hold" | "erasing";

interface TypingPromptProps {
  dark?: boolean;
}

export function TypingPrompt({ dark = false }: TypingPromptProps) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const slow = reduce ? 2 : 1;

    const cur = LINES[idx];
    let t: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text.length < cur.length) {
        t = setTimeout(
          () => setText(cur.slice(0, text.length + 1)),
          (45 + Math.random() * 40) * slow,
        );
      } else {
        t = setTimeout(() => setPhase("hold"), 1400 * slow);
      }
    } else if (phase === "hold") {
      t = setTimeout(() => setPhase("erasing"), 800 * slow);
    } else {
      if (text.length > 0) {
        t = setTimeout(() => setText(text.slice(0, -1)), 18 * slow);
      } else {
        t = setTimeout(() => {
          setIdx((i) => (i + 1) % LINES.length);
          setPhase("typing");
        }, 0);
      }
    }
    return () => clearTimeout(t);
  }, [text, phase, idx]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "absolute",
        bottom: -52,
        left: "50%",
        transform: "translateX(-50%)",
        background: dark ? "rgba(26,28,46,0.95)" : "rgba(255,255,255,0.96)",
        border: `1px solid ${dark ? "rgba(124,123,255,0.3)" : "rgba(92,91,230,0.2)"}`,
        borderRadius: 14,
        padding: "10px 14px",
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12,
        color: dark ? "#A5A4FF" : "#5C5BE6",
        boxShadow: dark
          ? "0 12px 32px rgba(0,0,0,0.5)"
          : "0 12px 32px rgba(92,91,230,0.18)",
        whiteSpace: "nowrap",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 5,
      }}
    >
      <span style={{ opacity: 0.6, marginRight: 6 }}>{">"}</span>
      {text}
      <span
        className="typing-caret"
        style={{ animation: "blinkCaret 1s step-end infinite", marginLeft: 1 }}
      >
        ▌
      </span>
    </div>
  );
}
