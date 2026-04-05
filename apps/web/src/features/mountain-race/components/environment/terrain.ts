import { Vector3 } from "three";
import { TRACK_POINTS, trackCurve } from "@/features/mountain-race/data/trackPath";

const FIRST_POINT = TRACK_POINTS[0];
const LAST_POINT = TRACK_POINTS[TRACK_POINTS.length - 1];

export const TRACK_Z_START = FIRST_POINT ? FIRST_POINT.z : 6;
export const TRACK_Z_END = LAST_POINT ? LAST_POINT.z : -142;
export const TRACK_Z_RANGE = TRACK_Z_START - TRACK_Z_END;

export const TERRAIN = {
  groundOffset: 2.0,
  trackDipWidth: 7,
  trackDipRate: 0.45,
  sideFalloffStart: 3,
  sideFalloffRate: 0.12,
  farFalloffStart: 30,
  farFalloffRate: 0.08,
} as const;

export function estimateTerrainY(z: number, xDist: number): number {
  const sample = new Vector3();
  const t = Math.max(0, Math.min(1, (TRACK_Z_START - z) / TRACK_Z_RANGE));
  trackCurve.getPointAt(t, sample);
  const trackY = sample.y;
  const trackDip = Math.max(0, TERRAIN.trackDipWidth - xDist) * TERRAIN.trackDipRate;
  const sideSlope = Math.max(0, xDist - TERRAIN.sideFalloffStart) * TERRAIN.sideFalloffRate;
  const farSlope = Math.max(0, xDist - TERRAIN.farFalloffStart) * TERRAIN.farFalloffRate;
  return trackY - TERRAIN.groundOffset - trackDip - sideSlope - farSlope;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function jitter(rng: () => number, amount: number): number {
  return (rng() * 2 - 1) * amount;
}
