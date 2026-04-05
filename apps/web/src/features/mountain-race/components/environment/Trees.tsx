import { useLayoutEffect, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import { estimateTerrainY, jitter, mulberry32 } from "./terrain";

const TREE_CONFIG = {
  seed: 20260404,
  zJitter: 0.9,
  xJitter: 1.7,
  yJitter: 0.3,
  scaleVariance: 0.24,
  colorSeed: 20260405,
  zones: [
    { count: 42, zStart: -8, zEnd: -56, minOffset: 9, maxOffset: 17, scaleBase: 0.95 },
    { count: 28, zStart: -58, zEnd: -104, minOffset: 10, maxOffset: 18, scaleBase: 0.84 },
    { count: 18, zStart: -106, zEnd: -152, minOffset: 11, maxOffset: 21, scaleBase: 0.72 },
  ] as const,
} as const;

interface TreeEntry {
  id: string;
  pos: [number, number, number];
  scale: number;
}

const TREE_DATA: TreeEntry[] = buildTreeData();

function buildTreeData(): TreeEntry[] {
  const trees: TreeEntry[] = [];
  const rng = mulberry32(TREE_CONFIG.seed);
  let idx = 0;

  for (const zone of TREE_CONFIG.zones) {
    for (let i = 0; i < zone.count; i++) {
      const lane = i % 2 === 0 ? 1 : -1;
      const t = zone.count <= 1 ? 0 : i / (zone.count - 1);
      const z = zone.zStart + (zone.zEnd - zone.zStart) * t + jitter(rng, TREE_CONFIG.zJitter);
      const offset = zone.minOffset + rng() * (zone.maxOffset - zone.minOffset);
      const x = lane * (offset + jitter(rng, TREE_CONFIG.xJitter));
      const y = estimateTerrainY(z, Math.abs(x)) + jitter(rng, TREE_CONFIG.yJitter);
      const scale = zone.scaleBase + rng() * TREE_CONFIG.scaleVariance;
      trees.push({ id: `tr-${idx}`, pos: [x, y, z], scale });
      idx += 1;
    }
  }

  return trees;
}

export function Trees() {
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyBottomRef = useRef<InstancedMesh>(null);
  const canopyMidRef = useRef<InstancedMesh>(null);
  const canopyTopRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const trunk = trunkRef.current;
    const bottom = canopyBottomRef.current;
    const mid = canopyMidRef.current;
    const top = canopyTopRef.current;
    const dummy = dummyRef.current;
    if (!trunk || !bottom || !mid || !top) return;

    const rng = mulberry32(TREE_CONFIG.colorSeed);
    const color = new Color();

    for (let i = 0; i < TREE_DATA.length; i++) {
      const tree = TREE_DATA[i];
      if (!tree) continue;
      const [x, y, z] = tree.pos;
      const s = tree.scale;

      dummy.rotation.set(0, 0, 0);

      dummy.position.set(x, y + 0.6 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);

      color.setHSL(0.07 + rng() * 0.04, 0.35 + rng() * 0.15, 0.28 + rng() * 0.1);
      trunk.setColorAt(i, color);

      dummy.position.set(x, y + 1.3 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      bottom.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 1.9 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mid.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 2.4 * s, z);
      dummy.scale.set(s * 0.85, s * 0.85, s * 0.85);
      dummy.updateMatrix();
      top.setMatrixAt(i, dummy.matrix);

      const hue = 0.28 + rng() * 0.08;
      const sat = 0.4 + rng() * 0.2;
      const lightBase = 0.3 + rng() * 0.12;

      color.setHSL(hue, sat, lightBase);
      bottom.setColorAt(i, color);

      color.setHSL(hue + 0.02, sat, lightBase + 0.05);
      mid.setColorAt(i, color);

      color.setHSL(hue + 0.03, sat - 0.05, lightBase + 0.08);
      top.setColorAt(i, color);
    }

    trunk.instanceMatrix.needsUpdate = true;
    bottom.instanceMatrix.needsUpdate = true;
    mid.instanceMatrix.needsUpdate = true;
    top.instanceMatrix.needsUpdate = true;
    if (trunk.instanceColor) trunk.instanceColor.needsUpdate = true;
    if (bottom.instanceColor) bottom.instanceColor.needsUpdate = true;
    if (mid.instanceColor) mid.instanceColor.needsUpdate = true;
    if (top.instanceColor) top.instanceColor.needsUpdate = true;
  }, []);

  const count = TREE_DATA.length;

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.07, 0.14, 1.2, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={canopyBottomRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.7, 1.2, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={canopyMidRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.55, 1.1, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={canopyTopRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.4, 0.9, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
    </group>
  );
}
