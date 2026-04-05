import { useEffect, useRef, useState } from "react";
import type { HiddenEffectCategory } from "@mountain-race/types";
import { useConnectionStore } from "../store/useConnectionStore";
import { useGameStore } from "../store/useGameStore";

const AUTO_HIDE_MS = 3000;

const CATEGORY_BORDER: Record<HiddenEffectCategory, string> = {
  good: "border-emerald-400",
  bad: "border-red-400",
  wildcard: "border-purple-400",
};

export function EffectRevealOverlay() {
  const lastReveal = useConnectionStore((s) => s.lastEffectReveal);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRevealRef = useRef(lastReveal);

  useEffect(() => {
    if (!lastReveal || lastReveal === prevRevealRef.current) return;
    prevRevealRef.current = lastReveal;
    setVisible(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      useConnectionStore.setState({ lastEffectReveal: null });
    }, AUTO_HIDE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastReveal]);

  if (!visible || !lastReveal) return null;

  const { characters } = useGameStore.getState();
  const playerName =
    lastReveal.targetName ?? characters.find((c) => c.id === lastReveal.playerId)?.name ?? "???";
  const { effect } = lastReveal;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div
        className={`animate-in fade-in-0 zoom-in-75 rounded-2xl border-2 ${CATEGORY_BORDER[effect.category]} bg-black/60 px-8 py-5 text-center backdrop-blur-md duration-300`}
      >
        <p className="text-2xl font-bold text-white md:text-3xl">🎲 {playerName}의 비밀 효과</p>
        <p className="mt-2 text-xl font-bold text-white/90 md:text-2xl">
          {effect.emoji} {effect.name}!
        </p>
      </div>
    </div>
  );
}
