import { useEffect, useRef, useState } from "react";

function useEyes(intensity = 4) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.min(1, Math.hypot(dx, dy) / 400);
      const ang = Math.atan2(dy, dx);
      setPos({
        x: Math.cos(ang) * dist * intensity,
        y: Math.sin(ang) * dist * intensity * 0.8,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [intensity]);
  return [ref, pos] as const;
}

function useBlink(every = 2400) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      t = setTimeout(loop, every + Math.random() * 2500);
    };
    t = setTimeout(loop, 1500);
    return () => clearTimeout(t);
  }, [every]);
  return blink;
}

function useWave() {
  const [wave, setWave] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      setWave(true);
      setTimeout(() => setWave(false), 1400);
      t = setTimeout(loop, 10000 + Math.random() * 4000);
    };
    t = setTimeout(loop, 4000);
    return () => clearTimeout(t);
  }, []);
  return wave;
}

interface QuentinProps {
  size?: number;
  dark?: boolean;
}

export function Quentin({ size = 320, dark = false }: QuentinProps) {
  const [ref, eyes] = useEyes(4);
  const blink = useBlink();
  const wave = useWave();

  const body = dark ? "#7C7BFF" : "#5C5BE6";
  const bodyHi = dark ? "#A5A4FF" : "#8987F5";
  const bodyLo = dark ? "#4A49C7" : "#3F3DC7";
  const cheek = "#FF9B7A";
  const card = dark ? "#1A1B2E" : "#FFFFFF";
  const cardEdge = dark ? "#2A2B45" : "#E5E7F0";
  const cardLine = dark ? "#3A3B5A" : "#D0D3E0";
  const accent = "#FFB088";

  return (
    <div
      ref={ref}
      className="quentin-float"
      style={{
        width: size,
        height: size,
        position: "relative",
        animation: "mascotFloat 4s ease-in-out infinite",
        filter: dark
          ? "drop-shadow(0 20px 40px rgba(124,123,255,0.25))"
          : "drop-shadow(0 20px 40px rgba(92,91,230,0.25))",
      }}
    >
      <svg viewBox="0 0 320 320" width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="qBody" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={bodyHi} />
            <stop offset="60%" stopColor={body} />
            <stop offset="100%" stopColor={bodyLo} />
          </radialGradient>
          <radialGradient id="qCheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={cheek} stopOpacity="0.85" />
            <stop offset="100%" stopColor={cheek} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="qCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={card} />
            <stop offset="100%" stopColor={dark ? "#15162a" : "#F4F5FA"} />
          </linearGradient>
        </defs>

        <ellipse cx="160" cy="295" rx="90" ry="9" fill={dark ? "#000" : "#1a1c30"} opacity={dark ? 0.45 : 0.12} />

        <g
          className="quentin-squish"
          style={{ transformOrigin: "160px 200px", animation: "mascotSquish 4s ease-in-out infinite" }}
        >
          <path
            d="M 160 60 C 220 60, 260 105, 260 170 C 260 235, 220 285, 160 285 C 100 285, 60 235, 60 170 C 60 105, 100 60, 160 60 Z"
            fill="url(#qBody)"
          />
          <ellipse cx="125" cy="115" rx="35" ry="22" fill="#fff" opacity="0.18" />
          <circle cx="105" cy="180" r="14" fill="url(#qCheek)" />
          <circle cx="215" cy="180" r="14" fill="url(#qCheek)" />

          <g transform={`translate(${eyes.x}, ${eyes.y})`}>
            <ellipse cx="130" cy="155" rx="14" ry={blink ? 1.5 : 16} fill="#1a1c30" style={{ transition: "ry 80ms ease" }} />
            {!blink && (
              <>
                <circle cx="134" cy="151" r="4.5" fill="#fff" />
                <circle cx="127" cy="159" r="2" fill="#fff" opacity="0.7" />
              </>
            )}
            <ellipse cx="190" cy="155" rx="14" ry={blink ? 1.5 : 16} fill="#1a1c30" style={{ transition: "ry 80ms ease" }} />
            {!blink && (
              <>
                <circle cx="194" cy="151" r="4.5" fill="#fff" />
                <circle cx="187" cy="159" r="2" fill="#fff" opacity="0.7" />
              </>
            )}
          </g>

          <path d="M 145 200 Q 160 215, 175 200" stroke="#1a1c30" strokeWidth="4" strokeLinecap="round" fill="none" />

          <line x1="160" y1="60" x2="160" y2="38" stroke={bodyLo} strokeWidth="3" strokeLinecap="round" />
          <circle cx="160" cy="34" r="6" fill={accent}>
            <animate attributeName="r" values="6;7.5;6" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="160" cy="34" r="10" fill={accent} opacity="0.3">
            <animate attributeName="r" values="10;14;10" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Left arm with held card */}
        <g style={{ transformOrigin: "85px 220px" }}>
          <path d="M 80 215 Q 60 230, 65 260" stroke={body} strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="65" cy="260" r="11" fill={body} />
          <g transform="translate(35 215) rotate(-8)">
            <rect x="0" y="0" width="78" height="60" rx="6" fill="url(#qCard)" stroke={cardEdge} strokeWidth="1.2" />
            <rect x="8" y="9" width="36" height="4" rx="2" fill={accent} />
            <rect x="8" y="20" width="62" height="2.5" rx="1.25" fill={cardLine} />
            <rect x="8" y="27" width="55" height="2.5" rx="1.25" fill={cardLine} />
            <rect x="8" y="34" width="48" height="2.5" rx="1.25" fill={cardLine} />
            <rect x="8" y="46" width="22" height="7" rx="3.5" fill={body} opacity="0.18" />
            <rect x="34" y="46" width="22" height="7" rx="3.5" fill={accent} opacity="0.3" />
          </g>
        </g>

        {/* Right arm — waves */}
        <g
          className="quentin-wave"
          style={{
            transformOrigin: "240px 220px",
            animation: wave ? "mascotWave 1.4s ease-in-out" : "none",
          }}
        >
          <path d="M 240 215 Q 270 220, 275 195" stroke={body} strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="275" cy="195" r="11" fill={body} />
        </g>
      </svg>
    </div>
  );
}
