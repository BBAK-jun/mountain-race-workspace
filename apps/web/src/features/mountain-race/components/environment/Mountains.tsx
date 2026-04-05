import { useLayoutEffect, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";

interface MountainEntry {
  id: string;
  pos: readonly [number, number, number];
  scale: readonly [number, number, number];
  color: string;
  hasSnow: boolean;
}

const MOUNTAIN_DATA: MountainEntry[] = [
  { id: "mt-a", pos: [30, 8, -40], scale: [12, 18, 12], color: "#8ea4b8", hasSnow: false },
  { id: "mt-b", pos: [-25, 6, -30], scale: [10, 14, 10], color: "#9bb2c4", hasSnow: false },
  { id: "mt-c", pos: [15, 10, -90], scale: [15, 22, 15], color: "#8498af", hasSnow: true },
  { id: "mt-d", pos: [-35, 12, -100], scale: [18, 26, 18], color: "#93a8be", hasSnow: true },
  { id: "mt-e", pos: [40, 14, -120], scale: [20, 30, 20], color: "#8898b0", hasSnow: true },
  { id: "mt-f", pos: [-20, 9, -70], scale: [14, 20, 14], color: "#a0b4c6", hasSnow: false },
  { id: "mt-g", pos: [5, 16, -150], scale: [22, 34, 22], color: "#7a94aa", hasSnow: true },
  { id: "mt-h", pos: [-40, 11, -140], scale: [16, 24, 16], color: "#8da2b8", hasSnow: true },
];

interface SecondaryPeakEntry {
  id: string;
  pos: readonly [number, number, number];
  scale: readonly [number, number, number];
  color: string;
}

const SECONDARY_PEAKS: SecondaryPeakEntry[] = [
  { id: "sp-a", pos: [36, 5, -38], scale: [7, 11, 7], color: "#96aec2" },
  { id: "sp-b", pos: [24, 6, -44], scale: [8, 13, 8], color: "#8ca0b4" },
  { id: "sp-c", pos: [-30, 4, -28], scale: [6, 9, 6], color: "#a3b8ca" },
  { id: "sp-d", pos: [22, 8, -86], scale: [9, 15, 9], color: "#8fa6b8" },
  { id: "sp-e", pos: [-42, 10, -105], scale: [11, 18, 11], color: "#8b9fB4" },
  { id: "sp-f", pos: [46, 11, -115], scale: [12, 20, 12], color: "#8494a8" },
  { id: "sp-g", pos: [-14, 14, -145], scale: [14, 22, 14], color: "#7e92a8" },
  { id: "sp-h", pos: [20, 13, -155], scale: [10, 16, 10], color: "#8da4b8" },
  { id: "sp-i", pos: [-50, 8, -70], scale: [10, 14, 10], color: "#94acc0" },
  { id: "sp-j", pos: [50, 6, -55], scale: [8, 12, 8], color: "#9cb4c8" },
];

const SNOW_CAP_RATIO = 0.3;
const SNOW_JITTERS = MOUNTAIN_DATA.map((_, i) => 0.88 + Math.sin(i * 7.3 + 2.1) * 0.12);
const MOUNTAIN_SEGMENTS = 10;
const SECONDARY_SEGMENTS = 8;
const FOOTHILL_HEIGHT_RATIO = 0.18;
const FOOTHILL_WIDTH_RATIO = 1.6;

const FOOTHILL_BLEND_TARGET = new Color("#5a7a5a");
const FOOTHILL_BLEND_AMOUNT = 0.35;

const MOUNTAIN_FOOTHILL_COLORS = MOUNTAIN_DATA.map((m) => {
  const c = new Color(m.color);
  c.lerp(FOOTHILL_BLEND_TARGET.clone(), FOOTHILL_BLEND_AMOUNT);
  return c;
});

const SECONDARY_FOOTHILL_COLORS = SECONDARY_PEAKS.map((sp) => {
  const c = new Color(sp.color);
  c.lerp(FOOTHILL_BLEND_TARGET.clone(), FOOTHILL_BLEND_AMOUNT);
  return c;
});

const SNOW_MOUNTAINS = MOUNTAIN_DATA.filter((m) => m.hasSnow);

export function Mountains() {
  const peakBodyRef = useRef<InstancedMesh>(null);
  const peakFoothillRef = useRef<InstancedMesh>(null);
  const snowCapRef = useRef<InstancedMesh>(null);
  const secBodyRef = useRef<InstancedMesh>(null);
  const secFoothillRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());

  useLayoutEffect(() => {
    const peakBody = peakBodyRef.current;
    const peakFoothill = peakFoothillRef.current;
    const snowCap = snowCapRef.current;
    const secBody = secBodyRef.current;
    const secFoothill = secFoothillRef.current;
    const dummy = dummyRef.current;
    if (!peakBody || !peakFoothill || !secBody || !secFoothill) return;

    const color = new Color();

    for (let i = 0; i < MOUNTAIN_DATA.length; i++) {
      const m = MOUNTAIN_DATA[i];
      if (!m) continue;

      dummy.position.set(m.pos[0], m.pos[1] - m.scale[1] * 0.38, m.pos[2]);
      dummy.scale.set(
        m.scale[0] * FOOTHILL_WIDTH_RATIO,
        m.scale[1] * FOOTHILL_HEIGHT_RATIO,
        m.scale[2] * FOOTHILL_WIDTH_RATIO,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      peakFoothill.setMatrixAt(i, dummy.matrix);
      const fhColor = MOUNTAIN_FOOTHILL_COLORS[i];
      if (fhColor) peakFoothill.setColorAt(i, fhColor);

      dummy.position.set(m.pos[0], m.pos[1], m.pos[2]);
      dummy.scale.set(m.scale[0], m.scale[1], m.scale[2]);
      dummy.updateMatrix();
      peakBody.setMatrixAt(i, dummy.matrix);
      color.set(m.color);
      peakBody.setColorAt(i, color);
    }

    peakBody.instanceMatrix.needsUpdate = true;
    peakFoothill.instanceMatrix.needsUpdate = true;
    if (peakBody.instanceColor) peakBody.instanceColor.needsUpdate = true;
    if (peakFoothill.instanceColor) peakFoothill.instanceColor.needsUpdate = true;

    if (snowCap) {
      let snowIdx = 0;
      for (let i = 0; i < MOUNTAIN_DATA.length; i++) {
        const m = MOUNTAIN_DATA[i];
        if (!m?.hasSnow) continue;
        const snowJitter = SNOW_JITTERS[i] ?? 1;
        const snowRatio = SNOW_CAP_RATIO * snowJitter;
        dummy.position.set(m.pos[0], m.pos[1] + m.scale[1] * (0.5 - snowRatio * 0.25), m.pos[2]);
        dummy.scale.set(m.scale[0] * snowRatio, m.scale[1] * snowRatio, m.scale[2] * snowRatio);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        snowCap.setMatrixAt(snowIdx, dummy.matrix);
        snowIdx++;
      }
      snowCap.instanceMatrix.needsUpdate = true;
    }

    for (let i = 0; i < SECONDARY_PEAKS.length; i++) {
      const sp = SECONDARY_PEAKS[i];
      if (!sp) continue;

      dummy.position.set(sp.pos[0], sp.pos[1] - sp.scale[1] * 0.35, sp.pos[2]);
      dummy.scale.set(sp.scale[0] * 1.4, sp.scale[1] * 0.15, sp.scale[2] * 1.4);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      secFoothill.setMatrixAt(i, dummy.matrix);
      const sfColor = SECONDARY_FOOTHILL_COLORS[i];
      if (sfColor) secFoothill.setColorAt(i, sfColor);

      dummy.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);
      dummy.scale.set(sp.scale[0], sp.scale[1], sp.scale[2]);
      dummy.updateMatrix();
      secBody.setMatrixAt(i, dummy.matrix);
      color.set(sp.color);
      secBody.setColorAt(i, color);
    }

    secBody.instanceMatrix.needsUpdate = true;
    secFoothill.instanceMatrix.needsUpdate = true;
    if (secBody.instanceColor) secBody.instanceColor.needsUpdate = true;
    if (secFoothill.instanceColor) secFoothill.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={peakFoothillRef} args={[undefined, undefined, MOUNTAIN_DATA.length]}>
        <coneGeometry args={[1, 1, MOUNTAIN_SEGMENTS]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={peakBodyRef} args={[undefined, undefined, MOUNTAIN_DATA.length]}>
        <coneGeometry args={[1, 1, MOUNTAIN_SEGMENTS]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} />
      </instancedMesh>
      {SNOW_MOUNTAINS.length > 0 && (
        <instancedMesh ref={snowCapRef} args={[undefined, undefined, SNOW_MOUNTAINS.length]}>
          <coneGeometry args={[1, 1, MOUNTAIN_SEGMENTS]} />
          <meshStandardMaterial color="#f0f5fa" roughness={0.55} />
        </instancedMesh>
      )}
      <instancedMesh ref={secFoothillRef} args={[undefined, undefined, SECONDARY_PEAKS.length]}>
        <coneGeometry args={[1, 1, SECONDARY_SEGMENTS]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={secBodyRef} args={[undefined, undefined, SECONDARY_PEAKS.length]}>
        <coneGeometry args={[1, 1, SECONDARY_SEGMENTS]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
    </group>
  );
}
