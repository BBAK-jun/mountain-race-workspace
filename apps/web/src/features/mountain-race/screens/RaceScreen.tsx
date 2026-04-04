import { Canvas } from "@react-three/fiber";
import { useGameStore } from "@/features/mountain-race/store";
import { Track } from "@/features/mountain-race/components/Track";
import { Character } from "@/features/mountain-race/components/Character";
import { Environment } from "@/features/mountain-race/components/Environment";
import { SpeechBubble } from "@/features/mountain-race/components/SpeechBubble";
import { CameraSystem } from "@/features/mountain-race/systems";

function SceneContent() {
  const characters = useGameStore((s) => s.characters);
  const rankings = useGameStore((s) => s.rankings);
  const finishedIds = useGameStore((s) => s.finishedIds);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const activeGlobalEvent = useGameStore((s) => s.activeGlobalEvent);
  const activeBubble = useGameStore((s) => s.activeBubble);

  const bubbleCharProgress = activeBubble
    ? (characters.find((c) => c.id === activeBubble.characterId)?.progress ?? null)
    : null;

  return (
    <>
      <Track />
      <Environment activeGlobalEvent={activeGlobalEvent} />
      {characters.map((char) => (
        <Character key={char.id} character={char} isFinished={finishedIds.includes(char.id)} />
      ))}
      <SpeechBubble activeBubble={activeBubble} characterProgress={bubbleCharProgress} />
      <CameraSystem
        cameraMode={cameraMode}
        cameraTarget={cameraTarget}
        characters={characters}
        rankings={rankings}
      />
    </>
  );
}

export function RaceScreen() {
  return (
    <main
      className="route-shell"
      style={{
        position: "relative",
        height: "100vh",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 10, 20], fov: 60 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <SceneContent />
      </Canvas>
    </main>
  );
}
