import { useLayoutEffect, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import { estimateTerrainY, jitter, mulberry32 } from "./terrain";

interface BoulderEntry {
  id: string;
  pos: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

interface PebbleEntry {
  pos: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}

const BOULDER_DATA: BoulderEntry[] = buildBoulderData();
const PEBBLE_DATA: PebbleEntry[] = buildPebbleData();

function buildBoulderData(): BoulderEntry[] {
  const rng = mulberry32(77701);
  const out: BoulderEntry[] = [];
  const zones = [
    { zStart: -5, zEnd: -50, count: 14, spread: 16 },
    { zStart: -52, zEnd: -100, count: 12, spread: 18 },
    { zStart: -102, zEnd: -150, count: 10, spread: 20 },
  ];
  let idx = 0;
  for (const zone of zones) {
    for (let i = 0; i < zone.count; i++) {
      const t = zone.count <= 1 ? 0.5 : i / (zone.count - 1);
      const side = i % 2 === 0 ? 1 : -1;
      const zp = zone.zStart + (zone.zEnd - zone.zStart) * t + jitter(rng, 2);
      const xp = side * (zone.spread * 0.5 + rng() * zone.spread * 0.5);
      const yp = estimateTerrainY(zp, Math.abs(xp)) + jitter(rng, 0.3);
      const s = 0.4 + rng() * 0.8;
      out.push({
        id: `bl-${idx}`,
        pos: [xp, yp, zp],
        scale: [s * (0.8 + rng() * 0.4), s * (0.6 + rng() * 0.5), s * (0.8 + rng() * 0.4)],
        rotation: [rng() * 0.4, rng() * Math.PI, rng() * 0.3],
      });
      idx++;
    }
  }
  return out;
}

function buildPebbleData(): PebbleEntry[] {
  const rng = mulberry32(77702);
  const out: PebbleEntry[] = [];
  for (const boulder of BOULDER_DATA) {
    const pebbleCount = 2 + Math.floor(rng() * 3);
    for (let j = 0; j < pebbleCount; j++) {
      const angle = rng() * Math.PI * 2;
      const dist = 0.5 + rng() * 1.5;
      const px = boulder.pos[0] + Math.cos(angle) * dist;
      const pz = boulder.pos[2] + Math.sin(angle) * dist;
      const py = estimateTerrainY(pz, Math.abs(px)) + 0.05;
      const ps = 0.08 + rng() * 0.18;
      out.push({
        pos: [px, py, pz],
        scale: ps,
        rotation: [rng() * 0.5, rng() * Math.PI, rng() * 0.5],
      });
    }
  }
  return out;
}

const BOULDER_COLOR_SEED = 77703;
const BOULDER_DETAIL = 1;

export function Boulders() {
  const meshRef = useRef<InstancedMesh>(null);
  const pebbleRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const pebbleMesh = pebbleRef.current;
    const dummy = dummyRef.current;
    if (!mesh) return;

    const rng = mulberry32(BOULDER_COLOR_SEED);
    const color = new Color();

    for (let i = 0; i < BOULDER_DATA.length; i++) {
      const b = BOULDER_DATA[i];
      if (!b) continue;
      dummy.position.set(b.pos[0], b.pos[1], b.pos[2]);
      dummy.rotation.set(b.rotation[0], b.rotation[1], b.rotation[2]);
      dummy.scale.set(b.scale[0], b.scale[1], b.scale[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const hue = 0.06 + rng() * 0.08;
      const sat = 0.05 + rng() * 0.12;
      const light = 0.32 + rng() * 0.15;
      color.setHSL(hue, sat, light);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (!pebbleMesh) return;
    for (let i = 0; i < PEBBLE_DATA.length; i++) {
      const p = PEBBLE_DATA[i];
      if (!p) continue;
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      pebbleMesh.setMatrixAt(i, dummy.matrix);

      color.setHSL(0.07 + rng() * 0.06, 0.06 + rng() * 0.1, 0.35 + rng() * 0.15);
      pebbleMesh.setColorAt(i, color);
    }

    pebbleMesh.instanceMatrix.needsUpdate = true;
    if (pebbleMesh.instanceColor) pebbleMesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, BOULDER_DATA.length]}>
        <dodecahedronGeometry args={[1, BOULDER_DETAIL]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={pebbleRef} args={[undefined, undefined, PEBBLE_DATA.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </instancedMesh>
    </group>
  );
}
