import { Html } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import type { ActiveBubble } from "@/features/mountain-race/types";
import { getTrackPoint } from "./Track";

const BUBBLE_Y_OFFSET = 3.0;
const DURATION_MS = 3000;

const KEYFRAMES = `
@keyframes textLife {
  0%   { opacity: 0; transform: translateY(10px);    filter: blur(3px); }
  8%   { opacity: 1; transform: translateY(0);        filter: blur(0px); }
  35%  { opacity: 1; transform: translateY(0);         filter: blur(0px); }
  100% { opacity: 0; transform: translateY(-280px);    filter: blur(5px); }
}

@keyframes glowLife {
  0%   { opacity: 0;   transform: scale(0.9); }
  8%   { opacity: 0.5; transform: scale(1); }
  35%  { opacity: 0.4; transform: scale(1); }
  100% { opacity: 0;   transform: scale(2.8) translateY(-140px); }
}

@keyframes wisp {
  0%   { opacity: 0; transform: translate(var(--wx,0), var(--wy,0)) scale(0.4); }
  100% { opacity: 0; transform: translate(var(--ex,0), var(--ey,0)) scale(var(--es,2)); }
}

@keyframes wispMid {
  50%  { opacity: var(--peak, 0.35); }
}
`;

interface WispConfig {
  ex: number;
  ey: number;
  es: number;
  peak: number;
  size: number;
  delay: number;
  left: string;
  top: string;
  rgb: string;
}

const WISPS: WispConfig[] = [
  {
    ex: -120,
    ey: -220,
    es: 3.2,
    peak: 0.4,
    size: 56,
    delay: 0,
    left: "20%",
    top: "35%",
    rgb: "200,215,245",
  },
  {
    ex: 110,
    ey: -250,
    es: 3.5,
    peak: 0.35,
    size: 50,
    delay: 0.08,
    left: "58%",
    top: "30%",
    rgb: "190,208,240",
  },
  {
    ex: 15,
    ey: -290,
    es: 3.8,
    peak: 0.3,
    size: 44,
    delay: 0.15,
    left: "40%",
    top: "25%",
    rgb: "180,200,235",
  },
  {
    ex: -95,
    ey: -260,
    es: 3.0,
    peak: 0.3,
    size: 48,
    delay: 0.1,
    left: "14%",
    top: "42%",
    rgb: "195,210,240",
  },
  {
    ex: 130,
    ey: -200,
    es: 3.2,
    peak: 0.25,
    size: 42,
    delay: 0.18,
    left: "64%",
    top: "38%",
    rgb: "210,220,248",
  },
  {
    ex: -40,
    ey: -310,
    es: 3.5,
    peak: 0.22,
    size: 38,
    delay: 0.24,
    left: "34%",
    top: "48%",
    rgb: "185,205,240",
  },
  {
    ex: 75,
    ey: -270,
    es: 3.0,
    peak: 0.2,
    size: 36,
    delay: 0.3,
    left: "50%",
    top: "44%",
    rgb: "205,215,242",
  },
];

interface SpeechBubbleProps {
  activeBubble: ActiveBubble | null;
  characterProgress: number | null;
}

export function SpeechBubble({ activeBubble, characterProgress }: SpeechBubbleProps) {
  const [visibleBubble, setVisibleBubble] = useState<ActiveBubble | null>(null);
  const prevKeyRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activeBubble) return;

    const key = `${activeBubble.characterId}-${activeBubble.endTime}`;
    if (prevKeyRef.current === key) return;

    prevKeyRef.current = key;

    if (timerRef.current) clearTimeout(timerRef.current);

    setVisibleBubble(null);
    requestAnimationFrame(() => setVisibleBubble(activeBubble));

    timerRef.current = setTimeout(() => {
      setVisibleBubble(null);
      prevKeyRef.current = null;
    }, DURATION_MS + 50);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeBubble]);

  if (!visibleBubble || characterProgress === null) return null;

  const anchorPos = getTrackPoint(characterProgress);
  const dur = `${DURATION_MS}ms`;
  const dissolveDelay = DURATION_MS * 0.33;
  const wispDur = DURATION_MS * 0.67;

  return (
    <group position={[anchorPos.x, anchorPos.y + BUBBLE_Y_OFFSET, anchorPos.z]}>
      <Html center distanceFactor={12} zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
        <style>{KEYFRAMES}</style>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "160px",
            maxWidth: "300px",
            userSelect: "none",
          }}
        >
          {/* Ambient glow — drifts upward with text */}
          <div
            style={{
              position: "absolute",
              inset: "-28px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgba(200,215,245,0.25) 0%, transparent 65%)",
              animation: `glowLife ${dur} ease-in-out forwards`,
              pointerEvents: "none",
              willChange: "opacity, transform",
            }}
          />

          {/* Smoke wisps — drift far upward during dissolve */}
          {WISPS.map((w) => (
            <div
              key={`${w.left}-${w.top}`}
              style={{
                position: "absolute",
                left: w.left,
                top: w.top,
                width: `${w.size}px`,
                height: `${w.size * 0.65}px`,
                borderRadius: "50%",
                background: `radial-gradient(ellipse, rgba(${w.rgb},0.5) 0%, transparent 65%)`,
                pointerEvents: "none",
                opacity: 0,
                willChange: "opacity, transform",
                ["--wx" as string]: "0px",
                ["--wy" as string]: "0px",
                ["--ex" as string]: `${w.ex}px`,
                ["--ey" as string]: `${w.ey}px`,
                ["--es" as string]: w.es,
                ["--peak" as string]: w.peak,
                animation: [
                  `wisp ${wispDur}ms ease-out ${dissolveDelay + w.delay * 1000}ms forwards`,
                  `wispMid ${wispDur}ms ease-in-out ${dissolveDelay + w.delay * 1000}ms forwards`,
                ].join(", "),
              }}
            />
          ))}

          {/* Dialogue text */}
          <span
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: "20px",
              lineHeight: 1.45,
              fontWeight: 800,
              color: "#fff",
              textShadow:
                "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5), 0 0 20px rgba(160,185,240,0.3)",
              textAlign: "center",
              whiteSpace: "normal",
              wordBreak: "keep-all",
              overflowWrap: "anywhere",
              letterSpacing: "0.02em",
              animation: `textLife ${dur} ease-in-out forwards`,
              willChange: "opacity, transform, filter",
            }}
          >
            {visibleBubble.text}
          </span>
        </div>
      </Html>
    </group>
  );
}
