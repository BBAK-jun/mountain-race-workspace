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
  }, [focusCharacter, returnToAuto]);

  if (!isRacing) return null;

  const activeCharIndex = cameraTarget ? characters.findIndex((c) => c.id === cameraTarget) : -1;

  return (
    <div className="pointer-events-auto absolute bottom-14 left-3 z-30 flex flex-col gap-2 md:bottom-4">
      {/* mode toggle */}
      <button
        type="button"
        onClick={toggleMode}
        className="flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
        aria-label={isFree ? "자동 추적 모드로 전환" : "자유 시점 모드로 전환"}
      >
        <span className="text-sm">{isFree ? "🎥" : "🕹️"}</span>
        <span>{isFree ? "자동 추적" : "자유 시점"}</span>
        <kbd className="ml-1 rounded bg-white/15 px-1 py-0.5 text-[0.6rem] text-white/50">
          {isFree ? "0" : ""}
        </kbd>
      </button>

      {/* character selector */}
      <div className="flex gap-1 rounded-lg bg-black/50 px-2 py-1.5 backdrop-blur-sm">
        {characters.map((char, idx) => {
          const isActive = idx === activeCharIndex;
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => focusCharacter(idx)}
              className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                isActive
                  ? "border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  : "border-transparent hover:border-white/40"
              }`}
              style={{ backgroundColor: char.color.jacket }}
              aria-label={`${char.name} 카메라 포커스 (${idx + 1})`}
              title={`${char.name} (${idx + 1})`}
            >
              <span className="text-[0.5rem] font-bold text-white drop-shadow-sm">{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* hint */}
      {isFree ? (
        <p className="max-w-[200px] text-[0.55rem] leading-tight text-white/40">
          드래그=회전 · 우클릭/2핑거=이동 · 스크롤=줌 · 1~8=캐릭터 · 0/Esc=자동
        </p>
      ) : null}
    </div>
  );
}
