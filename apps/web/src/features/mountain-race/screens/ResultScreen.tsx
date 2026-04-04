import { useNavigate } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { resetRouteGuardSnapshot } from "@/features/mountain-race/app";
import { FINISH_LINE } from "@/features/mountain-race/constants/balance";
import { useGameStore } from "@/features/mountain-race/store/useGameStore";
import type { Character, GameEvent } from "@/features/mountain-race/types";
import { ResultScene } from "./ResultScene";

const RANK_MEDALS = ["🥇", "🥈", "🥉"] as const;
const PODIUM_BORDERS = [
  "border-yellow-400/50",
  "border-zinc-300/50",
  "border-amber-600/50",
] as const;
const FACE_FALLBACK = ["🧗", "🥾", "🏔️", "🚩", "🌤️", "🎒", "🧢", "🌲"] as const;

function getFaceFallback(index: number) {
  return FACE_FALLBACK[index % FACE_FALLBACK.length] ?? "🙂";
}

function isDataImage(source: string | null) {
  return Boolean(source?.startsWith("data:image/"));
}

function getMvpMostHit(characters: Character[]) {
  let best: Character | null = null;
  for (const c of characters) {
    if (!best || c.stats.hitCount > best.stats.hitCount) best = c;
  }
  return best && best.stats.hitCount > 0 ? best : null;
}

function getMvpLastUltimate(characters: Character[], events: GameEvent[]) {
  const lastUltimate = [...events].reverse().find((e) => e.category === "ultimate");
  if (!lastUltimate?.casterId) return null;
  return characters.find((c) => c.id === lastUltimate.casterId) ?? null;
}

function getMvpBiggestComeback(characters: Character[]) {
  let best: Character | null = null;
  for (const c of characters) {
    if (!best || c.stats.rankChanges > best.stats.rankChanges) best = c;
  }
  return best && best.stats.rankChanges > 0 ? best : null;
}

export function ResultScreen() {
  const navigate = useNavigate();

  const characters = useGameStore((s) => s.characters);
  const rankings = useGameStore((s) => s.rankings);
  const events = useGameStore((s) => s.events);
  const resetGame = useGameStore((s) => s.resetGame);

  const rankedCharacters = useMemo(() => {
    const charMap = new Map(characters.map((c) => [c.id, c]));
    return rankings.reduce<Character[]>((acc, id) => {
      const c = charMap.get(id);
      if (c) acc.push(c);
      return acc;
    }, []);
  }, [characters, rankings]);

  const charIndexMap = useMemo(() => new Map(characters.map((c, i) => [c.id, i])), [characters]);

  const podium = rankedCharacters.slice(0, 3);
  const rest = rankedCharacters.slice(3);

  const mvpMostHit = useMemo(() => getMvpMostHit(characters), [characters]);
  const mvpLastUltimate = useMemo(
    () => getMvpLastUltimate(characters, events),
    [characters, events],
  );
  const mvpComeback = useMemo(() => getMvpBiggestComeback(characters), [characters]);

  const mvpCards = useMemo(() => {
    const cards: { emoji: string; title: string; character: Character; desc: string }[] = [];
    if (mvpMostHit) {
      cards.push({
        emoji: "😱",
        title: "최다 피격상",
        character: mvpMostHit,
        desc: `${mvpMostHit.stats.hitCount}회 피격`,
      });
    }
    if (mvpLastUltimate) {
      cards.push({
        emoji: "💥",
        title: "판 뒤집기상",
        character: mvpLastUltimate,
        desc: "마지막 피살기 시전",
      });
    }
    if (mvpComeback) {
      cards.push({
        emoji: "🔄",
        title: "대역전상",
        character: mvpComeback,
        desc: `${mvpComeback.stats.rankChanges}회 순위 변동`,
      });
    }
    return cards;
  }, [mvpMostHit, mvpLastUltimate, mvpComeback]);

  const handleGoSetup = () => {
    resetGame();
    resetRouteGuardSnapshot();
    void navigate({ to: "/setup" });
  };

  const handleGoLobby = () => {
    resetGame();
    resetRouteGuardSnapshot();
    void navigate({ to: "/" });
  };

  return (
    <main style={{ position: "relative", height: "100dvh", overflow: "hidden", padding: 0 }}>
      <Canvas
        camera={{ position: [0, 18, -5], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ position: "absolute", inset: 0 }}
      >
        <ResultScene />
      </Canvas>

      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background: [
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)",
            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 60%)",
            "linear-gradient(to bottom, rgba(10,30,50,0.3) 0%, transparent 25%)",
          ].join(", "),
        }}
      />

      <style>{`
        @keyframes mr-result-reveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mr-result-stagger {
          animation: mr-result-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 pt-[8vh] pb-8 md:px-6 md:pt-[10vh] md:pb-12">
          {/* header */}
          <header
            className="mr-result-stagger mb-6 flex flex-col items-center text-center"
            style={{ animationDelay: "0ms" }}
          >
            <span
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.16em] text-white/90 uppercase backdrop-blur-md md:text-xs"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
              레이스 결과
            </span>

            <h1
              className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)" }}
            >
              🏆 경기 종료!
            </h1>
          </header>

          {/* podium — top 3 */}
          {podium.length > 0 ? (
            <div
              className="mr-result-stagger mb-4 grid gap-2.5"
              style={{
                animationDelay: "150ms",
                gridTemplateColumns:
                  podium.length >= 3
                    ? "repeat(3, 1fr)"
                    : podium.length === 2
                      ? "repeat(2, 1fr)"
                      : "1fr",
              }}
            >
              {podium.map((character, rank) => {
                const originalIdx = charIndexMap.get(character.id) ?? 0;
                return (
                  <div
                    key={character.id}
                    className={`overflow-hidden rounded-2xl border-2 ${PODIUM_BORDERS[rank]} bg-black/30 p-4 text-center shadow-lg backdrop-blur-md`}
                  >
                    <div className="text-3xl md:text-4xl">{RANK_MEDALS[rank]}</div>
                    <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white/10 text-2xl md:h-16 md:w-16">
                      {isDataImage(character.faceImage) ? (
                        <img
                          src={character.faceImage ?? ""}
                          alt={character.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{getFaceFallback(originalIdx)}</span>
                      )}
                    </div>
                    <p
                      className="mt-2 truncate text-sm font-bold text-white md:text-base"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                    >
                      {character.name}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-white/60">
                      {(Math.min(character.progress / FINISH_LINE, 1) * 100).toFixed(1)}% 완주
                    </p>
                    <div className="mt-2 flex justify-center gap-3 text-[0.6rem] text-white/50">
                      <span>피격 {character.stats.hitCount}</span>
                      <span>역전 {character.stats.rankChanges}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* rest of rankings */}
          {rest.length > 0 ? (
            <div className="mr-result-stagger mb-4" style={{ animationDelay: "300ms" }}>
              <div className="overflow-hidden rounded-xl border border-white/15 bg-black/25 backdrop-blur-md">
                {rest.map((character, idx) => {
                  const globalRank = idx + 4;
                  return (
                    <div
                      key={character.id}
                      className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5 last:border-b-0"
                    >
                      <span className="w-6 text-center text-xs font-bold text-white/50">
                        {globalRank}
                      </span>
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: character.color.jacket }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white/80">
                        {character.name}
                      </span>
                      <span className="text-xs tabular-nums text-white/40">
                        {(Math.min(character.progress / FINISH_LINE, 1) * 100).toFixed(1)}%
                      </span>
                      <span className="text-[0.6rem] text-white/30">
                        피격 {character.stats.hitCount} · 역전 {character.stats.rankChanges}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* MVP awards */}
          {mvpCards.length > 0 ? (
            <div className="mr-result-stagger mb-6" style={{ animationDelay: "450ms" }}>
              <p
                className="mb-2 text-center text-xs font-semibold tracking-wide text-white/50 uppercase"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                MVP Awards
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {mvpCards.map((card) => (
                  <div
                    key={card.title}
                    className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/25 px-3.5 py-3 backdrop-blur-md"
                    style={{ borderLeftWidth: "3px", borderLeftColor: card.character.color.jacket }}
                  >
                    <span className="text-2xl">{card.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-semibold text-white/50">{card.title}</p>
                      <p className="truncate text-sm font-bold text-white/90">
                        {card.character.name}
                      </p>
                      <p className="text-[0.65rem] text-white/40">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* action buttons */}
          <div
            className="mr-result-stagger flex items-center justify-center gap-3"
            style={{ animationDelay: "600ms" }}
          >
            <button
              type="button"
              onClick={handleGoLobby}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.97]"
            >
              ← 로비로
            </button>
            <button
              type="button"
              onClick={handleGoSetup}
              className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-white px-7 text-sm font-bold text-zinc-900 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <span className="relative z-10">🔄 다시 하기</span>
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-100 via-white to-sky-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
