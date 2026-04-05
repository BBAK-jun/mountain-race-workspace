import { useRef, type ElementRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { useGameStore } from "@/features/mountain-race/store";
import { Track } from "@/features/mountain-race/components/Track";
import { Character } from "@/features/mountain-race/components/Character";
import { Environment } from "@/features/mountain-race/components/Environment";
import { SpeechBubble } from "@/features/mountain-race/components/SpeechBubble";
import { CameraSystem, getTargetTrackPosition } from "@/features/mountain-race/systems";

const _focusPos = new Vector3();

function FreeOrbitControls() {
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);
  const prevTargetRef = useRef<string | null | undefined>(undefined);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const { cameraTarget, characters, rankings, finishedIds } = useGameStore.getState();

    const ok = getTargetTrackPosition(characters, rankings, cameraTarget, _focusPos, finishedIds);
    if (!ok) return;

    const isFirstFrame = prevTargetRef.current === undefined;
    const targetChanged = cameraTarget !== prevTargetRef.current;
    prevTargetRef.current = cameraTarget;

    if (isFirstFrame || targetChanged) {
      controls.target.copy(_focusPos);
    } else if (cameraTarget) {
      controls.target.lerp(_focusPos, 0.05);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.12}
      minDistance={5}
      maxDistance={80}
      maxPolarAngle={Math.PI * 0.85}
      enablePan
      panSpeed={0.8}
      rotateSpeed={0.6}
      zoomSpeed={1.0}
      makeDefault
    />
  );
}

function SceneContent() {
  const characters = useGameStore((s) => s.characters);
  const rankings = useGameStore((s) => s.rankings);
  const finishedIds = useGameStore((s) => s.finishedIds);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const activeGlobalEvent = useGameStore((s) => s.activeGlobalEvent);
  const leaderId = rankings[0];
  const leaderProgress = leaderId ? (characters.find((c) => c.id === leaderId)?.progress ?? 0) : 0;

  return (
    <>
      <Track />
      <Environment activeGlobalEvent={activeGlobalEvent} leaderProgress={leaderProgress} />
      {characters.map((char, i) => (
        <Character
          key={char.id}
          character={char}
          isFinished={finishedIds.includes(char.id)}
          index={i}
        />
      ))}
      <SpeechBubble />
      <CameraSystem
        cameraMode={cameraMode}
        cameraTarget={cameraTarget}
        characters={characters}
        rankings={rankings}
        finishedIds={finishedIds}
      />
      {cameraMode === "free" ? <FreeOrbitControls /> : null}
    </>
  );
}

export function RaceScreen() {
  return (
    <main
      className="route-shell"
      style={{
        position: "relative",
        height: "100dvh",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 10, 20], fov: 60 }}
        style={{ position: "absolute", inset: 0, background: "#c5ddf0" }}
      >
        <SceneContent />
      </Canvas>
    </main>
  );
}
