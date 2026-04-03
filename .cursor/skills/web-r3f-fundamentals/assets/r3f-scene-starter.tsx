import * as THREE from "three";
import { Canvas, ThreeElements, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

function CourseMarker(props: ThreeElements["mesh"]) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);

  useFrame((_, delta) => {
    meshRef.current.rotation.x += delta * 0.4;
    meshRef.current.rotation.y += delta * 0.7;
  });

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={selected ? 1.25 : 1}
      onClick={() => setSelected((current) => !current)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "#f97316" : "#2563eb"} />
    </mesh>
  );
}

function RaceSceneContent() {
  return (
    <>
      <color attach="background" args={["#dbeafe"]} />
      <ambientLight intensity={Math.PI / 3} />
      <directionalLight position={[6, 8, 4]} intensity={Math.PI} />
      <pointLight position={[-4, 3, -3]} intensity={Math.PI / 2} />

      <group position={[0, -0.75, 0]}>
        <mesh receiveShadow rotation-x={-Math.PI / 2}>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial color="#d9f99d" />
        </mesh>
      </group>

      <CourseMarker position={[-1.4, 0.4, 0]} />
      <CourseMarker position={[1.4, 0.4, 0]} />
    </>
  );
}

export function RaceSceneCanvas() {
  return (
    <Canvas camera={{ fov: 45, position: [0, 2.5, 6] }}>
      <RaceSceneContent />
    </Canvas>
  );
}
