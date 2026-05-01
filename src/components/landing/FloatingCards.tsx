/**
 * FloatingCards — five mini prompt-card chips that orbit Quentin
 * inside the hero stage. Positions/rotations match source/floating-cards.jsx.
 * Animations: floatCard0..4 keyframes (defined in src/index.css).
 */
interface FloatingCardsProps {
  dark?: boolean;
}

const CARDS = [
  { x: -180, y: -110, rot: -12, delay: 0,   w: 150, label: "Coding",   tag: "react", accent: "#5C5BE6" },
  { x:  180, y:  -90, rot:   9, delay: 0.5, w: 140, label: "Writing",  tag: "blog",  accent: "#FF9B7A" },
  { x: -200, y:   90, rot:   7, delay: 1,   w: 145, label: "Research", tag: "data",  accent: "#22C55E" },
  { x:  190, y:  110, rot: -10, delay: 1.5, w: 150, label: "Creative", tag: "story", accent: "#A855F7" },
  { x:    0, y: -200, rot:   0, delay: 0.8, w: 130, label: "Business", tag: "ops",   accent: "#F59E0B" },
];

export function FloatingCards({ dark = false }: FloatingCardsProps) {
  const cardBg     = dark ? "rgba(26,28,46,0.92)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(124,123,255,0.25)" : "rgba(92,91,230,0.18)";
  const titleColor = dark ? "#F4F5FA" : "#1a1c30";
  const lineColor  = dark ? "rgba(244,245,250,0.18)" : "rgba(26,28,48,0.14)";
  const tagBg      = dark ? "rgba(124,123,255,0.18)" : "rgba(92,91,230,0.10)";

  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
    >
      {CARDS.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: c.w,
            transform: `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px)) rotate(${c.rot}deg)`,
            animation: `floatCard${i} ${5 + i * 0.5}s ease-in-out ${c.delay}s infinite`,
          }}
        >
          <div
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: "11px 13px",
              boxShadow: dark
                ? "0 12px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)"
                : "0 12px 28px rgba(26,28,48,0.10), 0 2px 6px rgba(26,28,48,0.06)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 99, background: c.accent }} />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: titleColor,
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                {c.label}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ height: 3, width: "85%", background: lineColor, borderRadius: 2 }} />
              <div style={{ height: 3, width: "65%", background: lineColor, borderRadius: 2 }} />
              <div style={{ height: 3, width: "75%", background: lineColor, borderRadius: 2 }} />
            </div>
            <div style={{ marginTop: 9, display: "inline-flex" }}>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: '"JetBrains Mono", monospace',
                  background: tagBg,
                  color: c.accent,
                  padding: "2px 7px",
                  borderRadius: 99,
                  fontWeight: 500,
                }}
              >
                #{c.tag}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
