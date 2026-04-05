import { useLayoutEffect, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";

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

const CLOUD_SPHERE_OFFSETS = [
  { offset: [0, 0, 0] as const, radius: 2 },
  { offset: [1.8, -0.3, 0.4] as const, radius: 1.5 },
  { offset: [-1.5, -0.2, 0.5] as const, radius: 1.8 },
  { offset: [0.6, 0.5, -0.7] as const, radius: 1.3 },
  { offset: [-0.9, -0.5, -0.3] as const, radius: 1.1 },
];

const TOTAL_CLOUD_SPHERES = CLOUD_DATA.length * CLOUD_SPHERE_OFFSETS.length;
const CLOUD_SPHERE_SEGMENTS = 10;

export function Clouds() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const dummy = dummyRef.current;
    if (!mesh) return;

    let idx = 0;
    for (const cloud of CLOUD_DATA) {
      for (const sphere of CLOUD_SPHERE_OFFSETS) {
        dummy.position.set(
          cloud.pos[0] + sphere.offset[0] * cloud.scale,
          cloud.pos[1] + sphere.offset[1] * cloud.scale,
          cloud.pos[2] + sphere.offset[2] * cloud.scale,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(sphere.radius * cloud.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL_CLOUD_SPHERES]}>
      <sphereGeometry args={[1, CLOUD_SPHERE_SEGMENTS, 8]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.78} />
    </instancedMesh>
  );
}
