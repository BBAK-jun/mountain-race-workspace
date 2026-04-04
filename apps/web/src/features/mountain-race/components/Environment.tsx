import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import type { GlobalEventType } from "@/features/mountain-race/types";

interface EnvironmentProps {
  activeGlobalEvent: GlobalEventType | null;
  leaderProgress?: number;
}

export function Environment({ activeGlobalEvent, leaderProgress = 0 }: EnvironmentProps) {
  const isRainByAltitude = leaderProgress >= WEATHER_CONFIG.altitudeRainStart;
  const isRainByEvent = activeGlobalEvent === "rain";
  const isRainy = isRainByAltitude || isRainByEvent;
  const isFoggy = activeGlobalEvent === "fog";
  const isStormy = activeGlobalEvent === "lightning";
  const altitudeRainBoost =
    leaderProgress >= WEATHER_CONFIG.altitudeHeavyRain
      ? WEATHER_CONFIG.altitudeBoostHigh
      : leaderProgress >= WEATHER_CONFIG.altitudeMidRain
        ? WEATHER_CONFIG.altitudeBoostMid
        : WEATHER_CONFIG.altitudeBoostLow;
  const rainIntensity = isRainy
    ? (isRainByEvent ? WEATHER_CONFIG.eventRainBase : WEATHER_CONFIG.altitudeRainBase) +
      altitudeRainBoost
    : 0;
  const rainSpeed = WEATHER_CONFIG.rainSpeedBase + rainIntensity * WEATHER_CONFIG.rainSpeedGain;
  const fogArgs = isFoggy
    ? WEATHER_CONFIG.fogDense
    : isRainy
      ? WEATHER_CONFIG.fogRain
      : WEATHER_CONFIG.fogClear;

  return (
    <group>
      <Ground />
      <Mountains />
      <Trees />
      <Clouds />
      {isRainy && <RainField intensity={rainIntensity} speed={rainSpeed} />}
      <fog attach="fog" args={fogArgs} />
      <ambientLight
        intensity={isStormy ? WEATHER_CONFIG.stormAmbient : WEATHER_CONFIG.defaultAmbient}
      />
      <directionalLight
        position={WEATHER_CONFIG.sunPosition}
        intensity={isRainy ? WEATHER_CONFIG.rainSunIntensity : WEATHER_CONFIG.clearSunIntensity}
        color={isRainy ? WEATHER_CONFIG.rainSunColor : WEATHER_CONFIG.clearSunColor}
      />
    </group>
  );
}

const WEATHER_CONFIG = {
  altitudeRainStart: 0.58,
  altitudeMidRain: 0.66,
  altitudeHeavyRain: 0.8,
  altitudeBoostLow: 0.08,
  altitudeBoostMid: 0.18,
  altitudeBoostHigh: 0.3,
  altitudeRainBase: 0.48,
  eventRainBase: 0.62,
  rainSpeedBase: 20,
  rainSpeedGain: 18,
  fogDense: ["#bcc8d7", 8, 54] as const,
  fogRain: ["#b3becb", 24, 112] as const,
  fogClear: ["#dfe6ee", 48, 210] as const,
  stormAmbient: 0.28,
  defaultAmbient: 0.42,
  sunPosition: [20, 50, 30] as const,
  rainSunIntensity: 0.82,
  clearSunIntensity: 1.05,
  rainSunColor: "#d7e2f0",
  clearSunColor: "#fff7dd",
} as const;

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

function Trees() {
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyLowerRef = useRef<InstancedMesh>(null);
  const canopyUpperRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const trunk = trunkRef.current;
    const lower = canopyLowerRef.current;
    const upper = canopyUpperRef.current;
    const dummy = dummyRef.current;
    if (!trunk || !lower || !upper) return;

    for (let i = 0; i < TREE_DATA.length; i++) {
      const tree = TREE_DATA[i];
      if (!tree) continue;
      const [x, y, z] = tree.pos;
      const s = tree.scale;

      dummy.rotation.set(0, 0, 0);

      dummy.position.set(x, y + 0.6 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 1.6 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      lower.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 2.2 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      upper.setMatrixAt(i, dummy.matrix);
    }

    trunk.instanceMatrix.needsUpdate = true;
    lower.instanceMatrix.needsUpdate = true;
    upper.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, TREE_DATA.length]}>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 5]} />
        <meshStandardMaterial color="#6b4226" />
      </instancedMesh>
      <instancedMesh ref={canopyLowerRef} args={[undefined, undefined, TREE_DATA.length]}>
        <coneGeometry args={[0.6, 1.4, 6]} />
        <meshStandardMaterial color="#2d6a4f" />
      </instancedMesh>
      <instancedMesh ref={canopyUpperRef} args={[undefined, undefined, TREE_DATA.length]}>
        <coneGeometry args={[0.45, 1.0, 6]} />
        <meshStandardMaterial color="#40916c" />
      </instancedMesh>
    </group>
  );
}

const TREE_CONFIG = {
  seed: 20260404,
  zJitter: 0.9,
  xJitter: 1.7,
  yJitter: 1.2,
  altitudeGrow: 2.6,
  scaleVariance: 0.24,
  zones: [
    { count: 42, zStart: -8, zEnd: -56, minOffset: 9, maxOffset: 17, yBase: -0.5, scaleBase: 0.95 },
    {
      count: 28,
      zStart: -58,
      zEnd: -104,
      minOffset: 10,
      maxOffset: 18,
      yBase: 4.5,
      scaleBase: 0.84,
    },
    {
      count: 18,
      zStart: -106,
      zEnd: -152,
      minOffset: 11,
      maxOffset: 21,
      yBase: 10.5,
      scaleBase: 0.72,
    },
  ] as const,
} as const;

const TREE_DATA = buildTreeData();

function buildTreeData(): { id: string; pos: [number, number, number]; scale: number }[] {
  const trees: { id: string; pos: [number, number, number]; scale: number }[] = [];
  const rng = mulberry32(TREE_CONFIG.seed);
  let treeIndex = 0;

  for (const zone of TREE_CONFIG.zones) {
    for (let i = 0; i < zone.count; i++) {
      const lane = i % 2 === 0 ? 1 : -1;
      const t = zone.count <= 1 ? 0 : i / (zone.count - 1);
      const z = zone.zStart + (zone.zEnd - zone.zStart) * t + jitter(rng, TREE_CONFIG.zJitter);
      const offset = zone.minOffset + rng() * (zone.maxOffset - zone.minOffset);
      const x = lane * (offset + jitter(rng, TREE_CONFIG.xJitter));
      const y = zone.yBase + jitter(rng, TREE_CONFIG.yJitter) + t * TREE_CONFIG.altitudeGrow;
      const scale = zone.scaleBase + rng() * TREE_CONFIG.scaleVariance;
      trees.push({ id: `tr-${treeIndex}`, pos: [x, y, z], scale });
      treeIndex += 1;
    }
  }

  return trees;
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

type RainDrop = { x: number; y: number; z: number };

function RainField({ intensity, speed }: { intensity: number; speed: number }) {
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

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function jitter(rng: () => number, amount: number): number {
  return (rng() * 2 - 1) * amount;
}
