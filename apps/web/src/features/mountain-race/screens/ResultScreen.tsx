import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { resetRouteGuardSnapshot } from "@/features/mountain-race/app";
import { useGameStore } from "@/features/mountain-race/store/useGameStore";
import type { Character, GameEvent } from "@/features/mountain-race/types";

const RANK_MEDALS = ["🥇", "🥈", "🥉"] as const;

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

  const mvpMostHit = useMemo(() => getMvpMostHit(characters), [characters]);
  const mvpLastUltimate = useMemo(
    () => getMvpLastUltimate(characters, events),
    [characters, events],
  );
  const hasMvpData = mvpMostHit || mvpLastUltimate;

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
    <main className="route-shell mx-auto w-full max-w-5xl py-6 md:py-10">
      <section className="rounded-3xl border border-white/50 bg-white/85 p-5 shadow-xl backdrop-blur md:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-blue-600 uppercase">Result</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 md:text-4xl">
          레이스 결과
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-zinc-200 bg-white/90 p-4">
            <h2 className="text-sm font-bold text-zinc-900">최종 순위</h2>
            {rankedCharacters.length > 0 ? (
              <ol className="mt-3 space-y-2">
                {rankedCharacters.map((character, index) => (
                  <li
                    key={character.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2"
                  >
                    <span className="w-7 text-center text-lg">
                      {index < RANK_MEDALS.length ? RANK_MEDALS[index] : `${index + 1}`}
                    </span>
                    <span
                      aria-hidden
                      className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: character.color.jacket }}
                    />
                    <span className="flex-1 truncate text-sm font-semibold text-zinc-800">
                      {character.name}
                    </span>
                    <span className="text-xs tabular-nums text-zinc-500">
                      {(character.progress * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">순위 데이터가 없습니다.</p>
            )}
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white/90 p-4">
            <h2 className="text-sm font-bold text-zinc-900">MVP</h2>
            {hasMvpData ? (
              <div className="mt-3 space-y-3">
                {mvpMostHit ? (
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2">
                    <p className="text-xs font-semibold text-zinc-500">😱 최다 피격상</p>
                    <p className="mt-1 text-sm font-bold text-zinc-800">{mvpMostHit.name}</p>
                    <p className="text-xs text-zinc-500">{mvpMostHit.stats.hitCount}회 피격</p>
                  </div>
                ) : null}
                {mvpLastUltimate ? (
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2">
                    <p className="text-xs font-semibold text-zinc-500">💥 판 뒤집기상</p>
                    <p className="mt-1 text-sm font-bold text-zinc-800">{mvpLastUltimate.name}</p>
                    <p className="text-xs text-zinc-500">마지막 피살기 시전</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">MVP 데이터가 없습니다.</p>
            )}
          </article>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleGoLobby}>
            로비로
          </Button>
          <Button type="button" onClick={handleGoSetup}>
            다시 하기
          </Button>
        </div>
      </section>
    </main>
  );
}
