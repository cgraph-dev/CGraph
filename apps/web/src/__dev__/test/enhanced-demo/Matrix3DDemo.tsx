/**
 * Matrix 3D Demo Section
 */

import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import Matrix3DEnvironment from '@/components/three/Matrix3DEnvironment';

export function Matrix3DDemo() {
  const [theme, setTheme] = useState<'matrix-green' | 'cyber-blue' | 'purple-haze' | 'amber-glow'>(
    'matrix-green'
  );
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Matrix 3D Environment</h2>
      <p className="mb-4 text-gray-400">
        Immersive Three.js environment with post-processing effects
      </p>

      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          className="rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-white"
        >
          <option value="matrix-green">Matrix Green</option>
          <option value="cyber-blue">Cyber Blue</option>
          <option value="purple-haze">Purple Haze</option>
          <option value="amber-glow">Amber Glow</option>
        </select>

        <select
          value={intensity}
          onChange={(e) => setIntensity(e.target.value as typeof intensity)}
          className="rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-white"
        >
          <option value="low">Low (50 columns)</option>
          <option value="medium">Medium (100 columns)</option>
          <option value="high">High (200 columns)</option>
        </select>
      </div>

      <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10">
        <Matrix3DEnvironment
          theme={theme}
          intensity={intensity}
          interactive
          className="!relative !z-0"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <GlassCard variant="frosted" className="pointer-events-auto">
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-white">Embedded Content</h3>
              <p className="mt-2 text-gray-400">UI overlays the 3D scene</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
