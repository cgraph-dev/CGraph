import { useThemeStore } from '@/stores/theme';
import { EFFECT_PRESETS } from './constants';
import type { AnimationSpeedOption } from './types';

export function EffectsTab() {
  const {
    theme,
    setEffect,
    setAnimationSpeed,
    toggleParticles,
    toggleGlow,
    toggleBlur,
    toggleAnimatedBackground,
  } = useThemeStore();

  return (
    <div className="space-y-6">
      {/* Effect Style */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Effect Style</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {EFFECT_PRESETS.map((effect) => (
            <button
              key={effect.type}
              onClick={() => setEffect(effect.type)}
              className={`rounded-lg border p-3 transition-all ${
                theme.effectPreset === effect.type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              {effect.name}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Speed */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Animation Speed</h3>
        <div className="flex gap-3">
          {(['slow', 'normal', 'fast'] as const).map((speed: AnimationSpeedOption) => (
            <button
              key={speed}
              onClick={() => setAnimationSpeed(speed)}
              className={`flex-1 rounded-lg border px-4 py-2 capitalize transition-all ${
                theme.animationSpeed === speed
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Effects */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Visual Effects</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Particles</div>
              <div className="text-xs text-gray-400">Animated particle effects</div>
            </div>
            <input
              type="checkbox"
              checked={theme.particlesEnabled}
              onChange={toggleParticles}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Glow</div>
              <div className="text-xs text-gray-400">Glowing borders and effects</div>
            </div>
            <input
              type="checkbox"
              checked={theme.glowEnabled}
              onChange={toggleGlow}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Blur</div>
              <div className="text-xs text-gray-400">Backdrop blur effects</div>
            </div>
            <input
              type="checkbox"
              checked={theme.blurEnabled ?? false}
              onChange={toggleBlur}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Animated Background</div>
              <div className="text-xs text-gray-400">Moving gradient backgrounds</div>
            </div>
            <input
              type="checkbox"
              checked={theme.animatedBackground ?? false}
              onChange={toggleAnimatedBackground}
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
