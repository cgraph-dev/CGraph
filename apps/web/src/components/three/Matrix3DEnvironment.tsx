/**
 * Matrix 3D Environment
 *
 * Immersive 3D Matrix environment using Three.js and React Three Fiber.
 * Features volumetric rain, particle systems, and post-processing effects.
 *
 * @version 1.0.0
 * @since v0.7.33
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

// =============================================================================
// TYPES
// =============================================================================

export interface Matrix3DEnvironmentProps {
  intensity?: 'low' | 'medium' | 'high';
  theme?: 'matrix-green' | 'cyber-blue' | 'purple-haze' | 'amber-glow';
  interactive?: boolean;
  className?: string;
}

interface MatrixColumn {
  position: THREE.Vector3;
  speed: number;
  characters: string[];
  brightness: number;
}

// =============================================================================
// THEME CONFIGURATIONS
// =============================================================================

const THEMES = {
  'matrix-green': {
    primary: new THREE.Color(0x00ff41),
    secondary: new THREE.Color(0x003b00),
    glow: new THREE.Color(0x39ff14),
  },
  'cyber-blue': {
    primary: new THREE.Color(0x00d4ff),
    secondary: new THREE.Color(0x001a33),
    glow: new THREE.Color(0x00ffff),
  },
  'purple-haze': {
    primary: new THREE.Color(0xb794f6),
    secondary: new THREE.Color(0x2d1b4e),
    glow: new THREE.Color(0xe9d5ff),
  },
  'amber-glow': {
    primary: new THREE.Color(0xfbbf24),
    secondary: new THREE.Color(0x451a03),
    glow: new THREE.Color(0xfde68a),
  },
};

// Matrix characters (Katakana + symbols)
const MATRIX_CHARS = [
  ...'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ'.split(''),
  ...'01'.split(''),
  ...':・."=*+-<>¦|ｯﾞ'.split(''),
];

// =============================================================================
// MATRIX RAIN COMPONENT
// =============================================================================

function MatrixRain({
  theme = 'matrix-green',
  intensity = 'medium',
}: {
  theme: keyof typeof THEMES;
  intensity: 'low' | 'medium' | 'high';
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  // Column configuration based on intensity
  const columnCount = useMemo(() => {
    return {
      low: 50,
      medium: 100,
      high: 200,
    }[intensity];
  }, [intensity]);

  // Initialize columns
  const columns = useMemo<MatrixColumn[]>(() => {
    return Array.from({ length: columnCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * viewport.width * 1.5,
        (Math.random() - 0.5) * viewport.height * 2,
        (Math.random() - 0.5) * 20
      ),
      speed: 0.05 + Math.random() * 0.15,
      characters: Array.from({ length: 20 }, () =>
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] ?? '0'
      ),
      brightness: Math.random(),
    }));
  }, [columnCount, viewport]);

  // Temp object for matrix calculations
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Animation loop
  useFrame(() => {
    if (!meshRef.current) return;

    const colors = meshRef.current.geometry.attributes.color;
    if (!colors) return;
    
    const themeColors = THEMES[theme];

    columns.forEach((column, i) => {
      // Update position
      column.position.y -= column.speed;

      // Reset when column goes off screen
      if (column.position.y < -viewport.height) {
        column.position.y = viewport.height;
        column.position.x = (Math.random() - 0.5) * viewport.width * 1.5;
        column.brightness = Math.random();
      }

      // Set instance transform
      tempObject.position.copy(column.position);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);

      // Animate color (bright to dim)
      const brightness = column.brightness * (1 - (column.position.y + viewport.height) / (viewport.height * 2));
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

// =============================================================================
// PARTICLE FIELD
// =============================================================================

function ParticleField({
  theme = 'matrix-green',
  count = 1000,
}: {
  theme: keyof typeof THEMES;
  count?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const themeColors = THEMES[theme];

    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // Color
      const color = new THREE.Color().lerpColors(
        themeColors.secondary,
        themeColors.primary,
        Math.random()
      );
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, [count, theme]);

  // Gentle rotation
  useFrame((_state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// =============================================================================
// FLOATING GLYPHS
// =============================================================================

function FloatingGlyphs({
  theme = 'matrix-green',
}: {
  theme: keyof typeof THEMES;
}) {
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

// =============================================================================
// SCENE COMPONENT
// =============================================================================

function Scene({
  theme,
  intensity,
  interactive,
}: {
  theme: keyof typeof THEMES;
  intensity: 'low' | 'medium' | 'high';
  interactive: boolean;
}) {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color={THEMES[theme].glow} />

      {/* Matrix rain */}
      <MatrixRain theme={theme} intensity={intensity} />

      {/* Particle field */}
      {intensity !== 'low' && <ParticleField theme={theme} count={500} />}

      {/* Floating glyphs */}
      {intensity === 'high' && <FloatingGlyphs theme={theme} />}

      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Camera controls */}
      {interactive && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      )}

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
        />
        <ChromaticAberration offset={[0.001, 0.001]} />
      </EffectComposer>
    </>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Matrix3DEnvironment({
  intensity = 'medium',
  theme = 'matrix-green',
  interactive = false,
  className = '',
}: Matrix3DEnvironmentProps) {
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 50]} />

        <Scene theme={theme} intensity={intensity} interactive={interactive} />
      </Canvas>
    </div>
  );
}

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

export function Matrix3DLowProfile({ className }: { className?: string }) {
  return (
    <Matrix3DEnvironment
      intensity="low"
      theme="matrix-green"
      interactive={false}
      className={className}
    />
  );
}

export function Matrix3DCyberBlue({ className }: { className?: string }) {
  return (
    <Matrix3DEnvironment
      intensity="high"
      theme="cyber-blue"
      interactive={true}
      className={className}
    />
  );
}
