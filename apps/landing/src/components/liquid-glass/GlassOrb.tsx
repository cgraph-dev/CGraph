/**
 * GlassOrb — Three.js 3D liquid glass sphere for the hero section.
 *
 * Uses @react-three/fiber + @react-three/drei for a refractive glass orb
 * with iridescent glow on a pearl-white background.
 */
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ── Inner glass sphere ──────────────────────────────────────────────────── */
function Sphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={meshRef} scale={2.2}>
        <icosahedronGeometry args={[1, 12]} />
        <MeshTransmissionMaterial
          backside
          thickness={0.6}
          chromaticAberration={0.3}
          anisotropy={0.2}
          roughness={0.05}
          ior={1.5}
          color="#f0f0ff"
          distortion={0.4}
          distortionScale={0.5}
          temporalDistortion={0.15}
        />
      </mesh>
    </Float>
  );
}

/* ── Iridescent accent rings ─────────────────────────────────────────────── */
function AccentRing({ color, radius, speed }: { color: string; radius: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.6) * 0.3;
  });

  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[radius, 0.015, 16, 100]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.35}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

/* ── Export: full 3D scene ────────────────────────────────────────────────── */
export function GlassOrb() {
  const rings = useMemo(
    () => [
      { color: '#93C5FD', radius: 2.8, speed: 0.2 },
      { color: '#C4B5FD', radius: 3.1, speed: -0.15 },
      { color: '#F9A8D4', radius: 3.4, speed: 0.1 },
    ],
    []
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, 2, 4]} intensity={0.5} color="#93C5FD" />
      <pointLight position={[3, -2, 4]} intensity={0.5} color="#C4B5FD" />

      <Sphere />
      {rings.map((r, i) => (
        <AccentRing key={i} {...r} />
      ))}

      <Environment preset="city" />
    </Canvas>
  );
}
