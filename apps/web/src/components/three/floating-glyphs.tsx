/**
 * Floating Glyphs — animated plane mesh glyphs for Matrix 3D environment.
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { THEMES, MATRIX_CHARS, type ThemeName } from './matrix-theme';

export function FloatingGlyphs({ theme = 'matrix-green' }: { theme: ThemeName }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.position.y = Math.sin(state.clock.elapsedTime + i) * 2;
      child.rotation.y = state.clock.elapsedTime * 0.5 + i;
    });
  });

  const glyphs = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * viewport.width,
        (Math.random() - 0.5) * viewport.height,
        (Math.random() - 0.5) * 10
      ),
      char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] ?? '0',
    }));
  }, [viewport]);

  return (
    <group ref={groupRef}>
      {glyphs.map((glyph, i) => (
        <mesh key={i} position={glyph.position}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial
            color={THEMES[theme].glow}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
