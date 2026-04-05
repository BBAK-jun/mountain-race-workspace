import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, Vector3, type InstancedMesh } from "three";
import {
  trackCurve,
  getTrackPoint,
  getTrackPointTo,
  getTrackTangent,
  getTrackTangentTo,
  getFinishLinePosition,
  getFinishLinePositionTo,
  FINISH_LINE_PROGRESS,
} from "@/features/mountain-race/data/trackPath";

export {
  trackCurve,
  getTrackPoint,
  getTrackPointTo,
  getTrackTangent,
  getTrackTangentTo,
  getFinishLinePosition,
  getFinishLinePositionTo,
  FINISH_LINE_PROGRESS,
};

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

export function getTrackSurfaceY(progress: number): number {
  return getTrackPointTo(progress, _surfacePoint).y + TRACK_SURFACE_Y_OFFSET;
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

interface TrailTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const _instanceObject = new Object3D();

function applyInstanceTransforms(mesh: InstancedMesh, transforms: TrailTransform[]) {
  for (let i = 0; i < transforms.length; i++) {
    const transform = transforms[i];
    if (!transform) continue;
    _instanceObject.position.set(
      transform.position[0],
      transform.position[1],
      transform.position[2],
    );
    _instanceObject.rotation.set(
      transform.rotation[0],
      transform.rotation[1],
      transform.rotation[2],
    );
    _instanceObject.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
    _instanceObject.updateMatrix();
    mesh.setMatrixAt(i, _instanceObject.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

const STEP_CONFIG = {
  slopeThreshold: 0.12,
  stepEvery: 3,
  plankWidth: 2.2,
  plankHeight: 0.08,
  plankDepth: 0.28,
  yOffset: 0.14,
} as const;

const RAIL_CONFIG = {
  slopeThreshold: 0.18,
  postEvery: 8,
  postHeight: 0.9,
  postRadius: 0.035,
  sideOffset: 1.35,
  ropeRadius: 0.02,
  ropeSegments: 8,
} as const;

export function Track() {
  const segmentRef = useRef<InstancedMesh>(null);
  const stoneRef = useRef<InstancedMesh>(null);
  const ridgeRef = useRef<InstancedMesh>(null);
  const stepRef = useRef<InstancedMesh>(null);
  const railPostRef = useRef<InstancedMesh>(null);
  const ropeRef = useRef<InstancedMesh>(null);

  const { segments, stones, ridges, steps, railPosts, ropes } = useMemo(() => {
    const sampled = trackCurve.getSpacedPoints(TRAIL_CONFIG.sampleCount);
    const outputSegments: TrailTransform[] = [];
    const outputStones: TrailTransform[] = [];
    const outputRidges: TrailTransform[] = [];
    const outputSteps: TrailTransform[] = [];
    const outputRailPosts: TrailTransform[] = [];
    const outputRopes: TrailTransform[] = [];
    const up = new Vector3(0, 1, 0);
    const lastIndex = Math.max(sampled.length - 2, 1);

    let prevRailPostLeft: Vector3 | null = null;
    let prevRailPostRight: Vector3 | null = null;

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
      const slope = Math.abs(dir.y) / Math.max(length, 0.001);

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

      if (slope > STEP_CONFIG.slopeThreshold && i % STEP_CONFIG.stepEvery === 0) {
        outputSteps.push({
          position: [mid.x, mid.y + STEP_CONFIG.yOffset, mid.z],
          rotation: [0, yaw, 0],
          scale: [STEP_CONFIG.plankWidth, STEP_CONFIG.plankHeight, STEP_CONFIG.plankDepth],
        });
      }

      if (slope > RAIL_CONFIG.slopeThreshold && i % RAIL_CONFIG.postEvery === 0) {
        const side = dir.clone().cross(up).normalize();
        const railSide = i % 16 < 8 ? 1 : -1;
        const postPos = mid
          .clone()
          .add(side.clone().multiplyScalar(railSide * RAIL_CONFIG.sideOffset));
        postPos.y += RAIL_CONFIG.postHeight * 0.5 + TRAIL_CONFIG.centerYOffset;

        outputRailPosts.push({
          position: [postPos.x, postPos.y, postPos.z],
          rotation: [0, yaw, 0],
          scale: [1, 1, 1],
        });

        const prevPost = railSide === 1 ? prevRailPostLeft : prevRailPostRight;
        if (prevPost) {
          const ropeMid = prevPost.clone().add(postPos).multiplyScalar(0.5);
          const ropeDist = prevPost.distanceTo(postPos);
          const ropeDir = postPos.clone().sub(prevPost);
          const ropeYaw = Math.atan2(ropeDir.x, ropeDir.z);
          const ropePitch = -Math.atan2(
            ropeDir.y,
            Math.max(Math.hypot(ropeDir.x, ropeDir.z), 0.001),
          );
          outputRopes.push({
            position: [ropeMid.x, ropeMid.y, ropeMid.z],
            rotation: [ropePitch, ropeYaw, 0],
            scale: [1, ropeDist, 1],
          });
        }
        if (railSide === 1) {
          prevRailPostLeft = postPos;
        } else {
          prevRailPostRight = postPos;
        }
      } else if (slope <= RAIL_CONFIG.slopeThreshold) {
        prevRailPostLeft = null;
        prevRailPostRight = null;
      }

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

    return {
      segments: outputSegments,
      stones: outputStones,
      ridges: outputRidges,
      steps: outputSteps,
      railPosts: outputRailPosts,
      ropes: outputRopes,
    };
  }, []);

  useLayoutEffect(() => {
    if (segmentRef.current) applyInstanceTransforms(segmentRef.current, segments);
    if (stoneRef.current) applyInstanceTransforms(stoneRef.current, stones);
    if (ridgeRef.current) applyInstanceTransforms(ridgeRef.current, ridges);
    if (stepRef.current) applyInstanceTransforms(stepRef.current, steps);
    if (railPostRef.current) applyInstanceTransforms(railPostRef.current, railPosts);
    if (ropeRef.current) applyInstanceTransforms(ropeRef.current, ropes);
  }, [segments, stones, ridges, steps, railPosts, ropes]);

  return (
    <group>
      <instancedMesh ref={ridgeRef} args={[undefined, undefined, ridges.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6a7e66" roughness={0.98} />
      </instancedMesh>
      <instancedMesh ref={segmentRef} args={[undefined, undefined, segments.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#a4845c" roughness={0.94} />
      </instancedMesh>
      <instancedMesh ref={stoneRef} args={[undefined, undefined, stones.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8694a0" roughness={0.98} />
      </instancedMesh>
      {steps.length > 0 && (
        <instancedMesh ref={stepRef} args={[undefined, undefined, steps.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#b08855" roughness={0.88} />
        </instancedMesh>
      )}
      {railPosts.length > 0 && (
        <instancedMesh ref={railPostRef} args={[undefined, undefined, railPosts.length]}>
          <cylinderGeometry
            args={[RAIL_CONFIG.postRadius, RAIL_CONFIG.postRadius * 1.2, RAIL_CONFIG.postHeight, 5]}
          />
          <meshStandardMaterial color="#8b6f47" roughness={0.9} />
        </instancedMesh>
      )}
      {ropes.length > 0 && (
        <instancedMesh ref={ropeRef} args={[undefined, undefined, ropes.length]}>
          <cylinderGeometry
            args={[RAIL_CONFIG.ropeRadius, RAIL_CONFIG.ropeRadius, 1, RAIL_CONFIG.ropeSegments]}
          />
          <meshStandardMaterial color="#c8a86e" roughness={0.85} />
        </instancedMesh>
      )}
      <FinishLine />
    </group>
  );
}
