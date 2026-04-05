import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import {
  Color,
  Float32BufferAttribute,
  Object3D,
  PlaneGeometry,
  Vector3,
  type InstancedMesh,
} from "three";
import type { GlobalEventType } from "@/features/mountain-race/types";
import { trackCurve } from "@/features/mountain-race/components/Track";

// ---------------------------------------------------------------------------
// Deterministic RNG helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Terrain height — consistent between visual mesh and object placement
// ---------------------------------------------------------------------------

const TRACK_Z_START = 6;
const TRACK_Z_END = -142;
const TRACK_Z_RANGE = TRACK_Z_START - TRACK_Z_END;

const TERRAIN = {
  groundOffset: 2.0,
  trackDipWidth: 7,
  trackDipRate: 0.45,
  sideFalloffStart: 3,
  sideFalloffRate: 0.12,
  farFalloffStart: 30,
  farFalloffRate: 0.08,
} as const;

const _terrainSample = new Vector3();

function estimateTerrainY(z: number, xDist: number): number {
  const t = Math.max(0, Math.min(1, (TRACK_Z_START - z) / TRACK_Z_RANGE));
  trackCurve.getPointAt(t, _terrainSample);
  const trackY = _terrainSample.y;
  const trackDip = Math.max(0, TERRAIN.trackDipWidth - xDist) * TERRAIN.trackDipRate;
  const sideSlope = Math.max(0, xDist - TERRAIN.sideFalloffStart) * TERRAIN.sideFalloffRate;
  const farSlope = Math.max(0, xDist - TERRAIN.farFalloffStart) * TERRAIN.farFalloffRate;
  return trackY - TERRAIN.groundOffset - trackDip - sideSlope - farSlope;
}

// ---------------------------------------------------------------------------
// Environment — main exported component
// ---------------------------------------------------------------------------

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

  const skyTurbidity = isFoggy ? 8 : isRainy ? 5 : 3;
  const skyRayleigh = isFoggy ? 0.2 : isRainy ? 0.35 : 0.5;

  return (
    <group>
      <Sky
        sunPosition={[
          WEATHER_CONFIG.sunPosition[0],
          WEATHER_CONFIG.sunPosition[1],
          WEATHER_CONFIG.sunPosition[2],
        ]}
        turbidity={skyTurbidity}
        rayleigh={skyRayleigh}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <Ground />
      <Mountains />
      <Trees />
      <Boulders />
      <GrassTufts />
      <TrailMarkers />
      <SnowPatches />
      <Clouds />
      {isRainy && <RainField intensity={rainIntensity} speed={rainSpeed} />}
      <fog attach="fog" args={fogArgs} />
      <hemisphereLight args={["#87ceeb", "#4a7c59", 0.5]} />
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
  fogDense: ["#d0dce8", 10, 60] as const,
  fogRain: ["#c5d4e2", 28, 120] as const,
  fogClear: ["#e8f0f8", 55, 240] as const,
  stormAmbient: 0.4,
  defaultAmbient: 0.65,
  sunPosition: [20, 50, 30] as const,
  rainSunIntensity: 0.95,
  clearSunIntensity: 1.4,
  rainSunColor: "#dce8f4",
  clearSunColor: "#fffbe8",
} as const;

// ---------------------------------------------------------------------------
// Ground — sloped terrain mesh that follows track elevation
// ---------------------------------------------------------------------------

const GROUND_MESH = {
  width: 300,
  depth: 320,
  segmentsX: 60,
  segmentsZ: 80,
  centerZ: -68,
} as const;

function Ground() {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(
      GROUND_MESH.width,
      GROUND_MESH.depth,
      GROUND_MESH.segmentsX,
      GROUND_MESH.segmentsZ,
    );
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, GROUND_MESH.centerZ);

    const posAttr = geo.getAttribute("position");
    if (!posAttr) return geo;

    const vertexColors = new Float32Array(posAttr.count * 3);
    const lowColor = new Color("#4a7c52");
    const midColor = new Color("#7a9468");
    const highColor = new Color("#9aa898");
    const color = new Color();

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const baseY = estimateTerrainY(z, Math.abs(x));
      const microNoise = Math.sin(x * 0.8 + z * 0.6) * 0.15 + Math.sin(x * 1.3 - z * 0.9) * 0.1;
      const y = baseY + microNoise;
      posAttr.setY(i, y);

      const alt = Math.max(0, Math.min(1, y / 25));
      const colorNoise = (Math.sin(x * 0.25 + z * 0.15) * 0.5 + 0.5) * 0.1;
      const adjustedAlt = Math.max(0, Math.min(1, alt + colorNoise));

      if (adjustedAlt < 0.5) {
        color.copy(lowColor).lerp(midColor, adjustedAlt * 2);
      } else {
        color.copy(midColor).lerp(highColor, (adjustedAlt - 0.5) * 2);
      }

      vertexColors[i * 3] = color.r;
      vertexColors[i * 3 + 1] = color.g;
      vertexColors[i * 3 + 2] = color.b;
    }

    posAttr.needsUpdate = true;
    geo.setAttribute("color", new Float32BufferAttribute(vertexColors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Mountains — cones with foothills and snow caps
// ---------------------------------------------------------------------------

interface MountainEntry {
  id: string;
  pos: readonly [number, number, number];
  scale: readonly [number, number, number];
  color: string;
  hasSnow: boolean;
}

const MOUNTAIN_DATA: MountainEntry[] = [
  { id: "mt-a", pos: [30, 8, -40], scale: [12, 18, 12], color: "#8ea4b8", hasSnow: false },
  { id: "mt-b", pos: [-25, 6, -30], scale: [10, 14, 10], color: "#9bb2c4", hasSnow: false },
  { id: "mt-c", pos: [15, 10, -90], scale: [15, 22, 15], color: "#8498af", hasSnow: true },
  { id: "mt-d", pos: [-35, 12, -100], scale: [18, 26, 18], color: "#93a8be", hasSnow: true },
  { id: "mt-e", pos: [40, 14, -120], scale: [20, 30, 20], color: "#8898b0", hasSnow: true },
  { id: "mt-f", pos: [-20, 9, -70], scale: [14, 20, 14], color: "#a0b4c6", hasSnow: false },
  { id: "mt-g", pos: [5, 16, -150], scale: [22, 34, 22], color: "#7a94aa", hasSnow: true },
  { id: "mt-h", pos: [-40, 11, -140], scale: [16, 24, 16], color: "#8da2b8", hasSnow: true },
];

const SECONDARY_PEAKS = [
  { id: "sp-a", pos: [36, 5, -38] as const, scale: [7, 11, 7] as const, color: "#96aec2" },
  { id: "sp-b", pos: [24, 6, -44] as const, scale: [8, 13, 8] as const, color: "#8ca0b4" },
  { id: "sp-c", pos: [-30, 4, -28] as const, scale: [6, 9, 6] as const, color: "#a3b8ca" },
  { id: "sp-d", pos: [22, 8, -86] as const, scale: [9, 15, 9] as const, color: "#8fa6b8" },
  { id: "sp-e", pos: [-42, 10, -105] as const, scale: [11, 18, 11] as const, color: "#8b9fB4" },
  { id: "sp-f", pos: [46, 11, -115] as const, scale: [12, 20, 12] as const, color: "#8494a8" },
  { id: "sp-g", pos: [-14, 14, -145] as const, scale: [14, 22, 14] as const, color: "#7e92a8" },
  { id: "sp-h", pos: [20, 13, -155] as const, scale: [10, 16, 10] as const, color: "#8da4b8" },
  { id: "sp-i", pos: [-50, 8, -70] as const, scale: [10, 14, 10] as const, color: "#94acc0" },
  { id: "sp-j", pos: [50, 6, -55] as const, scale: [8, 12, 8] as const, color: "#9cb4c8" },
];

const SNOW_CAP_RATIO = 0.3;
const SNOW_JITTERS = MOUNTAIN_DATA.map((_, i) => 0.88 + Math.sin(i * 7.3 + 2.1) * 0.12);
const MOUNTAIN_SEGMENTS = 10;
const SECONDARY_SEGMENTS = 8;
const FOOTHILL_HEIGHT_RATIO = 0.18;
const FOOTHILL_WIDTH_RATIO = 1.6;

function foothillColor(baseColor: string): string {
  const c = new Color(baseColor);
  c.lerp(new Color("#5a7a5a"), 0.35);
  return `#${c.getHexString()}`;
}

function Mountains() {
  return (
    <group>
      {MOUNTAIN_DATA.map((m, mi) => {
        const snowJitter = SNOW_JITTERS[mi] ?? 1;
        const snowRatio = SNOW_CAP_RATIO * snowJitter;
        return (
          <group key={m.id} position={[m.pos[0], m.pos[1], m.pos[2]]}>
            <mesh
              position={[0, -m.scale[1] * 0.38, 0]}
              scale={[
                m.scale[0] * FOOTHILL_WIDTH_RATIO,
                m.scale[1] * FOOTHILL_HEIGHT_RATIO,
                m.scale[2] * FOOTHILL_WIDTH_RATIO,
              ]}
            >
              <coneGeometry args={[1, 1, MOUNTAIN_SEGMENTS]} />
              <meshStandardMaterial color={foothillColor(m.color)} roughness={0.92} />
            </mesh>

            <mesh scale={[m.scale[0], m.scale[1], m.scale[2]]}>
              <coneGeometry args={[1, 1, MOUNTAIN_SEGMENTS]} />
              <meshStandardMaterial color={m.color} roughness={0.85} />
            </mesh>

            {m.hasSnow && (
              <mesh
                position={[0, m.scale[1] * (0.5 - snowRatio * 0.25), 0]}
                scale={[m.scale[0] * snowRatio, m.scale[1] * snowRatio, m.scale[2] * snowRatio]}
              >
                <coneGeometry args={[1, 1, MOUNTAIN_SEGMENTS]} />
                <meshStandardMaterial color="#f0f5fa" roughness={0.55} />
              </mesh>
            )}
          </group>
        );
      })}

      {SECONDARY_PEAKS.map((sp) => (
        <group key={sp.id}>
          <mesh
            position={[sp.pos[0], sp.pos[1] - sp.scale[1] * 0.35, sp.pos[2]]}
            scale={[sp.scale[0] * 1.4, sp.scale[1] * 0.15, sp.scale[2] * 1.4]}
          >
            <coneGeometry args={[1, 1, SECONDARY_SEGMENTS]} />
            <meshStandardMaterial color={foothillColor(sp.color)} roughness={0.9} />
          </mesh>
          <mesh
            position={[sp.pos[0], sp.pos[1], sp.pos[2]]}
            scale={[sp.scale[0], sp.scale[1], sp.scale[2]]}
          >
            <coneGeometry args={[1, 1, SECONDARY_SEGMENTS]} />
            <meshStandardMaterial color={sp.color} roughness={0.88} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Trees — multi-layer instanced pines with color variation
// ---------------------------------------------------------------------------

const TREE_CONFIG = {
  seed: 20260404,
  zJitter: 0.9,
  xJitter: 1.7,
  yJitter: 0.3,
  scaleVariance: 0.24,
  colorSeed: 20260405,
  zones: [
    { count: 42, zStart: -8, zEnd: -56, minOffset: 9, maxOffset: 17, scaleBase: 0.95 },
    { count: 28, zStart: -58, zEnd: -104, minOffset: 10, maxOffset: 18, scaleBase: 0.84 },
    { count: 18, zStart: -106, zEnd: -152, minOffset: 11, maxOffset: 21, scaleBase: 0.72 },
  ] as const,
} as const;

const TREE_DATA = buildTreeData();

function buildTreeData(): {
  id: string;
  pos: [number, number, number];
  scale: number;
}[] {
  const trees: { id: string; pos: [number, number, number]; scale: number }[] = [];
  const rng = mulberry32(TREE_CONFIG.seed);
  let idx = 0;

  for (const zone of TREE_CONFIG.zones) {
    for (let i = 0; i < zone.count; i++) {
      const lane = i % 2 === 0 ? 1 : -1;
      const t = zone.count <= 1 ? 0 : i / (zone.count - 1);
      const z = zone.zStart + (zone.zEnd - zone.zStart) * t + jitter(rng, TREE_CONFIG.zJitter);
      const offset = zone.minOffset + rng() * (zone.maxOffset - zone.minOffset);
      const x = lane * (offset + jitter(rng, TREE_CONFIG.xJitter));
      const y = estimateTerrainY(z, Math.abs(x)) + jitter(rng, TREE_CONFIG.yJitter);
      const scale = zone.scaleBase + rng() * TREE_CONFIG.scaleVariance;
      trees.push({ id: `tr-${idx}`, pos: [x, y, z], scale });
      idx += 1;
    }
  }

  return trees;
}

function Trees() {
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyBottomRef = useRef<InstancedMesh>(null);
  const canopyMidRef = useRef<InstancedMesh>(null);
  const canopyTopRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const trunk = trunkRef.current;
    const bottom = canopyBottomRef.current;
    const mid = canopyMidRef.current;
    const top = canopyTopRef.current;
    const dummy = dummyRef.current;
    if (!trunk || !bottom || !mid || !top) return;

    const rng = mulberry32(TREE_CONFIG.colorSeed);
    const color = new Color();

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

      color.setHSL(0.07 + rng() * 0.04, 0.35 + rng() * 0.15, 0.28 + rng() * 0.1);
      trunk.setColorAt(i, color);

      dummy.position.set(x, y + 1.3 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      bottom.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 1.9 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mid.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 2.4 * s, z);
      dummy.scale.set(s * 0.85, s * 0.85, s * 0.85);
      dummy.updateMatrix();
      top.setMatrixAt(i, dummy.matrix);

      const hue = 0.28 + rng() * 0.08;
      const sat = 0.4 + rng() * 0.2;
      const lightBase = 0.3 + rng() * 0.12;

      color.setHSL(hue, sat, lightBase);
      bottom.setColorAt(i, color);

      color.setHSL(hue + 0.02, sat, lightBase + 0.05);
      mid.setColorAt(i, color);

      color.setHSL(hue + 0.03, sat - 0.05, lightBase + 0.08);
      top.setColorAt(i, color);
    }

    trunk.instanceMatrix.needsUpdate = true;
    bottom.instanceMatrix.needsUpdate = true;
    mid.instanceMatrix.needsUpdate = true;
    top.instanceMatrix.needsUpdate = true;
    if (trunk.instanceColor) trunk.instanceColor.needsUpdate = true;
    if (bottom.instanceColor) bottom.instanceColor.needsUpdate = true;
    if (mid.instanceColor) mid.instanceColor.needsUpdate = true;
    if (top.instanceColor) top.instanceColor.needsUpdate = true;
  }, []);

  const count = TREE_DATA.length;

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.07, 0.14, 1.2, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={canopyBottomRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.7, 1.2, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={canopyMidRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.55, 1.1, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={canopyTopRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.4, 0.9, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Boulders — scattered rock clusters with pebbles
// ---------------------------------------------------------------------------

interface BoulderEntry {
  id: string;
  pos: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

const BOULDER_DATA: BoulderEntry[] = (() => {
  const rng = mulberry32(77701);
  const out: BoulderEntry[] = [];
  const zones: {
    zStart: number;
    zEnd: number;
    count: number;
    spread: number;
  }[] = [
    { zStart: -5, zEnd: -50, count: 14, spread: 16 },
    { zStart: -52, zEnd: -100, count: 12, spread: 18 },
    { zStart: -102, zEnd: -150, count: 10, spread: 20 },
  ];
  let idx = 0;
  for (const zone of zones) {
    for (let i = 0; i < zone.count; i++) {
      const t = zone.count <= 1 ? 0.5 : i / (zone.count - 1);
      const side = i % 2 === 0 ? 1 : -1;
      const zp = zone.zStart + (zone.zEnd - zone.zStart) * t + jitter(rng, 2);
      const xp = side * (zone.spread * 0.5 + rng() * zone.spread * 0.5);
      const yp = estimateTerrainY(zp, Math.abs(xp)) + jitter(rng, 0.3);
      const s = 0.4 + rng() * 0.8;
      out.push({
        id: `bl-${idx}`,
        pos: [xp, yp, zp],
        scale: [s * (0.8 + rng() * 0.4), s * (0.6 + rng() * 0.5), s * (0.8 + rng() * 0.4)],
        rotation: [rng() * 0.4, rng() * Math.PI, rng() * 0.3],
      });
      idx++;
    }
  }
  return out;
})();

interface PebbleEntry {
  pos: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}

const PEBBLE_DATA: PebbleEntry[] = (() => {
  const rng = mulberry32(77702);
  const out: PebbleEntry[] = [];
  for (const boulder of BOULDER_DATA) {
    const pebbleCount = 2 + Math.floor(rng() * 3);
    for (let j = 0; j < pebbleCount; j++) {
      const angle = rng() * Math.PI * 2;
      const dist = 0.5 + rng() * 1.5;
      const px = boulder.pos[0] + Math.cos(angle) * dist;
      const pz = boulder.pos[2] + Math.sin(angle) * dist;
      const py = estimateTerrainY(pz, Math.abs(px)) + 0.05;
      const ps = 0.08 + rng() * 0.18;
      out.push({
        pos: [px, py, pz],
        scale: ps,
        rotation: [rng() * 0.5, rng() * Math.PI, rng() * 0.5],
      });
    }
  }
  return out;
})();

const BOULDER_COLOR_SEED = 77703;
const BOULDER_DETAIL = 1;

function Boulders() {
  const meshRef = useRef<InstancedMesh>(null);
  const pebbleRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const pebbleMesh = pebbleRef.current;
    const dummy = dummyRef.current;
    if (!mesh) return;

    const rng = mulberry32(BOULDER_COLOR_SEED);
    const color = new Color();

    for (let i = 0; i < BOULDER_DATA.length; i++) {
      const b = BOULDER_DATA[i];
      if (!b) continue;
      dummy.position.set(b.pos[0], b.pos[1], b.pos[2]);
      dummy.rotation.set(b.rotation[0], b.rotation[1], b.rotation[2]);
      dummy.scale.set(b.scale[0], b.scale[1], b.scale[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const hue = 0.06 + rng() * 0.08;
      const sat = 0.05 + rng() * 0.12;
      const light = 0.32 + rng() * 0.15;
      color.setHSL(hue, sat, light);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (!pebbleMesh) return;
    for (let i = 0; i < PEBBLE_DATA.length; i++) {
      const p = PEBBLE_DATA[i];
      if (!p) continue;
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      pebbleMesh.setMatrixAt(i, dummy.matrix);

      color.setHSL(0.07 + rng() * 0.06, 0.06 + rng() * 0.1, 0.35 + rng() * 0.15);
      pebbleMesh.setColorAt(i, color);
    }

    pebbleMesh.instanceMatrix.needsUpdate = true;
    if (pebbleMesh.instanceColor) pebbleMesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, BOULDER_DATA.length]}>
        <dodecahedronGeometry args={[1, BOULDER_DETAIL]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={pebbleRef} args={[undefined, undefined, PEBBLE_DATA.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Grass tufts — dual-layer blade clusters along the trail
// ---------------------------------------------------------------------------

interface GrassTuft {
  pos: [number, number, number];
  scale: number;
  rotation: number;
}

const GRASS_COUNT = 180;

const GRASS_DATA: GrassTuft[] = (() => {
  const rng = mulberry32(33302);
  const out: GrassTuft[] = [];
  for (let i = 0; i < GRASS_COUNT; i++) {
    const t = i / (GRASS_COUNT - 1);
    const z = 4 - t * 148 + jitter(rng, 1.2);
    const side = i % 2 === 0 ? 1 : -1;
    const xOffset = 2.5 + rng() * 5;
    const x = side * xOffset + jitter(rng, 1.0);
    const y = estimateTerrainY(z, Math.abs(x)) + 0.1;
    const scale = 0.15 + rng() * 0.2;
    out.push({
      pos: [x, y, z],
      scale,
      rotation: rng() * Math.PI * 2,
    });
  }
  return out;
})();

const GRASS_COLOR_SEED = 33303;

function GrassTufts() {
  const primaryRef = useRef<InstancedMesh>(null);
  const secondaryRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const primary = primaryRef.current;
    const secondary = secondaryRef.current;
    const dummy = dummyRef.current;
    if (!primary || !secondary) return;

    const rng = mulberry32(GRASS_COLOR_SEED);
    const color = new Color();

    for (let i = 0; i < GRASS_DATA.length; i++) {
      const g = GRASS_DATA[i];
      if (!g) continue;

      dummy.position.set(g.pos[0], g.pos[1], g.pos[2]);
      dummy.rotation.set(0, g.rotation, 0.1);
      dummy.scale.set(g.scale, g.scale * 2, g.scale);
      dummy.updateMatrix();
      primary.setMatrixAt(i, dummy.matrix);

      dummy.position.set(g.pos[0] + 0.05, g.pos[1], g.pos[2] + 0.05);
      dummy.rotation.set(0, g.rotation + Math.PI / 3, -0.08);
      dummy.scale.set(g.scale * 0.8, g.scale * 1.6, g.scale * 0.8);
      dummy.updateMatrix();
      secondary.setMatrixAt(i, dummy.matrix);

      const alt = Math.max(0, Math.min(1, g.pos[1] / 24));
      const hue = 0.28 - alt * 0.12;
      const sat = 0.5 - alt * 0.15;
      const light = 0.32 + rng() * 0.1;

      color.setHSL(hue, sat, light);
      primary.setColorAt(i, color);

      color.setHSL(hue + 0.02, sat - 0.05, light + 0.03);
      secondary.setColorAt(i, color);
    }

    primary.instanceMatrix.needsUpdate = true;
    secondary.instanceMatrix.needsUpdate = true;
    if (primary.instanceColor) primary.instanceColor.needsUpdate = true;
    if (secondary.instanceColor) secondary.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={primaryRef} args={[undefined, undefined, GRASS_COUNT]}>
        <coneGeometry args={[0.3, 1.2, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={secondaryRef} args={[undefined, undefined, GRASS_COUNT]}>
        <coneGeometry args={[0.22, 0.85, 3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Trail markers — wooden posts with colored signals along the path
// ---------------------------------------------------------------------------

const MARKER_CONFIGS = [
  { x: 2.8, z: -2 },
  { x: -3.2, z: -20 },
  { x: 4, z: -36 },
  { x: -3.5, z: -54 },
  { x: 3.8, z: -72 },
  { x: -3, z: -92 },
  { x: 2.5, z: -115 },
  { x: 1, z: -135 },
] as const;

const MARKER_POSITIONS: [number, number, number][] = MARKER_CONFIGS.map((m) => [
  m.x,
  estimateTerrainY(m.z, Math.abs(m.x)) + 0.1,
  m.z,
]);

function TrailMarkers() {
  return (
    <group>
      {MARKER_CONFIGS.map((cfg, i) => {
        const markerPos = MARKER_POSITIONS[i];
        if (!markerPos) return null;
        return (
          <group key={`mk-${cfg.x}-${cfg.z}`} position={markerPos}>
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 1.2, 5]} />
              <meshStandardMaterial color="#9e7e56" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <boxGeometry args={[0.18, 0.12, 0.06]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? "#e74c3c" : i % 3 === 1 ? "#f39c12" : "#2ecc71"}
                emissive={i % 3 === 0 ? "#e74c3c" : i % 3 === 1 ? "#f39c12" : "#2ecc71"}
                emissiveIntensity={0.15}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Snow patches — flat white discs at higher altitudes
// ---------------------------------------------------------------------------

interface SnowPatch {
  pos: [number, number, number];
  scale: [number, number, number];
  rotation: number;
}

const SNOW_PATCH_DATA: SnowPatch[] = (() => {
  const rng = mulberry32(55501);
  const out: SnowPatch[] = [];
  const HIGH_ALT_Z_START = -90;
  const PATCH_COUNT = 18;
  for (let i = 0; i < PATCH_COUNT; i++) {
    const t = i / (PATCH_COUNT - 1);
    const z = HIGH_ALT_Z_START - t * 60 + jitter(rng, 3);
    const side = i % 2 === 0 ? 1 : -1;
    const xOffset = 5 + rng() * 14;
    const x = side * xOffset + jitter(rng, 2);
    const y = estimateTerrainY(z, Math.abs(x)) + 0.15;
    const s = 1.2 + rng() * 2.5;
    out.push({
      pos: [x, y, z],
      scale: [s, 0.08, s * (0.6 + rng() * 0.6)],
      rotation: rng() * Math.PI,
    });
  }
  return out;
})();

function SnowPatches() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const dummy = dummyRef.current;
    if (!mesh) return;
    for (let i = 0; i < SNOW_PATCH_DATA.length; i++) {
      const p = SNOW_PATCH_DATA[i];
      if (!p) continue;
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.set(-Math.PI / 2, 0, p.rotation);
      dummy.scale.set(p.scale[0], p.scale[1], p.scale[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SNOW_PATCH_DATA.length]}>
      <circleGeometry args={[1, 8]} />
      <meshStandardMaterial color="#eef4f9" roughness={0.7} transparent opacity={0.85} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// Clouds — multi-sphere clusters
// ---------------------------------------------------------------------------

const CLOUD_DATA = [
  { id: "cl-a", pos: [16, 28, -24] as const, scale: 1.2 },
  { id: "cl-b", pos: [-22, 34, -42] as const, scale: 1.1 },
  { id: "cl-c", pos: [24, 31, -64] as const, scale: 1.25 },
  { id: "cl-d", pos: [-16, 38, -84] as const, scale: 1.35 },
  { id: "cl-e", pos: [10, 36, -102] as const, scale: 1.15 },
  { id: "cl-f", pos: [-8, 43, -118] as const, scale: 1.5 },
  { id: "cl-g", pos: [18, 39, -136] as const, scale: 1.4 },
  { id: "cl-h", pos: [-24, 45, -152] as const, scale: 1.55 },
  { id: "cl-i", pos: [32, 33, -48] as const, scale: 1.0 },
  { id: "cl-j", pos: [-30, 41, -130] as const, scale: 1.3 },
];

const CLOUD_SPHERE_SEGMENTS = 10;

function Clouds() {
  return (
    <group>
      {CLOUD_DATA.map((c) => (
        <group key={c.id} position={[c.pos[0], c.pos[1], c.pos[2]]} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[2, CLOUD_SPHERE_SEGMENTS, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
          <mesh position={[1.8, -0.3, 0.4]}>
            <sphereGeometry args={[1.5, CLOUD_SPHERE_SEGMENTS, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.75} />
          </mesh>
          <mesh position={[-1.5, -0.2, 0.5]}>
            <sphereGeometry args={[1.8, CLOUD_SPHERE_SEGMENTS, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.6, 0.5, -0.7]}>
            <sphereGeometry args={[1.3, CLOUD_SPHERE_SEGMENTS, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.72} />
          </mesh>
          <mesh position={[-0.9, -0.5, -0.3]}>
            <sphereGeometry args={[1.1, CLOUD_SPHERE_SEGMENTS, 8]} />
            <meshStandardMaterial color="#f8f8ff" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Rain field — instanced falling drops (unchanged)
// ---------------------------------------------------------------------------

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
