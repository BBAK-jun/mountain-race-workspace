import { useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useNavigate } from "@tanstack/react-router";
import { CameraSystem } from "@/features/mountain-race/systems";
import {
  CharacterMesh,
  Environment,
  SpeechBubble,
  Track,
} from "@/features/mountain-race/components";
import { useGameStore } from "@/features/mountain-race/store";

function RaceTickDriver() {
  const tick = useGameStore((state) => state.tick);

  useFrame((_, delta) => {
    tick(delta);
  });

  return null;
}

export function RaceScreen() {
  const navigate = useNavigate();
  const characters = useGameStore((state) => state.characters);
  const finishedIds = useGameStore((state) => state.finishedIds);
  const activeBubble = useGameStore((state) => state.activeBubble);
  const activeGlobalEvent = useGameStore((state) => state.activeGlobalEvent);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const cameraTarget = useGameStore((state) => state.cameraTarget);
  const rankings = useGameStore((state) => state.rankings);
  const isRacing = useGameStore((state) => state.isRacing);
  const hasResult = useGameStore((state) => state.hasResult);
  const startRace = useGameStore((state) => state.startRace);

  useEffect(() => {
    if (!isRacing && !hasResult) {
      startRace();
    }
  }, [hasResult, isRacing, startRace]);

  useEffect(() => {
    if (hasResult) {
      void navigate({ to: "/result" });
    }
  }, [hasResult, navigate]);

  const bubbleProgress = useMemo(() => {
    if (!activeBubble) {
      return null;
    }

    const speaker = characters.find((character) => character.id === activeBubble.characterId);
    return speaker?.progress ?? null;
  }, [activeBubble, characters]);

  return (
    <section className="h-full w-full">
      <Canvas camera={{ position: [0, 10, 20], fov: 45 }} shadows>
        <color attach="background" args={["#cfe7ff"]} />
        <Environment activeGlobalEvent={activeGlobalEvent} />
        <Track />
        {characters.map((character) => (
          <CharacterMesh
            key={character.id}
            character={character}
            isFinished={finishedIds.includes(character.id)}
          />
        ))}
        <SpeechBubble activeBubble={activeBubble} characterProgress={bubbleProgress} />
        <CameraSystem
          cameraMode={cameraMode}
          cameraTarget={cameraTarget}
          characters={characters}
          rankings={rankings}
        />
        <RaceTickDriver />
      </Canvas>
    </section>
  );
}
