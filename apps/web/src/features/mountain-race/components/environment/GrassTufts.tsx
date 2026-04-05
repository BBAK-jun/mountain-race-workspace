import { useLayoutEffect, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import { estimateTerrainY, jitter, mulberry32 } from "./terrain";

interface GrassTuft {
  pos: [number, number, number];
  scale: number;
  rotation: number;
}

const GRASS_COUNT = 180;
const GRASS_COLOR_SEED = 33303;

const GRASS_DATA: GrassTuft[] = buildGrassData();

function buildGrassData(): GrassTuft[] {
  const rng = mulberry32(33302);
  const out: GrassTuft[] = [];
  for (let i = 0; i < GRASS_COUNT; i++) {
    const t = i / (GRASS_COUNT - 1);
    const z = 4 - t * 148 + jitter(rng, 1.2);
    const side = i % 2 === 0 ? 1 : -1;
    const xOffset = 2.5 + rng() * 5;
    const x = side * xOffset + jitter(rng, 1.0);
    const y = estimateTerrainY(z, Math.abs(x)) + 0.1;
    const scale = 0.15 + rng() * 0.2;
    out.push({ pos: [x, y, z], scale, rotation: rng() * Math.PI * 2 });
  }
  return out;
}

export function GrassTufts() {
  const primaryRef = useRef<InstancedMesh>(null);
  const secondaryRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const primary = primaryRef.current;
    const secondary = secondaryRef.current;
    const dummy = dummyRef.current;
    if (!primary || !secondary) return;

    const rng = mulberry32(GRASS_COLOR_SEED);
    const color = new Color();

    for (let i = 0; i < GRASS_DATA.length; i++) {
      const g = GRASS_DATA[i];
      if (!g) continue;

      dummy.position.set(g.pos[0], g.pos[1], g.pos[2]);
      dummy.rotation.set(0, g.rotation, 0.1);
      dummy.scale.set(g.scale, g.scale * 2, g.scale);
      dummy.updateMatrix();
      primary.setMatrixAt(i, dummy.matrix);

      dummy.position.set(g.pos[0] + 0.05, g.pos[1], g.pos[2] + 0.05);
      dummy.rotation.set(0, g.rotation + Math.PI / 3, -0.08);
      dummy.scale.set(g.scale * 0.8, g.scale * 1.6, g.scale * 0.8);
      dummy.updateMatrix();
      secondary.setMatrixAt(i, dummy.matrix);

      const alt = Math.max(0, Math.min(1, g.pos[1] / 24));
      const hue = 0.28 - alt * 0.12;
      const sat = 0.5 - alt * 0.15;
      const light = 0.32 + rng() * 0.1;

      color.setHSL(hue, sat, light);
      primary.setColorAt(i, color);

      color.setHSL(hue + 0.02, sat - 0.05, light + 0.03);
      secondary.setColorAt(i, color);
    }

    primary.instanceMatrix.needsUpdate = true;
    secondary.instanceMatrix.needsUpdate = true;
    if (primary.instanceColor) primary.instanceColor.needsUpdate = true;
    if (secondary.instanceColor) secondary.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={primaryRef} args={[undefined, undefined, GRASS_COUNT]}>
        <coneGeometry args={[0.3, 1.2, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={secondaryRef} args={[undefined, undefined, GRASS_COUNT]}>
        <coneGeometry args={[0.22, 0.85, 3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
    </group>
  );
}
