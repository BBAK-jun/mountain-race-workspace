import { CatmullRomCurve3, Vector3 } from "three";
import { FINISH_LINE } from "@/features/mountain-race/constants";

export const TRACK_POINTS = [
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

export const trackCurve = new CatmullRomCurve3(TRACK_POINTS, false, "catmullrom", 0.3);

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
