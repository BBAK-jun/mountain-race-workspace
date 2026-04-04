import { useMemo } from "react";
import { CatmullRomCurve3, Vector3, DoubleSide } from "three";
import { FINISH_LINE } from "@/features/mountain-race/constants";

const TRACK_POINTS = [
  new Vector3(0, 0, 0),
  new Vector3(10, 5, -20),
  new Vector3(-5, 15, -50),
  new Vector3(8, 25, -80),
  new Vector3(-3, 35, -110),
  new Vector3(0, 40, -130),
];

const TUBE_RADIUS = 0.4;
const TUBE_SEGMENTS = 128;
const TUBE_RADIAL_SEGMENTS = 8;

export const trackCurve = new CatmullRomCurve3(TRACK_POINTS, false, "catmullrom", 0.5);

export const FINISH_LINE_PROGRESS = FINISH_LINE;

export function getTrackPoint(progress: number): Vector3 {
  return trackCurve.getPointAt(Math.min(Math.max(progress, 0), 1));
}

export function getTrackPointTo(progress: number, out: Vector3): Vector3 {
  return trackCurve.getPointAt(Math.min(Math.max(progress, 0), 1), out);
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

  return (
    <group position={position}>
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

export function Track() {
  const tubeArgs = useMemo(
    () => [trackCurve, TUBE_SEGMENTS, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS, false] as const,
    [],
  );

  return (
    <group>
      <mesh>
        <tubeGeometry args={[...tubeArgs]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} side={DoubleSide} />
      </mesh>
      <FinishLine />
    </group>
  );
}
