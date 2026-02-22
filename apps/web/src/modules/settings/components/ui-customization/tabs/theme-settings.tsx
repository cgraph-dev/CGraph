/**
 * Theme Settings Tab Component
 * Allows users to customize base theme, background gradient, and color palette
 */

import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { SettingsTabProps } from './types';
import { ColorPicker } from './controls';

const THEMES = [
  { value: 'dark' as const, label: 'Dark', preview: 'bg-dark-900' },
  { value: 'darker' as const, label: 'Darker', preview: 'bg-dark-950' },
  { value: 'midnight' as const, label: 'Midnight', preview: 'bg-gray-950' },
  { value: 'amoled' as const, label: 'AMOLED', preview: 'bg-black' },
];

const GRADIENTS = [
  { value: 'none' as const, label: 'None', preview: 'bg-dark-900' },
  {
    value: 'subtle' as const,
    label: 'Subtle',
    preview: 'bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950',
  },
  {
    value: 'vibrant' as const,
    label: 'Vibrant',
    preview: 'bg-gradient-to-br from-primary-900 via-purple-900 to-pink-900',
  },
  {
    value: 'rainbow' as const,
    label: 'Rainbow',
    preview: 'bg-gradient-to-br from-red-900 via-purple-900 to-blue-900',
  },
  {
    value: 'northern-lights' as const,
    label: 'Aurora',
    preview: 'bg-gradient-to-br from-green-900 via-blue-900 to-purple-900',
  },
];

export function ThemeSettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Base Theme</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {THEMES.map((theme) => (
            <motion.button
              key={theme.value}
              onClick={() => updatePreference('theme', theme.value)}
              className={`rounded-xl border-2 p-4 transition-all ${
                preferences.theme === theme.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`mb-2 h-16 rounded-lg ${theme.preview}`} />
              <span className="text-sm font-medium text-white">{theme.label}</span>
              {preferences.theme === theme.value && (
                <CheckIcon className="mx-auto mt-1 h-4 w-4 text-primary-400" />
              )}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Background Gradient</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {GRADIENTS.map((gradient) => (
            <motion.button
              key={gradient.value}
              onClick={() => updatePreference('backgroundGradient', gradient.value)}
              className={`rounded-xl border-2 p-4 transition-all ${
                preferences.backgroundGradient === gradient.value
                  ? 'border-primary-500'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`mb-2 h-16 rounded-lg ${gradient.preview}`} />
              <span className="text-xs font-medium text-white">{gradient.label}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Color Palette</h3>
        <div className="space-y-4">
          <ColorPicker
            label="Primary Color"
            value={preferences.primaryColor}
            onChange={(color) => updatePreference('primaryColor', color)}
          />
          <ColorPicker
            label="Secondary Color"
            value={preferences.secondaryColor}
            onChange={(color) => updatePreference('secondaryColor', color)}
          />
          <ColorPicker
            label="Accent Color"
            value={preferences.accentColor}
            onChange={(color) => updatePreference('accentColor', color)}
          />
        </div>
      </GlassCard>
    </div>
  );
}
