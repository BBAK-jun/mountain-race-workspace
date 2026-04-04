import { Html } from "@react-three/drei";
import type { ActiveBubble } from "@/features/mountain-race/types";
import { getTrackPoint } from "./Track";

const BUBBLE_Y_OFFSET = 3.0;

interface SpeechBubbleProps {
  activeBubble: ActiveBubble | null;
  characterProgress: number | null;
}

export function SpeechBubble({ activeBubble, characterProgress }: SpeechBubbleProps) {
  if (!activeBubble || characterProgress === null) return null;

  const anchorPos = getTrackPoint(characterProgress);

  return (
    <group position={[anchorPos.x, anchorPos.y + BUBBLE_Y_OFFSET, anchorPos.z]}>
      <Html center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "relative",
            background: "rgba(255, 255, 255, 0.92)",
            borderRadius: "10px",
            padding: "6px 12px",
            fontSize: "13px",
            lineHeight: 1.35,
            fontWeight: 600,
            color: "#1a1a2e",
            minWidth: "120px",
            maxWidth: "220px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "1.5px solid rgba(0,0,0,0.08)",
            whiteSpace: "normal",
            wordBreak: "keep-all",
            overflowWrap: "anywhere",
            userSelect: "none",
          }}
        >
          {activeBubble.text}
          <div
            style={{
              position: "absolute",
              bottom: "-6px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid rgba(255, 255, 255, 0.92)",
            }}
          />
        </div>
      </Html>
    </group>
  );
}
