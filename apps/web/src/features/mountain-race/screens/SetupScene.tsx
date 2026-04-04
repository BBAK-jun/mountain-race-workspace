import { useFrame } from "@react-three/fiber";
import { Environment } from "@/features/mountain-race/components/Environment";
import { Track } from "@/features/mountain-race/components/Track";

function SetupCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.03;
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
