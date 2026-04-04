import { useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
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

const TRAIL_SAMPLE_COUNT = 200;
const TRAIL_WIDTH = 2.4;
const TRAIL_THICKNESS = 0.2;
const TRAIL_STONE_EVERY = 5;
const TRAIL_CENTER_Y_OFFSET = 0.08;
export const TRACK_SURFACE_Y_OFFSET = TRAIL_CENTER_Y_OFFSET + TRAIL_THICKNESS / 2;
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
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
}

interface TrailStone {
  id: string;
  position: [number, number, number];
  scale: [number, number, number];
}

interface TrailRidge {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export function Track() {
  const { segments, stones, ridges } = useMemo(() => {
    const sampled = trackCurve.getSpacedPoints(TRAIL_SAMPLE_COUNT);
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
      const roll = Math.sin(i * 0.37) * 0.05;

      outputSegments.push({
        id: `seg-${i}`,
        position: [mid.x, mid.y + TRAIL_CENTER_Y_OFFSET, mid.z],
        rotation: [pitch, yaw, roll],
        length: length + 0.12,
      });

      const progressT = i / lastIndex;
      const ridgeHeight = 2.8 + progressT * 5.2;
      const ridgeWidth = 8.5 + progressT * 4.5;
      outputRidges.push({
        id: `ridge-${i}`,
        position: [mid.x, mid.y - ridgeHeight * 0.65, mid.z],
        rotation: [pitch, yaw, roll * 0.3],
        scale: [ridgeWidth, ridgeHeight, length + 1.8],
      });

      if (i % TRAIL_STONE_EVERY === 0) {
        const side = dir.clone().cross(up).normalize();
        const left = mid.clone().add(side.clone().multiplyScalar(1.55));
        const right = mid.clone().add(side.multiplyScalar(-1.55));
        const leftScaleSeed = 0.65 + (i % 3) * 0.08;
        const rightScaleSeed = 0.58 + ((i + 1) % 3) * 0.09;

        outputStones.push({
          id: `stone-l-${i}`,
          position: [left.x, left.y - 0.45, left.z],
          scale: [leftScaleSeed, leftScaleSeed * 0.8, leftScaleSeed],
        });
        outputStones.push({
          id: `stone-r-${i}`,
          position: [right.x, right.y - 0.42, right.z],
          scale: [rightScaleSeed, rightScaleSeed * 0.75, rightScaleSeed],
        });
      }
    }

    return { segments: outputSegments, stones: outputStones, ridges: outputRidges };
  }, []);

  return (
    <group>
      {ridges.map((ridge) => (
        <mesh
          key={ridge.id}
          position={ridge.position}
          rotation={ridge.rotation}
          scale={ridge.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4f5e4d" roughness={0.98} />
        </mesh>
      ))}
      {segments.map((segment) => (
        <mesh key={segment.id} position={segment.position} rotation={segment.rotation}>
          <boxGeometry args={[TRAIL_WIDTH, TRAIL_THICKNESS, segment.length]} />
          <meshStandardMaterial color="#8a6a47" roughness={0.94} />
        </mesh>
      ))}
      {stones.map((stone) => (
        <mesh key={stone.id} position={stone.position} scale={stone.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5e6a72" roughness={0.98} />
        </mesh>
      ))}
      <FinishLine />
    </group>
  );
}
