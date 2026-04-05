import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Character, CameraMode } from "@/features/mountain-race/types";
import { getTrackPointTo, getTrackTangentTo, getFinishLinePositionTo } from "../components/Track";

const _desired = new Vector3();
const _lookTarget = new Vector3();
const _behind = new Vector3();
const _side = new Vector3();
const _pos = new Vector3();
const _tangent = new Vector3();
const _finishPos = new Vector3();

interface ModeConfig {
  height: number;
  distance: number;
  side: number;
  lookAhead: number;
}

const MODE_CONFIG: Record<Exclude<CameraMode, "free">, ModeConfig> = {
  follow: { height: 8, distance: 15, side: 0, lookAhead: 5 },
  event_zoom: { height: 4, distance: 8, side: 4, lookAhead: 0 },
  slowmo: { height: 6, distance: 12, side: 2, lookAhead: 3 },
  finish: { height: 10, distance: 12, side: 5, lookAhead: 0 },
  shake: { height: 8, distance: 15, side: 0, lookAhead: 5 },
};

const LERP_BASE = 0.04;
const LERP_TRANSITION = 0.08;
const TRANSITION_DURATION_MS = 250;
const SHAKE_INTENSITY = 0.25;
const SHAKE_DECAY = 0.9;

interface CameraSystemProps {
  cameraMode: CameraMode;
  cameraTarget: string | null;
  characters: Character[];
  rankings: string[];
  finishedIds: string[];
}

export function getTargetTrackPosition(
  characters: Character[],
  rankings: string[],
  cameraTarget: string | null,
  out: Vector3,
  finishedIds: string[] = [],
): boolean {
  const target = resolveTarget(characters, rankings, cameraTarget, finishedIds);
  if (!target) return false;
  getTrackPointTo(target.progress, out);
  return true;
}

export function CameraSystem({
  cameraMode,
  cameraTarget,
  characters,
  rankings,
  finishedIds,
}: CameraSystemProps) {
  const { camera } = useThree();
  const smoothLookAt = useRef(new Vector3(0, 5, -10));
  const prevMode = useRef<CameraMode>("follow");
  const shakeAmount = useRef(0);
  const transitionStart = useRef(Number.NEGATIVE_INFINITY);

  useFrame(() => {
    if (cameraMode === "free") {
      prevMode.current = "free";
      return;
    }

    if (cameraMode !== prevMode.current) {
      transitionStart.current = performance.now();
      prevMode.current = cameraMode;
    }

    const cfg = MODE_CONFIG[cameraMode];

    if (cameraMode === "finish") {
      getFinishLinePositionTo(_finishPos);
      _desired.set(_finishPos.x + cfg.side, _finishPos.y + cfg.height, _finishPos.z + cfg.distance);
      _lookTarget.copy(_finishPos);
    } else {
      const target = resolveTarget(characters, rankings, cameraTarget, finishedIds);
      if (!target) return;

      getTrackPointTo(target.progress, _pos);
      getTrackTangentTo(target.progress, _tangent);

      _behind.copy(_tangent).multiplyScalar(-cfg.distance);
      _desired.copy(_pos).add(_behind);
      _desired.y += cfg.height;

      if (cfg.side !== 0) {
        _side.set(-_tangent.z, 0, _tangent.x).normalize().multiplyScalar(cfg.side);
        _desired.add(_side);
      }

      _lookTarget.copy(_pos);
      if (cfg.lookAhead > 0) {
        _lookTarget.addScaledVector(_tangent, cfg.lookAhead);
      }
    }

    const inTransition = performance.now() - transitionStart.current < TRANSITION_DURATION_MS;
    const lerp = inTransition ? LERP_TRANSITION : LERP_BASE;

    camera.position.lerp(_desired, lerp);
    smoothLookAt.current.lerp(_lookTarget, lerp);

    if (cameraMode === "shake") {
      shakeAmount.current = SHAKE_INTENSITY;
    } else {
      shakeAmount.current *= SHAKE_DECAY;
    }

    if (shakeAmount.current > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shakeAmount.current;
      camera.position.y += (Math.random() - 0.5) * shakeAmount.current * 0.5;
      camera.position.z += (Math.random() - 0.5) * shakeAmount.current;
    }

    camera.lookAt(smoothLookAt.current);
  });

  return null;
}

function resolveTarget(
  characters: Character[],
  rankings: string[],
  cameraTarget: string | null,
  finishedIds: string[] = [],
): Character | undefined {
  if (cameraTarget) {
    const found = characters.find((c) => c.id === cameraTarget);
    if (found) return found;
  }
  for (const id of rankings) {
    if (!finishedIds.includes(id)) {
      return characters.find((c) => c.id === id);
    }
  }
  const leaderId = rankings[0];
  if (leaderId) {
    return characters.find((c) => c.id === leaderId);
  }
  return characters[0];
}
