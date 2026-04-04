import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { Vector3, TextureLoader, SRGBColorSpace, Color } from "three";
import type { Character as CharacterType } from "@/features/mountain-race/types";
import { getTrackPointTo, getTrackSurfaceY, getTrackTangentTo } from "./Track";

const _lookTarget = new Vector3();
const _trackPoint = new Vector3();
const _trackTangent = new Vector3();
const CHARACTER_FOOT_CLEARANCE = 0.05;

interface CharacterProps {
  character: CharacterType;
  isFinished: boolean;
  index: number;
}

export function Character({ character, isFinished, index }: CharacterProps) {
  const groupRef = useRef<Group>(null);
  const bellyRef = useRef<Mesh>(null);
  const phaseRef = useRef(0);

  const { color, status, name, progress, faceImage } = character;
  const canAnimate = status !== "stunned" && !isFinished;
  const animSpeed = getAnimationSpeed(status);
  const showVest = index % 3 === 2;

  const backpackColor = useMemo(() => {
    const c = new Color(color.jacket);
    c.multiplyScalar(0.6);
    return `#${c.getHexString()}`;
  }, [color.jacket]);

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

    // Belly emissive effect
    const belly = bellyRef.current;
    if (belly) {
      const mat = belly.material as import("three").MeshStandardMaterial;
      if (status === "stunned") {
        const blink = (Math.sin(phaseRef.current * 4) + 1) * 0.5;
        mat.emissive.set("#FF0000");
        mat.emissiveIntensity = blink * 0.8;
      } else if (status === "boosted") {
        mat.emissive.set("#FF6600");
        mat.emissiveIntensity = 0.5;
      } else {
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0;
      }
    }
  });

  const tiltZ = status === "stunned" ? 0.4 : status === "sliding" ? 0.25 : 0;

  return (
    <group ref={groupRef} rotation={[0, 0, tiltZ]}>
      <NameLabel name={name} />
      <Hat color={color.hat} />
      <Head faceImage={faceImage} />
      <Buff color={color.buff} />
      <Torso color={color.jacket} />
      <Zipper />
      <Belly ref={bellyRef} color={color.jacket} />
      {showVest && <Vest color={color.inner} />}
      <Backpack color={backpackColor} />
      <BackpackStraps />
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

function NameLabel({ name }: { name: string }) {
  return (
    <Html position={[0, 2.4, 0]} center distanceFactor={15} style={{ pointerEvents: "none" }}>
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        {name}
      </div>
    </Html>
  );
}

function Hat({ color }: { color: string }) {
  return (
    <group position={[0, 1.85, 0]}>
      {/* dome (hemisphere) */}
      <mesh>
        <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* brim */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* visor */}
      <mesh position={[0, -0.02, 0.18]}>
        <boxGeometry args={[0.22, 0.03, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Head({ faceImage }: { faceImage: string | null }) {
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
        <meshStandardMaterial color="#FFDBAC" roughness={0.6} />
      </mesh>
      {texture ? (
        <group position={[0, 0.02, 0.26]}>
          <mesh>
            <circleGeometry args={[0.2, 24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <circleGeometry args={[0.17, 24]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        </group>
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

function Torso({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.95, 0]}>
      <capsuleGeometry args={[0.2, 0.35, 6, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Zipper() {
  return (
    <mesh position={[0, 0.95, 0.17]}>
      <boxGeometry args={[0.03, 0.4, 0.02]} />
      <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
    </mesh>
  );
}

import { forwardRef } from "react";

const Belly = forwardRef<Mesh, { color: string }>(function Belly({ color }, ref) {
  return (
    <mesh ref={ref} position={[0, 0.75, 0.12]}>
      <sphereGeometry args={[0.18, 8, 6]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
});

function Vest({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.95, 0.02]}>
      <boxGeometry args={[0.46, 0.45, 0.28]} />
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

function BackpackStraps() {
  return (
    <group>
      <mesh position={[-0.1, 0.98, -0.12]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.04, 0.35, 0.02]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[0.1, 0.98, -0.12]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.04, 0.35, 0.02]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </group>
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
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.08, 0.05]}>
          <boxGeometry args={[0.17, 0.12, 0.24]} />
          <meshStandardMaterial color="#553311" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightRef} position={[0.13, 0.36, 0.02]}>
        <mesh position={[0, 0.12, 0]}>
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.08, 0.05]}>
          <boxGeometry args={[0.17, 0.12, 0.24]} />
          <meshStandardMaterial color="#553311" roughness={0.9} />
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
          <capsuleGeometry args={[0.05, 0.35, 4, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group ref={rightRef} position={[0.34, 0.95, 0]}>
        <mesh>
          <capsuleGeometry args={[0.05, 0.35, 4, 6]} />
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
        {/* shaft */}
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 4]} />
          <meshStandardMaterial color="#AAAAAA" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* grip */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.025, 0.02, 0.15, 6]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightRef} position={[0.38, 0.75, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 4]} />
          <meshStandardMaterial color="#AAAAAA" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.025, 0.02, 0.15, 6]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
      </group>
    </>
  );
}
