import { useEffect } from "react";
import { InGameOverlaySlot, RaceSceneSlot } from "@/features/mountain-race/components";
import { useGameStore } from "@/features/mountain-race/store";

export function RaceRouteComposition() {
  const startRace = useGameStore((s) => s.startRace);
  const tick = useGameStore((s) => s.tick);

  useEffect(() => {
    startRace();

    let rafId = 0;
    let prevTime = performance.now();

    const loop = (now: number) => {
      const deltaTime = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;

      tick(deltaTime);

      if (!useGameStore.getState().hasResult) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [startRace, tick]);

  return (
    <main className="relative h-dvh w-full overflow-hidden p-0">
      <RaceSceneSlot />
      <InGameOverlaySlot />
    </main>
  );
}
