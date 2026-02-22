/**
 * Animations Settings Tab Component
 * Allows users to customize animation speed, intensity, and features
 */

import { GlassCard } from '@/shared/components/ui';
import type { SettingsTabProps, UIPreferences } from './types';
import { Select, Toggle } from './controls';

export function AnimationsSettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Animation Speed</h3>
        <Select
          label="Global Animation Speed"
          value={preferences.animationSpeed}
          onChange={(value) =>
            updatePreference('animationSpeed', value as UIPreferences['animationSpeed'])
          }
          options={[
            { value: 'instant', label: 'Instant (No Animations)' },
            { value: 'fast', label: 'Fast (150ms)' },
            { value: 'normal', label: 'Normal (300ms)' },
            { value: 'slow', label: 'Slow (600ms)' },
            { value: 'very-slow', label: 'Very Slow (1s)' },
          ]}
        />
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Animation Intensity</h3>
        <Select
          label="Effect Complexity"
          value={preferences.animationIntensity}
          onChange={(value) =>
            updatePreference('animationIntensity', value as UIPreferences['animationIntensity'])
          }
          options={[
            { value: 'minimal', label: 'Minimal (Best Performance)' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium (Recommended)' },
            { value: 'high', label: 'High' },
            { value: 'ultra', label: 'Ultra (Maximum Effects)' },
          ]}
        />
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Animation Features</h3>
        <div className="space-y-3">
          <Toggle
            label="Transitions"
            description="Smooth element transitions"
            value={preferences.enableTransitions}
            onChange={(value) => updatePreference('enableTransitions', value)}
          />
          <Toggle
            label="Hover Effects"
            description="Interactive hover animations"
            value={preferences.enableHoverEffects}
            onChange={(value) => updatePreference('enableHoverEffects', value)}
          />
          <Toggle
            label="3D Transforms"
            description="Perspective and depth effects"
            value={preferences.enable3DTransforms}
            onChange={(value) => updatePreference('enable3DTransforms', value)}
          />
          <Toggle
            label="Parallax Scrolling"
            description="Depth-based scroll effects"
            value={preferences.enableParallax}
            onChange={(value) => updatePreference('enableParallax', value)}
          />
        </div>
      </GlassCard>
    </div>
  );
}
