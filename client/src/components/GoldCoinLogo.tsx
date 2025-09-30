// GoldCoinLogo.tsx
import React, { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type { Mesh, Texture } from "three";
import { MeshStandardMaterial } from "three";

function CoinModel() {
  const meshRef = useRef<Mesh>(null!);

  // ensure the image exists at public/coin/my-coin-face.png
  const faceTexture = useTexture("/coin/my-coin-face.png") as Texture;

  const { edgeMaterial, faceMaterial } = useMemo(() => {
    const edge = new MeshStandardMaterial({
      color: "#FFD700",
      metalness: 0.85,
      roughness: 0.25,
    });
    const face = new MeshStandardMaterial({
      map: faceTexture,
      metalness: 0.85,
      roughness: 0.25,
    });
    return { edgeMaterial: edge, faceMaterial: face };
  }, [faceTexture]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = Math.PI / 8;     // slight tilt so Y spin is visible
    meshRef.current.rotation.y += delta * 2.0;    // *** Y-axis spin ***
  });

  // material order for cylinder: [side, top cap, bottom cap]
  return (
    <mesh ref={meshRef} material={[edgeMaterial, faceMaterial, faceMaterial]}>
      <cylinderGeometry args={[1.5, 1.5, 0.22, 64]} />
    </mesh>
  );
}

export default function GoldCoinLogo() {
  return (
    <div style={{ width: 320, height: 320 }}>
      <Canvas frameloop="always" camera={{ fov: 30, position: [0, 0, 8] }}>
        <ambientLight intensity={1.1} />
        <pointLight position={[5, 5, 5]} intensity={60} />
        <Suspense fallback={null}>
          <CoinModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
