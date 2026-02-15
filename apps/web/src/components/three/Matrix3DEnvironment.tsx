/**
 * Matrix 3D Environment
 *
 * Immersive 3D Matrix environment using Three.js and React Three Fiber.
 * Features volumetric rain, particle systems, and post-processing effects.
 *
 * Sub-components extracted to sibling files:
 * - MatrixRain.tsx — instanced mesh rain
 * - ParticleField.tsx — ambient point cloud
 * - FloatingGlyphs.tsx — floating plane mesh glyphs
 * - matrix-theme.ts — theme configs and character sets
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { THEMES, type ThemeName } from './matrix-theme';
import { MatrixRain } from './MatrixRain';
import { ParticleField } from './ParticleField';
import { FloatingGlyphs } from './FloatingGlyphs';

// =============================================================================
// TYPES
// =============================================================================

export interface Matrix3DEnvironmentProps {
  intensity?: 'low' | 'medium' | 'high';
  theme?: ThemeName;
  interactive?: boolean;
  className?: string;
}

// =============================================================================
// SCENE COMPONENT
// =============================================================================

function Scene({
  theme,
  intensity,
  interactive,
}: {
  theme: ThemeName;
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
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

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
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.8} />
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
