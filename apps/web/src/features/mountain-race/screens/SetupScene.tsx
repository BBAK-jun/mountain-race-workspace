import { useFrame } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Environment } from "@/features/mountain-race/components/Environment";
import { Track } from "@/features/mountain-race/components/Track";

function SetupCamera() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useFrame(({ camera, clock }) => {
    const speed = reduced ? 0 : 0.03;
    const t = clock.elapsedTime * speed;
    const radius = 30;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius - 35;
    camera.position.y = 25;
    camera.lookAt(0, 8, -35);
  });

  return null;
}

export function SetupScene() {
  return (
    <>
      <Environment activeGlobalEvent={null} />
      <Track />
      <SetupCamera />
    </>
  );
}
