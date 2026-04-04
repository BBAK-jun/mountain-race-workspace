import type { GlobalEventType } from "@/features/mountain-race/types";

interface EnvironmentProps {
  activeGlobalEvent: GlobalEventType | null;
}

export function Environment({ activeGlobalEvent }: EnvironmentProps) {
  const isFoggy = activeGlobalEvent === "fog";

  return (
    <group>
      <Ground />
      <Mountains />
      <Trees />
      <Clouds />
      {isFoggy && <fog attach="fog" args={["#c8d6e5", 10, 60]} />}
      {!isFoggy && <fog attach="fog" args={["#e8ecf1", 40, 200]} />}
      <ambientLight intensity={0.4} />
      <directionalLight position={[20, 50, 30]} intensity={1.0} />
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -60]}>
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial color="#4a7c59" roughness={1} />
    </mesh>
  );
}

const MOUNTAIN_DATA = [
  { id: "mt-a", pos: [30, 8, -40] as const, scale: [12, 18, 12] as const, color: "#6b7b8d" },
  { id: "mt-b", pos: [-25, 6, -30] as const, scale: [10, 14, 10] as const, color: "#7a8a9a" },
  { id: "mt-c", pos: [15, 10, -90] as const, scale: [15, 22, 15] as const, color: "#5c6c7c" },
  { id: "mt-d", pos: [-35, 12, -100] as const, scale: [18, 26, 18] as const, color: "#6b7b8d" },
  { id: "mt-e", pos: [40, 14, -120] as const, scale: [20, 30, 20] as const, color: "#5c6c7c" },
  { id: "mt-f", pos: [-20, 9, -70] as const, scale: [14, 20, 14] as const, color: "#7a8a9a" },
  { id: "mt-g", pos: [5, 16, -150] as const, scale: [22, 34, 22] as const, color: "#4e5e6e" },
  { id: "mt-h", pos: [-40, 11, -140] as const, scale: [16, 24, 16] as const, color: "#6b7b8d" },
];

function Mountains() {
  return (
    <group>
      {MOUNTAIN_DATA.map((m) => (
        <mesh
          key={m.id}
          position={[m.pos[0], m.pos[1], m.pos[2]]}
          scale={[m.scale[0], m.scale[1], m.scale[2]]}
        >
          <coneGeometry args={[1, 1, 6]} />
          <meshStandardMaterial color={m.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

const TREE_DATA = [
  { id: "tr-a", pos: [8, 0, -10] as const },
  { id: "tr-b", pos: [-6, 2, -15] as const },
  { id: "tr-c", pos: [14, 4, -35] as const },
  { id: "tr-d", pos: [-12, 6, -45] as const },
  { id: "tr-e", pos: [6, 10, -55] as const },
  { id: "tr-f", pos: [-8, 14, -75] as const },
  { id: "tr-g", pos: [12, 18, -85] as const },
  { id: "tr-h", pos: [-4, 22, -95] as const },
  { id: "tr-i", pos: [10, 28, -105] as const },
  { id: "tr-j", pos: [-10, 32, -115] as const },
];

function Trees() {
  return (
    <group>
      {TREE_DATA.map((t) => (
        <group key={t.id} position={[t.pos[0], t.pos[1], t.pos[2]]}>
          {/* trunk */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1.2, 5]} />
            <meshStandardMaterial color="#6b4226" />
          </mesh>
          {/* canopy */}
          <mesh position={[0, 1.6, 0]}>
            <coneGeometry args={[0.6, 1.4, 6]} />
            <meshStandardMaterial color="#2d6a4f" />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <coneGeometry args={[0.45, 1.0, 6]} />
            <meshStandardMaterial color="#40916c" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const CLOUD_DATA = [
  { id: "cl-a", pos: [15, 30, -30] as const },
  { id: "cl-b", pos: [-20, 35, -60] as const },
  { id: "cl-c", pos: [25, 32, -90] as const },
  { id: "cl-d", pos: [-15, 38, -120] as const },
  { id: "cl-e", pos: [10, 40, -150] as const },
];

function Clouds() {
  return (
    <group>
      {CLOUD_DATA.map((c) => (
        <group key={c.id} position={[c.pos[0], c.pos[1], c.pos[2]]}>
          <mesh>
            <sphereGeometry args={[2, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
          <mesh position={[1.8, -0.3, 0]}>
            <sphereGeometry args={[1.5, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <mesh position={[-1.5, -0.2, 0.5]}>
            <sphereGeometry args={[1.8, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
