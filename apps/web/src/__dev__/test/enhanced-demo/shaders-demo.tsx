/**
 * Shaders Demo Section
 */

import { useState } from 'react';
import ShaderBackground from '@/components/shaders/shader-background';

/**
 * unknown.
 */
/**
 * Shaders Demo component.
 */
export function ShadersDemo() {
  const [variant, setVariant] = useState<'fluid' | 'particles' | 'waves' | 'neural' | 'matrix'>(
    'fluid'
  );

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">WebGL Shader Backgrounds</h2>
      <p className="mb-4 text-gray-400">
        High-performance animated backgrounds using custom GLSL shaders
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['fluid', 'particles', 'waves', 'neural', 'matrix'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded-lg px-4 py-2 capitalize ${
              variant === v
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10">
        <ShaderBackground
          variant={variant}
          color1="#00ff41"
          color2="#003b00"
          color3="#39ff14"
          speed={1}
          intensity={1}
          interactive
          className="!relative"
        />
      </div>
    </div>
  );
}
