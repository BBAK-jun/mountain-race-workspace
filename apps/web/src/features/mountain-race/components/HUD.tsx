import { useMemo } from "react";
import { useGameStore } from "../store/useGameStore";
import { FINISH_LINE, RACE_END_GRACE_PERIOD_MS } from "../constants/balance";
import type { CharacterStatus } from "../types";

const STATUS_INDICATORS: Partial<Record<CharacterStatus, string>> = {
  stunned: "😵",
  boosted: "🚀",
  slowed: "🐌",
  sliding: "🧊",
};

const MARKER_INSET_PX = 10;
const SUMMIT_LABEL_RESERVED_PX = 56;

export function HUD() {
  const characters = useGameStore((s) => s.characters);
  const rankings = useGameStore((s) => s.rankings);
  const finishedIds = useGameStore((s) => s.finishedIds);
  const activeGlobalEvent = useGameStore((s) => s.activeGlobalEvent);
  const firstFinishTime = useGameStore((s) => s.firstFinishTime);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const isRacing = useGameStore((s) => s.isRacing);

  const isFogActive = activeGlobalEvent === "fog";

  const characterMap = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);

  const finishedSet = useMemo(() => new Set(finishedIds), [finishedIds]);
  const isAllFinished = finishedIds.length >= characters.length && characters.length > 0;

  const raceEndCountdownSec = useMemo(() => {
    if (!isRacing || isAllFinished || firstFinishTime === null) return null;
    const elapsedSinceFirstFinishMs = (elapsedTime - firstFinishTime) * 1000;
    const remainingMs = Math.max(0, RACE_END_GRACE_PERIOD_MS - elapsedSinceFirstFinishMs);
    return Math.ceil(remainingMs / 1000);
  }, [elapsedTime, firstFinishTime, isAllFinished, isRacing]);

  return (
    <>
      {raceEndCountdownSec !== null && (
        <div className="absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-black/60 px-4 py-2 text-center text-white backdrop-blur-sm">
          <div className="text-xs font-semibold text-amber-300">선두 골인</div>
          <div className="text-sm font-bold">레이스 종료까지 {raceEndCountdownSec}초</div>
        </div>
      )}

      {/* ── Ranking list — top right ─────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-20 flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
        {rankings.map((id, index) => {
          const char = characterMap.get(id);
          if (!char) return null;

          const isFinished = finishedSet.has(id);
          const isNameVisible = !isFogActive || index === 0 || isFinished;
          const statusIcon = STATUS_INDICATORS[char.status];

          return (
            <div
              key={id}
              className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
            >
              <span className="w-5 shrink-0 text-center font-bold text-amber-400">{index + 1}</span>
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-white/40"
                style={{ backgroundColor: char.color.jacket }}
              />
              <span className="min-w-0 max-w-28 truncate md:max-w-40">
                {isFinished ? "✅ " : ""}
                {isNameVisible ? char.name : "???"}
              </span>
              {statusIcon && <span className="shrink-0 text-xs">{statusIcon}</span>}
            </div>
          );
        })}
      </div>

      {/* ── Progress bar — bottom ────────────────────────────────────── */}
      <div className="absolute right-4 bottom-14 left-4 z-20 md:bottom-4">
        <div className="relative h-7 rounded-full bg-black/40 backdrop-blur-sm">
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/80 select-none">
            🏔️ 정상
          </span>

          {characters.map((char) => {
            const ratio = Math.min(char.progress / FINISH_LINE, 1);
            return (
              <div
                key={char.id}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-150 ease-out"
                style={{
                  left: `clamp(${MARKER_INSET_PX}px, ${ratio * 100}%, calc(100% - ${SUMMIT_LABEL_RESERVED_PX}px))`,
                }}
                title={char.name}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 border-white/70 shadow-sm ${
                    finishedSet.has(char.id) ? "ring-2 ring-amber-400" : ""
                  }`}
                  style={{ backgroundColor: char.color.jacket }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
