import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";

export function CameraControls() {
  const characters = useGameStore((s) => s.characters);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setCameraTarget = useGameStore((s) => s.setCameraTarget);
  const isRacing = useGameStore((s) => s.isRacing);
  const [guideVisible, setGuideVisible] = useState(true);

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

  useEffect(() => {
    if (!isRacing) return;
    const timer = setTimeout(() => setGuideVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [isRacing]);

  if (!isRacing) return null;

  const activeCharIndex = cameraTarget ? characters.findIndex((c) => c.id === cameraTarget) : -1;

  return (
    <div className="pointer-events-auto absolute top-3 left-3 z-30 flex flex-col items-start gap-2">
      {/* control bar */}
      <div className="flex items-center gap-1.5 rounded-xl bg-black/55 px-3 py-2 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={isFree ? returnToAuto : toggleMode}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
            !isFree ? "bg-white/25 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          aria-label="자동 추적"
          title="자동 추적 (0 또는 Esc)"
        >
          🎥 자동
        </button>

        <span className="h-5 w-px bg-white/25" />

        {characters.map((char, idx) => {
          const isActive = idx === activeCharIndex;
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => focusCharacter(idx)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold text-white transition-all hover:scale-110 active:scale-95 ${
                isActive
                  ? "border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  : "border-white/25 hover:border-white/60"
              }`}
              style={{ backgroundColor: char.color.jacket }}
              aria-label={`${char.name} 카메라 포커스 (${idx + 1})`}
              title={`${char.name} (${idx + 1})`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* guide overlay / toggle — centered under control bar */}
      {guideVisible ? (
        <div className="relative self-center rounded-xl bg-black/60 px-4 py-3 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setGuideVisible(false)}
            className="absolute top-1.5 right-2 text-sm text-white/40 hover:text-white/80"
            aria-label="가이드 닫기"
          >
            ✕
          </button>
          <p className="mb-2 text-xs font-bold text-white/90">📷 카메라 조작법</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[0.7rem] leading-relaxed text-white/70">
            <span>
              <kbd className="rounded bg-white/15 px-1 py-0.5 text-[0.6rem] font-semibold text-white/90">
                1
              </kbd>
              ~
              <kbd className="rounded bg-white/15 px-1 py-0.5 text-[0.6rem] font-semibold text-white/90">
                8
              </kbd>{" "}
              캐릭터 포커스
            </span>
            <span>
              <kbd className="rounded bg-white/15 px-1 py-0.5 text-[0.6rem] font-semibold text-white/90">
                0
              </kbd>{" "}
              /{" "}
              <kbd className="rounded bg-white/15 px-1 py-0.5 text-[0.6rem] font-semibold text-white/90">
                Esc
              </kbd>{" "}
              자동 시점 복귀
            </span>
            <span>🖱️ 드래그 → 회전</span>
            <span>🖱️ 우클릭 드래그 → 이동</span>
            <span>🖱️ 스크롤 → 줌 인/아웃</span>
            <span>📱 핀치 → 줌 / 2핑거 → 이동</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setGuideVisible(true)}
          className="rounded-lg bg-black/40 px-2.5 py-1 text-[0.65rem] text-white/40 backdrop-blur-sm transition hover:bg-black/60 hover:text-white/70"
        >
          📷 조작법 보기
        </button>
      )}
    </div>
  );
}
