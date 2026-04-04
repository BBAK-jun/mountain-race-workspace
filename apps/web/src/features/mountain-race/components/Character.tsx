import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { Vector3, TextureLoader, SRGBColorSpace } from "three";
import type { Character as CharacterType } from "@/features/mountain-race/types";
import { getTrackPointTo, getTrackSurfaceY, getTrackTangentTo } from "./Track";

const _lookTarget = new Vector3();
const _trackPoint = new Vector3();
const _trackTangent = new Vector3();
const CHARACTER_FOOT_CLEARANCE = 0.05;

interface CharacterProps {
  character: CharacterType;
  isFinished: boolean;
}

export function Character({ character, isFinished }: CharacterProps) {
  const groupRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  const { color, status, name, progress, faceImage } = character;
  const canAnimate = status !== "stunned" && !isFinished;
  const animSpeed = getAnimationSpeed(status);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const pos = getTrackPointTo(progress, _trackPoint);
    const tangent = getTrackTangentTo(progress, _trackTangent);
    const groundY = getTrackSurfaceY(progress);

    group.position.x += (pos.x - group.position.x) * 0.15;
    group.position.z += (pos.z - group.position.z) * 0.15;
    _lookTarget.copy(group.position).add(tangent);
    group.lookAt(_lookTarget);

    if (canAnimate) {
      phaseRef.current += delta * 8 * animSpeed;
    }

    const targetY = groundY + CHARACTER_FOOT_CLEARANCE;
    group.position.y += (targetY - group.position.y) * 0.2;
  });

  const emissive = statusEmissive(status);
  const tiltZ = status === "stunned" ? 0.4 : status === "sliding" ? 0.25 : 0;

  return (
    <group ref={groupRef} rotation={[0, 0, tiltZ]}>
      <NameLabel name={name} />
      <Hat color={color.buff} />
      <Head emissive={emissive} faceImage={faceImage} />
      <Buff color={color.buff} />
      <Torso color={color.jacket} emissive={emissive} />
      <Belly color={color.inner} />
      <Backpack color={color.jacket} />
      <ArmPair color={color.jacket} canAnimate={canAnimate} animSpeed={animSpeed} />
      <LegPair color={color.pants} canAnimate={canAnimate} animSpeed={animSpeed} />
      <TrekkingPoles canAnimate={canAnimate} animSpeed={animSpeed} />
    </group>
  );
}

function getAnimationSpeed(status: CharacterType["status"]): number {
  switch (status) {
    case "boosted":
      return 1.3;
    case "slowed":
      return 0.5;
    case "sliding":
      return 0.4;
    case "stunned":
      return 0;
    default:
      return 1;
  }
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

function Head({
  emissive,
  faceImage,
}: {
  emissive: { color: string; intensity: number };
  faceImage: string | null;
}) {
  const texture = useMemo(() => {
    if (!faceImage?.startsWith("data:image/")) return null;
    const tex = new TextureLoader().load(faceImage);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [faceImage]);

  return (
    <group position={[0, 1.55, 0]}>
      <mesh>
        <sphereGeometry args={[0.25, 12, 10]} />
        <meshStandardMaterial
          color="#ffe0bd"
          emissive={emissive.color}
          emissiveIntensity={emissive.intensity}
        />
      </mesh>
      {texture ? (
        <mesh position={[0, 0, 0.22]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.18, 24]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      ) : null}
    </group>
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

function LegPair({
  color,
  canAnimate,
  animSpeed,
}: {
  color: string;
  canAnimate: boolean;
  animSpeed: number;
}) {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!canAnimate) return;
    phaseRef.current += delta * 7 * animSpeed;
    const swing = Math.sin(phaseRef.current) * 0.33 * animSpeed;
    if (leftRef.current) leftRef.current.rotation.x = -swing;
    if (rightRef.current) rightRef.current.rotation.x = swing;
  });

  return (
    <>
      <group ref={leftRef} position={[-0.13, 0.36, 0.02]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.16, 0.34, 0.16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.08, 0.05]}>
          <boxGeometry args={[0.17, 0.12, 0.24]} />
          <meshStandardMaterial color="#5C4033" />
        </mesh>
      </group>
      <group ref={rightRef} position={[0.13, 0.36, 0.02]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.16, 0.34, 0.16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.08, 0.05]}>
          <boxGeometry args={[0.17, 0.12, 0.24]} />
          <meshStandardMaterial color="#5C4033" />
        </mesh>
      </group>
    </>
  );
}

function ArmPair({
  color,
  canAnimate,
  animSpeed,
}: {
  color: string;
  canAnimate: boolean;
  animSpeed: number;
}) {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!canAnimate) return;
    phaseRef.current += delta * 6 * animSpeed;
    const swing = Math.sin(phaseRef.current) * 0.5 * animSpeed;
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

function TrekkingPoles({ canAnimate, animSpeed }: { canAnimate: boolean; animSpeed: number }) {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!canAnimate) return;
    phaseRef.current += delta * 6 * animSpeed;
    const swing = Math.sin(phaseRef.current) * 0.3 * animSpeed;
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
