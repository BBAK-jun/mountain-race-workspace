import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import type { GlobalEventType } from "@/features/mountain-race/types";

interface EnvironmentProps {
  activeGlobalEvent: GlobalEventType | null;
  leaderProgress?: number;
}

export function Environment({ activeGlobalEvent, leaderProgress = 0 }: EnvironmentProps) {
  const isRainByAltitude = leaderProgress >= 0.58;
  const isRainByEvent = activeGlobalEvent === "rain";
  const isRainy = isRainByAltitude || isRainByEvent;
  const isFoggy = activeGlobalEvent === "fog";
  const isStormy = activeGlobalEvent === "lightning";
  const altitudeRainBoost = leaderProgress >= 0.8 ? 0.3 : leaderProgress >= 0.66 ? 0.18 : 0.08;
  const rainIntensity = isRainy ? (isRainByEvent ? 0.62 : 0.48) + altitudeRainBoost : 0;
  const rainSpeed = 20 + rainIntensity * 18;
  const fogArgs = isFoggy
    ? (["#bcc8d7", 8, 54] as const)
    : isRainy
      ? (["#b3becb", 24, 112] as const)
      : (["#dfe6ee", 48, 210] as const);

  return (
    <group>
      <Ground />
      <Mountains />
      <Trees />
      <Clouds />
      {isRainy && <RainField intensity={rainIntensity} speed={rainSpeed} />}
      <fog attach="fog" args={fogArgs} />
      <ambientLight intensity={isStormy ? 0.28 : 0.42} />
      <directionalLight
        position={[20, 50, 30]}
        intensity={isRainy ? 0.82 : 1.05}
        color={isRainy ? "#d7e2f0" : "#fff7dd"}
      />
    </group>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -72]}>
        <planeGeometry args={[320, 340]} />
        <meshStandardMaterial color="#3d5e46" roughness={1} />
      </mesh>
      <mesh position={[58, -7.5, -92]} scale={[42, 10, 62]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#4f6055" roughness={0.98} />
      </mesh>
      <mesh position={[-60, -8, -104]} scale={[46, 12, 68]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#4e6258" roughness={0.98} />
      </mesh>
      <mesh position={[0, -10.5, -142]} scale={[58, 15, 52]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#53675f" roughness={0.98} />
      </mesh>
    </group>
  );
}

const MOUNTAIN_DATA = [
  { id: "mt-a", pos: [30, 8, -40] as const, scale: [12, 18, 12] as const, color: "#6b7b8d" },
  { id: "mt-b", pos: [-25, 6, -30] as const, scale: [10, 14, 10] as const, color: "#7a8a9a" },
  { id: "mt-c", pos: [15, 10, -90] as const, scale: [15, 22, 15] as const, color: "#5c6c7c" },
  { id: "mt-d", pos: [-35, 12, -100] as const, scale: [18, 26, 18] as const, color: "#6b7b8d" },
  { id: "mt-e", pos: [40, 14, -120] as const, scale: [20, 30, 20] as const, color: "#5c6c7c" },
  { id: "mt-f", pos: [-20, 9, -70] as const, scale: [14, 20, 14] as const, color: "#7a8a9a" },
  { id: "mt-g", pos: [5, 16, -150] as const, scale: [22, 34, 22] as const, color: "#4e5e6e" },
  { id: "mt-h", pos: [-40, 11, -140] as const, scale: [16, 24, 16] as const, color: "#6b7b8d" },
];

function Mountains() {
  return (
    <group>
      {MOUNTAIN_DATA.map((m) => (
        <mesh
          key={m.id}
          position={[m.pos[0], m.pos[1], m.pos[2]]}
          scale={[m.scale[0], m.scale[1], m.scale[2]]}
        >
          <coneGeometry args={[1, 1, 6]} />
          <meshStandardMaterial color={m.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

const TREE_DATA = buildTreeData();

function buildTreeData(): { id: string; pos: [number, number, number]; scale: number }[] {
  const trees: { id: string; pos: [number, number, number]; scale: number }[] = [];
  const zones = [
    { name: "low", count: 42, zStart: -8, zEnd: -56, minOffset: 9, maxOffset: 17, yBase: -0.5 },
    { name: "mid", count: 28, zStart: -58, zEnd: -104, minOffset: 10, maxOffset: 18, yBase: 4.5 },
    { name: "peak", count: 18, zStart: -106, zEnd: -152, minOffset: 11, maxOffset: 21, yBase: 10.5 },
  ] as const;
  let treeIndex = 0;

  for (const zone of zones) {
    for (let i = 0; i < zone.count; i++) {
      const lane = i % 2 === 0 ? 1 : -1;
      const t = zone.count <= 1 ? 0 : i / (zone.count - 1);
      const z = zone.zStart + (zone.zEnd - zone.zStart) * t + Math.sin((treeIndex + 1) * 1.12) * 0.9;
      const spreadSeed = (Math.sin((treeIndex + 1) * 2.17) * 0.5 + 0.5);
      const offset = zone.minOffset + spreadSeed * (zone.maxOffset - zone.minOffset);
      const x = lane * (offset + Math.cos((treeIndex + 3) * 0.91) * 1.7);
      const y = zone.yBase + Math.sin((treeIndex + 2) * 0.58) * 1.2 + t * 2.6;
      const scaleBase = zone.name === "low" ? 1.02 : zone.name === "mid" ? 0.9 : 0.76;
      const scale = scaleBase + ((treeIndex % 4) * 0.07);
      trees.push({ id: `tr-${treeIndex}`, pos: [x, y, z], scale });
      treeIndex += 1;
    }
  }

  return trees;
}

function Trees() {
  return (
    <group>
      {TREE_DATA.map((t) => (
        <group key={t.id} position={[t.pos[0], t.pos[1], t.pos[2]]} scale={t.scale}>
          {/* trunk */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1.2, 5]} />
            <meshStandardMaterial color="#6b4226" />
          </mesh>
          {/* canopy */}
          <mesh position={[0, 1.6, 0]}>
            <coneGeometry args={[0.6, 1.4, 6]} />
            <meshStandardMaterial color="#2d6a4f" />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <coneGeometry args={[0.45, 1.0, 6]} />
            <meshStandardMaterial color="#40916c" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const CLOUD_DATA = [
  { id: "cl-a", pos: [16, 28, -24] as const, scale: 1.2 },
  { id: "cl-b", pos: [-22, 34, -42] as const, scale: 1.1 },
  { id: "cl-c", pos: [24, 31, -64] as const, scale: 1.25 },
  { id: "cl-d", pos: [-16, 38, -84] as const, scale: 1.35 },
  { id: "cl-e", pos: [10, 36, -102] as const, scale: 1.15 },
  { id: "cl-f", pos: [-8, 43, -118] as const, scale: 1.5 },
  { id: "cl-g", pos: [18, 39, -136] as const, scale: 1.4 },
  { id: "cl-h", pos: [-24, 45, -152] as const, scale: 1.55 },
];

function Clouds() {
  return (
    <group>
      {CLOUD_DATA.map((c) => (
        <group key={c.id} position={[c.pos[0], c.pos[1], c.pos[2]]} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[2, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
          <mesh position={[1.8, -0.3, 0]}>
            <sphereGeometry args={[1.5, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <mesh position={[-1.5, -0.2, 0.5]}>
            <sphereGeometry args={[1.8, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const RAIN_DROP_COUNT_MAX = 360;
const RAIN_RANGE_X = 34;
const RAIN_RANGE_Z = 170;
const RAIN_MIN_Y = 6;
const RAIN_MAX_Y = 64;
const _instanceDummy = new Object3D();

function RainField({ intensity, speed }: { intensity: number; speed: number }) {
  const meshRef = useRef<InstancedMesh>(null);
  const activeDropCount = Math.max(90, Math.floor(RAIN_DROP_COUNT_MAX * Math.min(1, intensity)));
  const drops = useMemo(
    () =>
      Array.from({ length: RAIN_DROP_COUNT_MAX }, (_, i) => ({
        x: (Math.sin(i * 17.17) * 0.5 + 0.5) * RAIN_RANGE_X - RAIN_RANGE_X / 2,
        y: RAIN_MIN_Y + ((Math.cos(i * 23.41) * 0.5 + 0.5) * (RAIN_MAX_Y - RAIN_MIN_Y)),
        z: -((Math.sin(i * 7.23) * 0.5 + 0.5) * RAIN_RANGE_Z),
      })),
    [],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      if (!drop) continue;

      if (i >= activeDropCount) {
        _instanceDummy.position.set(0, -1000, 0);
        _instanceDummy.updateMatrix();
        mesh.setMatrixAt(i, _instanceDummy.matrix);
        continue;
      }

      drop.y -= delta * speed;
      drop.x -= delta * (2.3 + intensity * 2.4);

      if (drop.y < RAIN_MIN_Y) {
        drop.y = RAIN_MAX_Y;
      }
      if (drop.x < -RAIN_RANGE_X / 2) {
        drop.x = RAIN_RANGE_X / 2;
      }

      _instanceDummy.position.set(drop.x, drop.y, drop.z);
      _instanceDummy.rotation.set(0.3, 0, 0.1);
      _instanceDummy.updateMatrix();
      mesh.setMatrixAt(i, _instanceDummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RAIN_DROP_COUNT_MAX]}>
      <boxGeometry args={[0.028, 0.82, 0.028]} />
      <meshStandardMaterial
        color="#b7d5ff"
        transparent
        opacity={Math.min(0.78, 0.35 + intensity * 0.48)}
      />
    </instancedMesh>
  );
}
