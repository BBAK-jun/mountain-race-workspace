import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";

const RAIN_CONFIG = {
  maxDropCount: 360,
  minDropCount: 90,
  rangeX: 34,
  rangeZ: 170,
  minY: 6,
  maxY: 64,
  windBase: 2.3,
  windGain: 2.4,
} as const;

interface RainDrop {
  x: number;
  y: number;
  z: number;
}

interface RainFieldProps {
  intensity: number;
  speed: number;
}

export function RainField({ intensity, speed }: RainFieldProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const activeDropCount = Math.max(
    RAIN_CONFIG.minDropCount,
    Math.floor(RAIN_CONFIG.maxDropCount * Math.min(1, intensity)),
  );
  const dropsRef = useRef<RainDrop[]>([]);
  const dummyRef = useRef(new Object3D());

  if (dropsRef.current.length === 0) {
    dropsRef.current = Array.from({ length: RAIN_CONFIG.maxDropCount }, (_, i) => ({
      x: (Math.sin(i * 17.17) * 0.5 + 0.5) * RAIN_CONFIG.rangeX - RAIN_CONFIG.rangeX / 2,
      y:
        RAIN_CONFIG.minY +
        (Math.cos(i * 23.41) * 0.5 + 0.5) * (RAIN_CONFIG.maxY - RAIN_CONFIG.minY),
      z: -((Math.sin(i * 7.23) * 0.5 + 0.5) * RAIN_CONFIG.rangeZ),
    }));
  }

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const dummy = dummyRef.current;
    const drops = dropsRef.current;
    if (!mesh) return;

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      if (!drop) continue;

      if (i >= activeDropCount) {
        dummy.position.set(0, -1000, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      drop.y -= delta * speed;
      drop.x -= delta * (RAIN_CONFIG.windBase + intensity * RAIN_CONFIG.windGain);

      if (drop.y < RAIN_CONFIG.minY) {
        drop.y = RAIN_CONFIG.maxY;
      }
      if (drop.x < -RAIN_CONFIG.rangeX / 2) {
        drop.x = RAIN_CONFIG.rangeX / 2;
      }

      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.rotation.set(0.3, 0, 0.1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RAIN_CONFIG.maxDropCount]}>
      <boxGeometry args={[0.028, 0.82, 0.028]} />
      <meshStandardMaterial
        color="#b7d5ff"
        transparent
        opacity={Math.min(0.78, 0.35 + intensity * 0.48)}
      />
    </instancedMesh>
  );
}
