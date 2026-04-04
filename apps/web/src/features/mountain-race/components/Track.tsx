import { useLayoutEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, Object3D, type InstancedMesh, Vector3 } from "three";
import { FINISH_LINE } from "@/features/mountain-race/constants";

const TRACK_POINTS = [
  new Vector3(0, 0, 6),
  new Vector3(6, 1.5, -10),
  new Vector3(-5, 3.5, -24),
  new Vector3(7.5, 6.5, -40),
  new Vector3(-7, 9.5, -58),
  new Vector3(6.5, 13, -78),
  new Vector3(-6, 16.5, -100),
  new Vector3(4, 20, -122),
  new Vector3(0, 24, -142),
];

const TRAIL_CONFIG = {
  sampleCount: 200,
  width: 2.4,
  thickness: 0.2,
  stoneEvery: 5,
  centerYOffset: 0.08,
  segmentLengthPad: 0.12,
  stoneSideOffset: 1.55,
  stoneLeftY: 0.45,
  stoneRightY: 0.42,
  ridge: {
    baseHeight: 2.8,
    growHeight: 5.2,
    baseWidth: 8.5,
    growWidth: 4.5,
    sinkRatio: 0.65,
    lengthPad: 1.8,
    rollScale: 0.3,
  },
  rollFrequency: 0.37,
  rollAmount: 0.05,
} as const;

export const TRACK_SURFACE_Y_OFFSET = TRAIL_CONFIG.centerYOffset + TRAIL_CONFIG.thickness / 2;
const _surfacePoint = new Vector3();

export const trackCurve = new CatmullRomCurve3(TRACK_POINTS, false, "catmullrom", 0.3);

export const FINISH_LINE_PROGRESS = FINISH_LINE;

export function getTrackPoint(progress: number): Vector3 {
  return trackCurve.getPointAt(Math.min(Math.max(progress, 0), 1));
}

export function getTrackPointTo(progress: number, out: Vector3): Vector3 {
  return trackCurve.getPointAt(Math.min(Math.max(progress, 0), 1), out);
}

export function getTrackSurfaceY(progress: number): number {
  return getTrackPointTo(progress, _surfacePoint).y + TRACK_SURFACE_Y_OFFSET;
}

export function getTrackTangent(progress: number): Vector3 {
  return trackCurve.getTangentAt(Math.min(Math.max(progress, 0), 1));
}

export function getTrackTangentTo(progress: number, out: Vector3): Vector3 {
  return trackCurve.getTangentAt(Math.min(Math.max(progress, 0), 1), out);
}

export function getFinishLinePosition(): Vector3 {
  return trackCurve.getPointAt(FINISH_LINE_PROGRESS);
}

export function getFinishLinePositionTo(out: Vector3): Vector3 {
  return trackCurve.getPointAt(FINISH_LINE_PROGRESS, out);
}

function FinishLine() {
  const position = useMemo(() => getFinishLinePosition(), []);
  const yaw = useMemo(() => {
    const tangent = getTrackTangent(FINISH_LINE_PROGRESS);
    return Math.atan2(tangent.x, tangent.z);
  }, []);

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[1.5, 2.5, 0]}>
        <boxGeometry args={[0.12, 5, 0.12]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[-1.5, 2.5, 0]}>
        <boxGeometry args={[0.12, 5, 0.12]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[3.2, 0.25, 0.1]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.06, 8, 32]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

interface TrailSegment {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface TrailStone {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface TrailRidge {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const _instanceObject = new Object3D();

function applyInstanceTransforms(
  mesh: InstancedMesh,
  transforms: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }[],
) {
  for (let i = 0; i < transforms.length; i++) {
    const transform = transforms[i];
    if (!transform) continue;
    _instanceObject.position.set(transform.position[0], transform.position[1], transform.position[2]);
    _instanceObject.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
    _instanceObject.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
    _instanceObject.updateMatrix();
    mesh.setMatrixAt(i, _instanceObject.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function Track() {
  const segmentRef = useRef<InstancedMesh>(null);
  const stoneRef = useRef<InstancedMesh>(null);
  const ridgeRef = useRef<InstancedMesh>(null);

  const { segments, stones, ridges } = useMemo(() => {
    const sampled = trackCurve.getSpacedPoints(TRAIL_CONFIG.sampleCount);
    const outputSegments: TrailSegment[] = [];
    const outputStones: TrailStone[] = [];
    const outputRidges: TrailRidge[] = [];
    const up = new Vector3(0, 1, 0);
    const lastIndex = Math.max(sampled.length - 2, 1);

    for (let i = 0; i < sampled.length - 1; i++) {
      const start = sampled[i];
      const end = sampled[i + 1];
      if (!start || !end) continue;

      const dir = end.clone().sub(start);
      const length = dir.length();
      if (length < 0.001) continue;

      const mid = start.clone().add(end).multiplyScalar(0.5);
      const flat = Math.hypot(dir.x, dir.z);
      const yaw = Math.atan2(dir.x, dir.z);
      const pitch = -Math.atan2(dir.y, Math.max(flat, 0.0001));
      const roll = Math.sin(i * TRAIL_CONFIG.rollFrequency) * TRAIL_CONFIG.rollAmount;

      outputSegments.push({
        position: [mid.x, mid.y + TRAIL_CONFIG.centerYOffset, mid.z],
        rotation: [pitch, yaw, roll],
        scale: [TRAIL_CONFIG.width, TRAIL_CONFIG.thickness, length + TRAIL_CONFIG.segmentLengthPad],
      });

      const progressT = i / lastIndex;
      const ridgeHeight = TRAIL_CONFIG.ridge.baseHeight + progressT * TRAIL_CONFIG.ridge.growHeight;
      const ridgeWidth = TRAIL_CONFIG.ridge.baseWidth + progressT * TRAIL_CONFIG.ridge.growWidth;
      outputRidges.push({
        position: [mid.x, mid.y - ridgeHeight * TRAIL_CONFIG.ridge.sinkRatio, mid.z],
        rotation: [pitch, yaw, roll * TRAIL_CONFIG.ridge.rollScale],
        scale: [ridgeWidth, ridgeHeight, length + TRAIL_CONFIG.ridge.lengthPad],
      });

      if (i % TRAIL_CONFIG.stoneEvery === 0) {
        const side = dir.clone().cross(up).normalize();
        const left = mid.clone().add(side.clone().multiplyScalar(TRAIL_CONFIG.stoneSideOffset));
        const right = mid.clone().add(side.multiplyScalar(-TRAIL_CONFIG.stoneSideOffset));
        const leftScaleSeed = 0.65 + (i % 3) * 0.08;
        const rightScaleSeed = 0.58 + ((i + 1) % 3) * 0.09;

        outputStones.push({
          position: [left.x, left.y - TRAIL_CONFIG.stoneLeftY, left.z],
          rotation: [pitch, yaw, 0],
          scale: [leftScaleSeed, leftScaleSeed * 0.8, leftScaleSeed],
        });
        outputStones.push({
          position: [right.x, right.y - TRAIL_CONFIG.stoneRightY, right.z],
          rotation: [pitch, yaw, 0],
          scale: [rightScaleSeed, rightScaleSeed * 0.75, rightScaleSeed],
        });
      }
    }

    return { segments: outputSegments, stones: outputStones, ridges: outputRidges };
  }, []);

  useLayoutEffect(() => {
    if (segmentRef.current) applyInstanceTransforms(segmentRef.current, segments);
    if (stoneRef.current) applyInstanceTransforms(stoneRef.current, stones);
    if (ridgeRef.current) applyInstanceTransforms(ridgeRef.current, ridges);
  }, [segments, stones, ridges]);

  return (
    <group>
      <instancedMesh ref={ridgeRef} args={[undefined, undefined, ridges.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4f5e4d" roughness={0.98} />
      </instancedMesh>
      <instancedMesh ref={segmentRef} args={[undefined, undefined, segments.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8a6a47" roughness={0.94} />
      </instancedMesh>
      <instancedMesh ref={stoneRef} args={[undefined, undefined, stones.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#5e6a72" roughness={0.98} />
      </instancedMesh>
      <FinishLine />
    </group>
  );
}
