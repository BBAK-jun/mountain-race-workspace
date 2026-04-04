import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useGameStore } from "@/features/mountain-race/store";

export function ResultScreen() {
  const characters = useGameStore((state) => state.characters);
  const rankings = useGameStore((state) => state.rankings);
  const elapsedTime = useGameStore((state) => state.elapsedTime);
  const resetGame = useGameStore((state) => state.resetGame);

  const rankedCharacters = useMemo(
    () =>
      rankings
        .map((characterId) => characters.find((character) => character.id === characterId))
        .filter((character): character is NonNullable<typeof character> => Boolean(character)),
    [characters, rankings],
  );

  return (
    <main className="route-shell route-view">
      <h1>Result</h1>
      <p>최종 순위와 완주 결과입니다.</p>
      <ol className="grid gap-2 sm:max-w-md">
        {rankedCharacters.map((character, index) => (
          <li
            key={character.id}
            className="rounded-xl border border-zinc-200 bg-white/80 px-3 py-2"
          >
            <strong>{index + 1}위</strong> - {character.name} (
            {Math.round(character.progress * 100)}%)
          </li>
        ))}
      </ol>
      <p>총 경기 시간: {elapsedTime.toFixed(1)}s</p>
      <p>
        Return to{" "}
        <Link
          to="/"
          onClick={() => {
            resetGame();
          }}
        >
          landing
        </Link>
        .
      </p>
    </main>
  );
}
