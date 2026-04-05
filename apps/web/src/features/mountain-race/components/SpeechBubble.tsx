import { Html } from "@react-three/drei";
import { useRef, useEffect, useState, memo } from "react";
import type { ActiveBubble } from "@/features/mountain-race/types";
import { DIALOGUE_DISPLAY_TIME_MS } from "@/features/mountain-race/constants";
import { getTrackPoint } from "./Track";

const BUBBLE_Y_OFFSET = 3.0;
const ANIMATION_DURATION_MS = Math.round(DIALOGUE_DISPLAY_TIME_MS * 1.5);

const KEYFRAMES = `
@keyframes textLife {
  0%   { opacity: 0; transform: translateY(10px); }
  8%   { opacity: 1; transform: translateY(0); }
  35%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-280px); }
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

@media (prefers-reduced-motion: reduce) {
  @keyframes textLife {
    0%   { opacity: 0; transform: none; }
    8%   { opacity: 1; transform: none; }
    35%  { opacity: 1; transform: none; }
    100% { opacity: 0; transform: none; }
  }
  @keyframes glowLife { 0%, 100% { opacity: 0; transform: none; } }
  @keyframes wisp     { 0%, 100% { opacity: 0; transform: none; } }
  @keyframes wispMid  { 50% { opacity: 0; } }
}
`;

const STYLE_ID = "speech-bubble-keyframes";

function ensureKeyframes(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

ensureKeyframes();

interface WispConfig {
  id: string;
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
    id: "w0",
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
    id: "w1",
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
    id: "w2",
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
    id: "w3",
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
    id: "w4",
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
    id: "w5",
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
    id: "w6",
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

function bubbleKey(b: ActiveBubble | null): string | null {
  return b ? `${b.characterId}-${b.endTime}` : null;
}

export const SpeechBubble = memo(
  function SpeechBubble({ activeBubble, characterProgress }: SpeechBubbleProps) {
    const [visibleBubble, setVisibleBubble] = useState<ActiveBubble | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeKeyRef = useRef<string | null>(null);

    useEffect(() => {
      ensureKeyframes();
    }, []);

    const incomingKey = bubbleKey(activeBubble);

    useEffect(() => {
      if (incomingKey === activeKeyRef.current) return;
      activeKeyRef.current = incomingKey;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (!activeBubble || !incomingKey) {
        setVisibleBubble(null);
        return;
      }

      setVisibleBubble(activeBubble);

      timerRef.current = setTimeout(() => {
        setVisibleBubble(null);
        activeKeyRef.current = null;
      }, ANIMATION_DURATION_MS + 50);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [incomingKey, activeBubble]);

    if (!visibleBubble || characterProgress === null) return null;

    const anchorPos = getTrackPoint(characterProgress);
    const dur = `${ANIMATION_DURATION_MS}ms`;
    const dissolveDelay = ANIMATION_DURATION_MS * 0.33;
    const wispDur = ANIMATION_DURATION_MS * 0.67;
    const animKey = bubbleKey(visibleBubble);

    return (
      <group position={[anchorPos.x, anchorPos.y + BUBBLE_Y_OFFSET, anchorPos.z]}>
        <Html center distanceFactor={12} zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
          <div
            key={animKey}
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
            {/* Ambient glow */}
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

            {/* Smoke wisps */}
            {WISPS.map((w) => (
              <div
                key={w.id}
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
                willChange: "opacity, transform",
              }}
            >
              {visibleBubble.text}
            </span>
          </div>
        </Html>
      </group>
    );
  },
  (prev, next) =>
    prev.activeBubble?.characterId === next.activeBubble?.characterId &&
    prev.activeBubble?.endTime === next.activeBubble?.endTime &&
    prev.characterProgress === next.characterProgress,
);
