import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { Vector3 } from "three";
import type { Character as CharacterType } from "@/features/mountain-race/types";
import { getTrackPoint, getTrackTangent } from "./Track";

const _lookTarget = new Vector3();

interface CharacterProps {
  character: CharacterType;
  isFinished: boolean;
}

export function Character({ character, isFinished }: CharacterProps) {
  const groupRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  const { color, status, name, progress } = character;
  const isMoving = (status === "running" || status === "boosted") && !isFinished;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const pos = getTrackPoint(progress);
    const tangent = getTrackTangent(progress);

    group.position.lerp(pos, 0.15);
    _lookTarget.copy(group.position).add(tangent);
    group.lookAt(_lookTarget);

    if (isMoving) {
      phaseRef.current += delta * 8;
      group.position.y += Math.abs(Math.sin(phaseRef.current)) * 0.15;
    }
  });

  const emissive = statusEmissive(status);
  const tiltZ = status === "stunned" ? 0.4 : status === "sliding" ? 0.25 : 0;

  return (
    <group ref={groupRef} rotation={[0, 0, tiltZ]}>
      <NameLabel name={name} />
      <Hat color={color.buff} />
      <Head emissive={emissive} />
      <Buff color={color.buff} />
      <Torso color={color.jacket} emissive={emissive} />
      <Belly color={color.inner} />
      <Backpack color={color.jacket} />
      <ArmPair color={color.jacket} isMoving={isMoving} />
      <Pants color={color.pants} />
      <Boots />
      <TrekkingPoles isMoving={isMoving} />
    </group>
  );
}

function statusEmissive(status: CharacterType["status"]): {
  color: string;
  intensity: number;
} {
  switch (status) {
    case "boosted":
      return { color: "#ffff00", intensity: 0.4 };
    case "stunned":
      return { color: "#ff0000", intensity: 0.4 };
    case "slowed":
      return { color: "#4444ff", intensity: 0.4 };
    case "sliding":
      return { color: "#00ccff", intensity: 0.4 };
    default:
      return { color: "#000000", intensity: 0 };
  }
}

function NameLabel({ name }: { name: string }) {
  return (
    <Html
      position={[0, 2.4, 0]}
      center
      distanceFactor={15}
      style={{
        color: "white",
        fontSize: "12px",
        fontWeight: 700,
        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {name}
    </Html>
  );
}

function Hat({ color }: { color: string }) {
  return (
    <group position={[0, 1.85, 0]}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.25, 0.18, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Head({ emissive }: { emissive: { color: string; intensity: number } }) {
  return (
    <mesh position={[0, 1.55, 0]}>
      <sphereGeometry args={[0.25, 12, 10]} />
      <meshStandardMaterial
        color="#ffe0bd"
        emissive={emissive.color}
        emissiveIntensity={emissive.intensity}
      />
    </mesh>
  );
}

function Buff({ color }: { color: string }) {
  return (
    <mesh position={[0, 1.3, 0]}>
      <cylinderGeometry args={[0.22, 0.26, 0.15, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Torso({
  color,
  emissive,
}: {
  color: string;
  emissive: { color: string; intensity: number };
}) {
  return (
    <mesh position={[0, 0.95, 0]}>
      <boxGeometry args={[0.5, 0.55, 0.3]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive.color}
        emissiveIntensity={emissive.intensity}
      />
    </mesh>
  );
}

function Belly({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.75, 0.12]}>
      <sphereGeometry args={[0.18, 8, 6]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Backpack({ color }: { color: string }) {
  return (
    <mesh position={[0, 1.0, -0.22]}>
      <boxGeometry args={[0.3, 0.35, 0.15]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function Pants({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.4, 0]}>
      <boxGeometry args={[0.45, 0.35, 0.28]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Boots() {
  return (
    <>
      <mesh position={[-0.12, 0.12, 0.04]}>
        <boxGeometry args={[0.16, 0.14, 0.22]} />
        <meshStandardMaterial color="#5C4033" />
      </mesh>
      <mesh position={[0.12, 0.12, 0.04]}>
        <boxGeometry args={[0.16, 0.14, 0.22]} />
        <meshStandardMaterial color="#5C4033" />
      </mesh>
    </>
  );
}

function ArmPair({ color, isMoving }: { color: string; isMoving: boolean }) {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!isMoving) return;
    phaseRef.current += delta * 6;
    const swing = Math.sin(phaseRef.current) * 0.5;
    if (leftRef.current) leftRef.current.rotation.x = swing;
    if (rightRef.current) rightRef.current.rotation.x = -swing;
  });

  return (
    <>
      <group ref={leftRef} position={[-0.34, 0.95, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, 0.45, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group ref={rightRef} position={[0.34, 0.95, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, 0.45, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </>
  );
}

function TrekkingPoles({ isMoving }: { isMoving: boolean }) {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!isMoving) return;
    phaseRef.current += delta * 6;
    const swing = Math.sin(phaseRef.current) * 0.3;
    if (leftRef.current) leftRef.current.rotation.x = -0.3 + swing;
    if (rightRef.current) rightRef.current.rotation.x = -0.3 - swing;
  });

  return (
    <>
      <group ref={leftRef} position={[-0.38, 0.75, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 4]} />
          <meshStandardMaterial color="#888888" metalness={0.6} />
        </mesh>
      </group>
      <group ref={rightRef} position={[0.38, 0.75, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 4]} />
          <meshStandardMaterial color="#888888" metalness={0.6} />
        </mesh>
      </group>
    </>
  );
}
