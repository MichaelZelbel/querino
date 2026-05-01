/**
 * Quentin — Querino's mascot. Pure-SVG cloud-ghost with optional
 * round wireframe glasses (production renders with `glasses`).
 *
 * Animations live in `src/index.css`:
 *   - querioBob     (4s)   body bob
 *   - querioBlink   (5s)   eye blink
 *   - querioSparkle (2.4s) prompt-glyph sparkle pulses (staggered)
 *   - inline <animate> on the floor shadow (3.5s) breathing
 *
 * The lowercase "quentin" name pill below the SVG is part of this
 * component on purpose — its `bottom: 4` keeps the floor shadow visible.
 */
interface QuentinProps {
  size?: number;
  glasses?: boolean;
  dark?: boolean;
}

export function Quentin({ size = 320, glasses = false, dark = false }: QuentinProps) {
  const id = "querio";
  const c0 = "#E5E5FF";
  const c1 = dark ? "#A5A4FF" : "#9594FF";
  const c2 = dark ? "#7C7BFF" : "#5C5BE6";

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        filter: dark
          ? "drop-shadow(0 12px 30px rgba(124,123,255,0.55))"
          : "drop-shadow(0 12px 30px rgba(92,91,230,0.45))",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        style={{ overflow: "visible", display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${id}-body`} cx=".4" cy=".3" r=".75">
            <stop offset="0%" stopColor={c0} />
            <stop offset="50%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </radialGradient>
          <radialGradient id={`${id}-shine`} cx=".35" cy=".25" r=".5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-halo`} cx=".5" cy=".5" r=".5">
            <stop offset="0%" stopColor={c2} stopOpacity={dark ? "0.45" : "0.35"} />
            <stop offset="100%" stopColor={c2} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* halo */}
        <circle cx="120" cy="125" r="105" fill={`url(#${id}-halo)`} />

        {/* prompt-glyph sparkles */}
        <g style={{ animation: "querioSparkle 2.4s ease-in-out infinite", transformOrigin: "47px 68px" }}
           fontFamily="JetBrains Mono, monospace" fontWeight={700} fill={c1}>
          <text x="40" y="74" fontSize="18">{">"}</text>
        </g>
        <g style={{ animation: "querioSparkle 2.4s ease-in-out infinite", animationDelay: "0.6s", transformOrigin: "197px 86px" }}
           fontFamily="JetBrains Mono, monospace" fontWeight={700} fill={c1}>
          <text x="190" y="92" fontSize="16">{"{"}</text>
          <text x="200" y="92" fontSize="16">{"}"}</text>
        </g>
        <g style={{ animation: "querioSparkle 2.4s ease-in-out infinite", animationDelay: "1.2s", transformOrigin: "57px 168px" }}
           fontFamily="JetBrains Mono, monospace" fontWeight={700} fill={c1}>
          <text x="50" y="174" fontSize="16">{">"}</text>
        </g>
        <g style={{ animation: "querioSparkle 2.4s ease-in-out infinite", animationDelay: "1.8s", transformOrigin: "189px 160px" }}
           fontFamily="JetBrains Mono, monospace" fontWeight={700} fill={c1}>
          <text x="186" y="166" fontSize="14">/</text>
        </g>

        {/* floor shadow — breathing rx (3.5s) */}
        <ellipse cx="120" cy="218" rx="48" ry="6" fill="#06121F" opacity={dark ? "0.55" : "0.35"}>
          <animate attributeName="rx" values="48;38;48" dur="3.5s" repeatCount="indefinite" />
        </ellipse>

        {/* body — cloud-ghost with 4 wavy "feet" */}
        <g style={{ animation: "querioBob 4s ease-in-out infinite", transformOrigin: "50% 100%" }}>
          <path
            d="M75 110
               C 75 70, 165 70, 165 110
               L 165 180
               Q 152 190, 145 180
               Q 138 195, 125 180
               Q 118 195, 105 180
               Q 95 195, 85 180
               L 75 180 Z"
            fill={`url(#${id}-body)`}
            stroke={c0}
            strokeWidth="1.5"
          />
          <ellipse cx="98" cy="92" rx="22" ry="14" fill={`url(#${id}-shine)`} />

          {/* eyes */}
          <g style={{ animation: "querioBlink 5s steps(1) infinite", transformOrigin: "50% 50%" }}>
            <ellipse cx="103" cy="125" rx="6" ry="9" fill="#0E121B" />
            <ellipse cx="137" cy="125" rx="6" ry="9" fill="#0E121B" />
            <circle cx="105" cy="121" r="2.2" fill="#FFFFFF" />
            <circle cx="139" cy="121" r="2.2" fill="#FFFFFF" />
          </g>

          {/* round wireframe glasses */}
          {glasses && (
            <g fill="none" stroke="#1A1830" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="103" cy="125" r="13" fill="#FFFFFF" fillOpacity="0.18" />
              <circle cx="137" cy="125" r="13" fill="#FFFFFF" fillOpacity="0.18" />
              <path d="M116 125 Q 120 122 124 125" />
              <path d="M90 124 L 84 122" />
              <path d="M150 124 L 156 122" />
              <circle cx="99" cy="120" r="1.6" fill="#FFFFFF" stroke="none" opacity="0.9" />
              <circle cx="133" cy="120" r="1.6" fill="#FFFFFF" stroke="none" opacity="0.9" />
            </g>
          )}

          {/* tiny smile */}
          <path
            d="M114 145 Q 120 150 126 145"
            stroke="#0E121B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* white cheeks */}
          <ellipse cx="93" cy="142" rx="5" ry="3" fill="#FFFFFF" opacity=".7" />
          <ellipse cx="147" cy="142" rx="5" ry="3" fill="#FFFFFF" opacity=".7" />
        </g>
      </svg>

      {/* "quentin" name pill */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 4,
          transform: "translateX(-50%)",
          fontSize: 11,
          color: c1,
          letterSpacing: "0.15em",
          textTransform: "lowercase",
          fontFamily: '"JetBrains Mono", monospace',
          background: dark ? "rgba(20,18,40,0.6)" : "rgba(245,244,255,0.85)",
          padding: "3px 10px",
          borderRadius: 999,
          border: `1px solid ${c1}55`,
        }}
      >
        quentin
      </div>
    </div>
  );
}
