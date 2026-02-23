/**
 * Advanced Settings Tab Component
 * Allows users to customize layout, performance, and accessibility options
 */

import { BeakerIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { SettingsTabProps, UIPreferences } from './types';
import { SliderControl, Select, Toggle } from './controls';

export function AdvancedSettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Layout</h3>
        <div className="space-y-4">
          <Select
            label="Spacing"
            value={preferences.spacing}
            onChange={(value) => updatePreference('spacing', value as UIPreferences['spacing'])} // safe downcast – select event value
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious' },
            ]}
          />
          <SliderControl
            label="Border Radius"
            value={preferences.borderRadius}
            onChange={(value) => updatePreference('borderRadius', value)}
            min={0}
            max={50}
            suffix="px"
          />
          <Select
            label="Content Width"
            value={preferences.contentWidth}
            onChange={(value) =>
              updatePreference('contentWidth', value as UIPreferences['contentWidth']) // safe downcast – select event value
            }
            options={[
              { value: 'narrow', label: 'Narrow (800px)' },
              { value: 'normal', label: 'Normal (1200px)' },
              { value: 'wide', label: 'Wide (1600px)' },
              { value: 'full', label: 'Full Width' },
            ]}
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Performance</h3>
        <div className="space-y-3">
          <Toggle
            label="Hardware Acceleration"
            description="Use GPU for animations (recommended)"
            value={preferences.hardwareAcceleration}
            onChange={(value) => updatePreference('hardwareAcceleration', value)}
          />
          <Toggle
            label="Lazy Load Images"
            description="Load images as they enter viewport"
            value={preferences.lazyLoadImages}
            onChange={(value) => updatePreference('lazyLoadImages', value)}
          />
          <SliderControl
            label="Virtualize Lists After"
            value={preferences.virtualizeListsAtBeyond}
            onChange={(value) => updatePreference('virtualizeListsAtBeyond', value)}
            min={50}
            max={500}
            step={50}
            suffix=" items"
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Accessibility</h3>
        <div className="space-y-3">
          <Toggle
            label="Reduced Motion"
            description="Minimize animations (respects system preference)"
            value={preferences.reducedMotion}
            onChange={(value) => updatePreference('reducedMotion', value)}
          />
          <Toggle
            label="High Contrast"
            description="Increase contrast for better visibility"
            value={preferences.highContrast}
            onChange={(value) => updatePreference('highContrast', value)}
          />
          <Toggle
            label="Large Click Targets"
            description="Increase button/link sizes"
            value={preferences.largeClickTargets}
            onChange={(value) => updatePreference('largeClickTargets', value)}
          />
          <Toggle
            label="Focus Indicators"
            description="Show keyboard focus outlines"
            value={preferences.showFocusIndicators}
            onChange={(value) => updatePreference('showFocusIndicators', value)}
          />
        </div>
      </GlassCard>

      <GlassCard variant="neon" glow className="border-2 border-purple-500/30 p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
          <BeakerIcon className="h-5 w-5 text-purple-400" />
          Experimental Features
        </h3>
        <p className="mb-4 text-sm text-gray-400">Cutting-edge features that may be unstable</p>
        <div className="space-y-3">
          <Toggle
            label="Neural Effects"
            description="AI-powered animations that adapt to your behavior"
            value={preferences.enableNeuralEffects}
            onChange={(value) => updatePreference('enableNeuralEffects', value)}
          />
          <Toggle
            label="Quantum UI"
            description="Superposition of multiple UI states simultaneously"
            value={preferences.enableQuantumUI}
            onChange={(value) => updatePreference('enableQuantumUI', value)}
          />
          <Toggle
            label="Holographic Projection"
            description="3D holographic interface (requires AR hardware)"
            value={preferences.enableHolographicProjection}
            onChange={(value) => updatePreference('enableHolographicProjection', value)}
          />
          <Toggle
            label="Mind Control"
            description="Control UI with your thoughts (BCI required)"
            value={preferences.enableMindControl}
            onChange={(value) => updatePreference('enableMindControl', value)}
          />
        </div>
      </GlassCard>
    </div>
  );
}
