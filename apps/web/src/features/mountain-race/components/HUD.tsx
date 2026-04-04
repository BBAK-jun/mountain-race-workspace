import { useMemo } from "react";
import { useGameStore } from "@/features/mountain-race/store";

function formatPercent(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

export function HUD() {
  const characters = useGameStore((state) => state.characters);
  const rankings = useGameStore((state) => state.rankings);
  const elapsedTime = useGameStore((state) => state.elapsedTime);
  const finishedIds = useGameStore((state) => state.finishedIds);

  const rankedCharacters = useMemo(
    () =>
      rankings
        .map((characterId) => characters.find((character) => character.id === characterId))
        .filter((character): character is NonNullable<typeof character> => Boolean(character)),
    [characters, rankings],
  );

  return (
    <section className="rounded-2xl border border-white/60 bg-white/85 p-3 shadow-md backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">Live HUD</p>
        <p className="text-xs text-zinc-600">경과 {elapsedTime.toFixed(1)}s</p>
      </div>
      <ol className="mt-2 space-y-1">
        {rankedCharacters.map((character, index) => (
          <li
            key={character.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/80 bg-white/90 px-2 py-1 text-sm"
          >
            <span className="font-semibold text-zinc-800">
              {index + 1}. {character.name}
            </span>
            <span className="text-zinc-600">
              {formatPercent(character.progress)}
              {finishedIds.includes(character.id) ? " / 완주" : ""}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
