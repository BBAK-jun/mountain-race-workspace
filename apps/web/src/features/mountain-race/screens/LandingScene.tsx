import { useFrame } from "@react-three/fiber";
import { Environment } from "@/features/mountain-race/components/Environment";
import { Track } from "@/features/mountain-race/components/Track";

function LandingCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.05;
    const radius = 35;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius - 40;
    camera.position.y = 20;
    camera.lookAt(0, 10, -40);
  });
  return null;
}

export function LandingScene() {
  return (
    <>
      <Environment activeGlobalEvent={null} />
      <Track />
      <LandingCamera />
    </>
  );
}
