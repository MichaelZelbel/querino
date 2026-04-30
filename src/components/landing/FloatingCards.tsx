interface FloatingCardsProps {
  dark?: boolean;
}

const CARDS = [
  { x: -180, y: -110, rot: -12, delay: 0, w: 150, label: "Coding", tag: "react", accent: "#5C5BE6" },
  { x: 180, y: -90, rot: 9, delay: 0.5, w: 140, label: "Writing", tag: "blog", accent: "#FF9B7A" },
  { x: -200, y: 90, rot: 7, delay: 1, w: 145, label: "Research", tag: "data", accent: "#22C55E" },
  { x: 190, y: 110, rot: -10, delay: 1.5, w: 150, label: "Creative", tag: "story", accent: "#A855F7", hideMobile: true },
  { x: 0, y: -200, rot: 0, delay: 0.8, w: 130, label: "Business", tag: "ops", accent: "#F59E0B", hideMobile: true },
];

export function FloatingCards({ dark = false }: FloatingCardsProps) {
  const cardBg = dark ? "rgba(26,28,46,0.92)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(124,123,255,0.25)" : "rgba(92,91,230,0.18)";
  const titleColor = dark ? "#F4F5FA" : "#1a1c30";
  const lineColor = dark ? "rgba(244,245,250,0.18)" : "rgba(26,28,48,0.14)";
  const tagBg = dark ? "rgba(124,123,255,0.18)" : "rgba(92,91,230,0.10)";

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {CARDS.map((c, i) => (
        <div
          key={i}
          className={`float-card-anim absolute ${c.hideMobile ? "hidden md:block" : ""}`}
          style={{
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
              borderRadius: 14,
              padding: "11px 13px",
              boxShadow: dark
                ? `0 12px 28px rgba(0,0,0,0.45), 0 0 24px ${c.accent}22`
                : `0 12px 28px rgba(26,28,48,0.10), 0 0 24px ${c.accent}22`,
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: c.accent }} />
              <div
                className="font-sans"
                style={{ fontSize: 11, fontWeight: 600, color: titleColor, letterSpacing: "-0.01em" }}
              >
                {c.label}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div style={{ height: 3, width: "85%", background: lineColor, borderRadius: 2 }} />
              <div style={{ height: 3, width: "65%", background: lineColor, borderRadius: 2 }} />
              <div style={{ height: 3, width: "75%", background: lineColor, borderRadius: 2 }} />
            </div>
            <div className="mt-2.5 inline-flex">
              <span
                className="font-mono"
                style={{
                  fontSize: 9,
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
