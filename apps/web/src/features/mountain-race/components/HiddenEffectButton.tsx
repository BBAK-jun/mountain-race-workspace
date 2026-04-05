import { useState } from "react";
import { useConnectionStore } from "../store/useConnectionStore";

export function HiddenEffectButton() {
  const hasHiddenEffect = useConnectionStore((s) => s.hasHiddenEffect);
  const send = useConnectionStore((s) => s.send);
  const [activated, setActivated] = useState(false);

  if (!hasHiddenEffect || activated) return null;

  const handleClick = () => {
    send({ type: "activateEffect" });
    setActivated(true);
  };

  return (
    <>
      <style>{`
        @keyframes mr-pulse-effect {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
        <button
          type="button"
          onClick={handleClick}
          className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-2xl font-black text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/70 active:scale-95"
          style={{ animation: "mr-pulse-effect 2s ease-in-out infinite" }}
          aria-label="숨겨진 효과 발동"
        >
          ?
        </button>
      </div>
    </>
  );
}
