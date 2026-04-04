import { useCallback, useEffect } from "react";
import { useGameStore } from "../store/useGameStore";

export function CameraControls() {
  const characters = useGameStore((s) => s.characters);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setCameraTarget = useGameStore((s) => s.setCameraTarget);
  const isRacing = useGameStore((s) => s.isRacing);

  const isFree = cameraMode === "free";

  const toggleMode = useCallback(() => {
    if (isFree) {
      setCameraMode("follow");
      setCameraTarget(null);
    } else {
      setCameraMode("free");
    }
  }, [isFree, setCameraMode, setCameraTarget]);

  const focusCharacter = useCallback(
    (index: number) => {
      const char = characters[index];
      if (!char) return;
      if (!isFree) setCameraMode("free");
      setCameraTarget(char.id);
    },
    [characters, isFree, setCameraMode, setCameraTarget],
  );

  const returnToAuto = useCallback(() => {
    setCameraMode("follow");
    setCameraTarget(null);
  }, [setCameraMode, setCameraTarget]);

  useEffect(() => {
    if (!isRacing) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const num = Number(e.key);
      if (num >= 1 && num <= 8) {
        e.preventDefault();
        focusCharacter(num - 1);
        return;
      }
      if (e.key === "0" || e.key === "Escape") {
        e.preventDefault();
        returnToAuto();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRacing, focusCharacter, returnToAuto]);

  if (!isRacing) return null;

  const activeCharIndex = cameraTarget ? characters.findIndex((c) => c.id === cameraTarget) : -1;

  return (
    <div className="pointer-events-auto absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-xl bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
      {/* auto follow */}
      <button
        type="button"
        onClick={isFree ? returnToAuto : toggleMode}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.65rem] font-semibold transition active:scale-95 ${
          !isFree ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10 hover:text-white/80"
        }`}
        aria-label="자동 추적"
        title="자동 추적 (0)"
      >
        <span className="text-xs">🎥</span>
        <span className="hidden sm:inline">자동</span>
      </button>

      <span className="h-4 w-px bg-white/20" />

      {/* character buttons */}
      {characters.map((char, idx) => {
        const isActive = idx === activeCharIndex;
        return (
          <button
            key={char.id}
            type="button"
            onClick={() => focusCharacter(idx)}
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.55rem] font-bold text-white transition-all hover:scale-110 active:scale-95 ${
              isActive
                ? "border-white shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                : "border-white/20 hover:border-white/50"
            }`}
            style={{ backgroundColor: char.color.jacket }}
            aria-label={`${char.name} 카메라 포커스 (${idx + 1})`}
            title={`${char.name} (${idx + 1})`}
          >
            {idx + 1}
          </button>
        );
      })}

      {/* free mode hint */}
      {isFree ? (
        <>
          <span className="h-4 w-px bg-white/20" />
          <span className="text-[0.5rem] text-white/40">드래그=회전 · 스크롤=줌</span>
        </>
      ) : null}
    </div>
  );
}
