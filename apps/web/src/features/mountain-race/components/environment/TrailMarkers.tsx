import { estimateTerrainY } from "./terrain";

const MARKER_CONFIGS = [
  { x: 2.8, z: -2 },
  { x: -3.2, z: -20 },
  { x: 4, z: -36 },
  { x: -3.5, z: -54 },
  { x: 3.8, z: -72 },
  { x: -3, z: -92 },
  { x: 2.5, z: -115 },
  { x: 1, z: -135 },
] as const;

const MARKER_POSITIONS: [number, number, number][] = MARKER_CONFIGS.map((m) => [
  m.x,
  estimateTerrainY(m.z, Math.abs(m.x)) + 0.1,
  m.z,
]);

export function TrailMarkers() {
  return (
    <group>
      {MARKER_CONFIGS.map((cfg, i) => {
        const markerPos = MARKER_POSITIONS[i];
        if (!markerPos) return null;
        return (
          <group key={`mk-${cfg.x}-${cfg.z}`} position={markerPos}>
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 1.2, 5]} />
              <meshStandardMaterial color="#9e7e56" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <boxGeometry args={[0.18, 0.12, 0.06]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? "#e74c3c" : i % 3 === 1 ? "#f39c12" : "#2ecc71"}
                emissive={i % 3 === 0 ? "#e74c3c" : i % 3 === 1 ? "#f39c12" : "#2ecc71"}
                emissiveIntensity={0.15}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
