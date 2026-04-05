import { useLayoutEffect, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";
import { estimateTerrainY, jitter, mulberry32 } from "./terrain";

interface SnowPatch {
  pos: [number, number, number];
  scale: [number, number, number];
  rotation: number;
}

const HIGH_ALT_Z_START = -90;
const PATCH_COUNT = 18;

const SNOW_PATCH_DATA: SnowPatch[] = buildSnowPatchData();

function buildSnowPatchData(): SnowPatch[] {
  const rng = mulberry32(55501);
  const out: SnowPatch[] = [];
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
}

export function SnowPatches() {
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
