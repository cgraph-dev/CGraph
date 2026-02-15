/**
 * Matrix Rain — instanced mesh rain effect for Matrix 3D environment.
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { THEMES, MATRIX_CHARS, type ThemeName } from './matrix-theme';

interface MatrixColumn {
  position: THREE.Vector3;
  speed: number;
  characters: string[];
  brightness: number;
}

export function MatrixRain({
  theme = 'matrix-green',
  intensity = 'medium',
}: {
  theme: ThemeName;
  intensity: 'low' | 'medium' | 'high';
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  const columnCount = useMemo(() => ({ low: 50, medium: 100, high: 200 })[intensity], [intensity]);

  const columns = useMemo<MatrixColumn[]>(() => {
    return Array.from({ length: columnCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * viewport.width * 1.5,
        (Math.random() - 0.5) * viewport.height * 2,
        (Math.random() - 0.5) * 20
      ),
      speed: 0.05 + Math.random() * 0.15,
      characters: Array.from(
        { length: 20 },
        () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] ?? '0'
      ),
      brightness: Math.random(),
    }));
  }, [columnCount, viewport]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const colors = meshRef.current.geometry.attributes.color;
    if (!colors) return;
    const themeColors = THEMES[theme];

    columns.forEach((column, i) => {
      column.position.y -= column.speed;
      if (column.position.y < -viewport.height) {
        column.position.y = viewport.height;
        column.position.x = (Math.random() - 0.5) * viewport.width * 1.5;
        column.brightness = Math.random();
      }

      tempObject.position.copy(column.position);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);

      const brightness =
        column.brightness * (1 - (column.position.y + viewport.height) / (viewport.height * 2));
      tempColor.lerpColors(themeColors.secondary, themeColors.primary, brightness);
      colors.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    colors.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, columnCount]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
