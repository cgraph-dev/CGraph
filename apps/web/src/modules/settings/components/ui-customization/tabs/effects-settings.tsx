/**
 * Effects Settings Tab Component
 * Allows users to customize glass effects, particle system, and visual effects
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import type { SettingsTabProps, UIPreferences } from './types';
import { SliderControl, Select, Toggle } from './controls';

const GLASS_EFFECTS = [
  { value: 'none' as const, label: 'None' },
  { value: 'default' as const, label: 'Default' },
  { value: 'frosted' as const, label: 'Frosted' },
  { value: 'crystal' as const, label: 'Crystal' },
  { value: 'neon' as const, label: 'Neon' },
  { value: 'holographic' as const, label: 'Holographic' },
  { value: 'matrix' as const, label: 'Matrix' },
];

export function EffectsSettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Glass Effect Style</h3>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-7">
          {GLASS_EFFECTS.map((effect) => (
            <motion.button
              key={effect.value}
              onClick={() => updatePreference('glassEffect', effect.value)}
              className={`rounded-lg border px-4 py-3 text-sm transition-all ${
                preferences.glassEffect === effect.value
                  ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                  : 'border-dark-600 bg-dark-700/50 text-gray-400 hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {effect.label}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Glass Properties</h3>
        <div className="space-y-6">
          <SliderControl
            label="Blur Intensity"
            value={preferences.glassBlur}
            onChange={(value) => updatePreference('glassBlur', value)}
            min={0}
            max={50}
            suffix="px"
          />
          <SliderControl
            label="Opacity"
            value={preferences.glassOpacity}
            onChange={(value) => updatePreference('glassOpacity', value)}
            min={0}
            max={100}
            suffix="%"
          />
          <SliderControl
            label="Border Width"
            value={preferences.glassBorderWidth}
            onChange={(value) => updatePreference('glassBorderWidth', value)}
            min={0}
            max={5}
            suffix="px"
          />
          <SliderControl
            label="Glow Intensity"
            value={preferences.glowIntensity}
            onChange={(value) => updatePreference('glowIntensity', value)}
            min={0}
            max={100}
            suffix="%"
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Particle System</h3>
        <div className="space-y-4">
          <Select
            label="Particle Density"
            value={preferences.particleSystem}
            onChange={
              (value) =>
                updatePreference('particleSystem', value as UIPreferences['particleSystem']) // safe downcast – runtime verified
            }
            options={[
              { value: 'none', label: 'Disabled' },
              { value: 'minimal', label: 'Minimal (Best Performance)' },
              { value: 'medium', label: 'Medium (Balanced)' },
              { value: 'heavy', label: 'Heavy (Beautiful)' },
              { value: 'extreme', label: 'Extreme (May Impact Performance)' },
            ]}
          />
          <Select
            label="Particle Color"
            value={preferences.particleColor}
            onChange={
              (value) => updatePreference('particleColor', value as UIPreferences['particleColor']) // safe downcast – runtime verified
            }
            options={[
              { value: 'primary', label: 'Primary Theme Color' },
              { value: 'rainbow', label: 'Rainbow' },
              { value: 'monochrome', label: 'Monochrome' },
            ]}
          />
          <Select
            label="Particle Shape"
            value={preferences.particleShape}
            onChange={
              (value) => updatePreference('particleShape', value as UIPreferences['particleShape']) // safe downcast – runtime verified
            }
            options={[
              { value: 'circle', label: 'Circle' },
              { value: 'square', label: 'Square' },
              { value: 'star', label: 'Star' },
              { value: 'heart', label: 'Heart' },
            ]}
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Visual Effects</h3>
        <div className="space-y-3">
          <Toggle
            label="Ambient Effects"
            description="Background particles and atmosphere"
            value={preferences.showAmbientEffects}
            onChange={(value) => updatePreference('showAmbientEffects', value)}
          />
          <Toggle
            label="Glow Effects"
            description="Pulsing glows and halos"
            value={preferences.showGlowEffects}
            onChange={(value) => updatePreference('showGlowEffects', value)}
          />
          <Toggle
            label="Shadows"
            description="Drop shadows and depth effects"
            value={preferences.showShadows}
            onChange={(value) => updatePreference('showShadows', value)}
          />
        </div>
      </GlassCard>
    </div>
  );
}
