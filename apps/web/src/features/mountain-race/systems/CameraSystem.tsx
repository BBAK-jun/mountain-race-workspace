import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Character, CameraMode } from "@/features/mountain-race/types";
import { getTrackPoint, getTrackTangent, getFinishLinePosition } from "../components/Track";

const _desired = new Vector3();
const _lookTarget = new Vector3();
const _behind = new Vector3();
const _side = new Vector3();

interface ModeConfig {
  height: number;
  distance: number;
  side: number;
  lookAhead: number;
}

const MODE_CONFIG: Record<CameraMode, ModeConfig> = {
  follow: { height: 8, distance: 15, side: 0, lookAhead: 5 },
  event_zoom: { height: 4, distance: 8, side: 4, lookAhead: 0 },
  slowmo: { height: 6, distance: 12, side: 2, lookAhead: 3 },
  finish: { height: 10, distance: 12, side: 5, lookAhead: 0 },
  shake: { height: 8, distance: 15, side: 0, lookAhead: 5 },
};

const LERP_BASE = 0.04;
const LERP_TRANSITION = 0.08;
const SHAKE_INTENSITY = 0.25;
const SHAKE_DECAY = 0.9;

interface CameraSystemProps {
  cameraMode: CameraMode;
  cameraTarget: string | null;
  characters: Character[];
  rankings: string[];
}

export function CameraSystem({
  cameraMode,
  cameraTarget,
  characters,
  rankings,
}: CameraSystemProps) {
  const { camera } = useThree();
  const smoothLookAt = useRef(new Vector3(0, 5, -10));
  const prevMode = useRef<CameraMode>("follow");
  const shakeAmount = useRef(0);

  useFrame(() => {
    const cfg = MODE_CONFIG[cameraMode];

    if (cameraMode === "finish") {
      const finishPos = getFinishLinePosition();
      _desired.set(finishPos.x + cfg.side, finishPos.y + cfg.height, finishPos.z + cfg.distance);
      _lookTarget.copy(finishPos);
    } else {
      const target = resolveTarget(characters, rankings, cameraTarget);
      if (!target) return;

      const pos = getTrackPoint(target.progress);
      const tangent = getTrackTangent(target.progress);

      _behind.copy(tangent).multiplyScalar(-cfg.distance);
      _desired.copy(pos).add(_behind);
      _desired.y += cfg.height;

      if (cfg.side !== 0) {
        _side.set(-tangent.z, 0, tangent.x).normalize().multiplyScalar(cfg.side);
        _desired.add(_side);
      }

      _lookTarget.copy(pos);
      if (cfg.lookAhead > 0) {
        _lookTarget.addScaledVector(tangent, cfg.lookAhead);
      }
    }

    const transitioning = cameraMode !== prevMode.current;
    const lerp = transitioning ? LERP_TRANSITION : LERP_BASE;

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
    prevMode.current = cameraMode;
  });

  return null;
}

function resolveTarget(
  characters: Character[],
  rankings: string[],
  cameraTarget: string | null,
): Character | undefined {
  if (cameraTarget) {
    return characters.find((c) => c.id === cameraTarget);
  }
  const leaderId = rankings[0];
  if (leaderId) {
    return characters.find((c) => c.id === leaderId);
  }
  return characters[0];
}
