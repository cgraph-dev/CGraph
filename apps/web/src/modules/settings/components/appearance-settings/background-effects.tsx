/**
 * Background Effects Section
 *
 * Shader effects and intensity settings.
 */

import { SparklesIcon } from '@heroicons/react/24/outline';

import { SectionHeader } from './section-header';

// =============================================================================
// TYPES
// =============================================================================

type BackgroundEffect = 'none' | 'shader' | 'matrix3d';
type ShaderVariant = 'matrix' | 'fluid' | 'particles' | 'waves' | 'neural';

interface BackgroundEffectsProps {
  /** Current background effect */
  backgroundEffect: BackgroundEffect;
  /** Current shader variant */
  shaderVariant: ShaderVariant;
  /** Current intensity */
  backgroundIntensity: number;
  /** Callback to update settings */
  updateSettings: (settings: {
    backgroundEffect?: BackgroundEffect;
    shaderVariant?: ShaderVariant;
    backgroundIntensity?: number;
  }) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const EFFECT_OPTIONS: BackgroundEffect[] = ['none', 'shader'];
const SHADER_VARIANTS: ShaderVariant[] = ['matrix', 'fluid', 'particles', 'waves', 'neural'];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Background Effects component.
 */
export function BackgroundEffects({
  backgroundEffect,
  shaderVariant,
  backgroundIntensity,
  updateSettings,
}: BackgroundEffectsProps) {
  return (
    <section>
      <SectionHeader
        icon={<SparklesIcon className="h-5 w-5" />}
        title="Background Effects"
        description="Add dynamic visual effects to the app background"
      />

      <div className="space-y-4">
        {/* Effect Type */}
        <div className="grid grid-cols-3 gap-3">
          {EFFECT_OPTIONS.map((effect) => (
            <button
              key={effect}
              onClick={() => updateSettings({ backgroundEffect: effect })}
              className={`rounded-lg border p-3 capitalize transition-all ${
                backgroundEffect === effect
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-white/[0.08] bg-white/[0.06] text-gray-400 hover:border-dark-500'
              } `}
            >
              {effect === 'none' ? 'Off' : 'Shader Effects'}
            </button>
          ))}
        </div>

        {/* Shader Variant */}
        {backgroundEffect === 'shader' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Effect Style</label>
            <div className="grid grid-cols-5 gap-2">
              {SHADER_VARIANTS.map((variant) => (
                <button
                  key={variant}
                  onClick={() => updateSettings({ shaderVariant: variant })}
                  className={`rounded-lg border px-3 py-2 text-xs capitalize transition-all ${
                    shaderVariant === variant
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.06] text-gray-400 hover:border-dark-500'
                  } `}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Intensity Slider */}
        {backgroundEffect !== 'none' && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-300">Intensity</label>
              <span className="text-sm text-gray-400">
                {Math.round((backgroundIntensity || 0.6) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={backgroundIntensity || 0.6}
              onChange={(e) => updateSettings({ backgroundIntensity: parseFloat(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/[0.08] accent-primary-500"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default BackgroundEffects;
