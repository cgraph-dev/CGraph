/**
 * Settings Tab Components
 * @module modules/settings/components/ui-customization
 */

import { motion } from 'framer-motion';
import { CheckIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { SettingsTabProps, UIPreferences } from './types';
import { ColorPicker, SliderControl, Select, Toggle } from './controls';

// =============================================================================
// THEME SETTINGS TAB
// =============================================================================

export function ThemeSettings({ preferences, updatePreference }: SettingsTabProps) {
  const themes = [
    { value: 'dark' as const, label: 'Dark', preview: 'bg-dark-900' },
    { value: 'darker' as const, label: 'Darker', preview: 'bg-dark-950' },
    { value: 'midnight' as const, label: 'Midnight', preview: 'bg-gray-950' },
    { value: 'amoled' as const, label: 'AMOLED', preview: 'bg-black' },
  ];

  const gradients = [
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

  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Base Theme</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {themes.map((theme) => (
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
          {gradients.map((gradient) => (
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

// =============================================================================
// EFFECTS SETTINGS TAB
// =============================================================================

export function EffectsSettings({ preferences, updatePreference }: SettingsTabProps) {
  const glassEffects = [
    { value: 'none' as const, label: 'None' },
    { value: 'default' as const, label: 'Default' },
    { value: 'frosted' as const, label: 'Frosted' },
    { value: 'crystal' as const, label: 'Crystal' },
    { value: 'neon' as const, label: 'Neon' },
    { value: 'holographic' as const, label: 'Holographic' },
    { value: 'matrix' as const, label: 'Matrix' },
  ];

  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Glass Effect Style</h3>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-7">
          {glassEffects.map((effect) => (
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
            onChange={(value) =>
              updatePreference('particleSystem', value as UIPreferences['particleSystem'])
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
            onChange={(value) =>
              updatePreference('particleColor', value as UIPreferences['particleColor'])
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
            onChange={(value) =>
              updatePreference('particleShape', value as UIPreferences['particleShape'])
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

// =============================================================================
// ANIMATIONS SETTINGS TAB
// =============================================================================

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

// =============================================================================
// TYPOGRAPHY SETTINGS TAB
// =============================================================================

export function TypographySettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Font Settings</h3>
        <div className="space-y-4">
          <Select
            label="Font Size"
            value={preferences.fontSize}
            onChange={(value) => updatePreference('fontSize', value as UIPreferences['fontSize'])}
            options={[
              { value: 'small', label: 'Small (14px)' },
              { value: 'medium', label: 'Medium (16px)' },
              { value: 'large', label: 'Large (18px)' },
              { value: 'xlarge', label: 'Extra Large (20px)' },
            ]}
          />
          <Select
            label="Font Family"
            value={preferences.fontFamily}
            onChange={(value) =>
              updatePreference('fontFamily', value as UIPreferences['fontFamily'])
            }
            options={[
              { value: 'system', label: 'System Default' },
              { value: 'inter', label: 'Inter (Recommended)' },
              { value: 'jetbrains', label: 'JetBrains Mono' },
              { value: 'comic-sans', label: 'Comic Sans (Why?)' },
            ]}
          />
          <Select
            label="Font Weight"
            value={preferences.fontWeight}
            onChange={(value) =>
              updatePreference('fontWeight', value as UIPreferences['fontWeight'])
            }
            options={[
              { value: 'light', label: 'Light (300)' },
              { value: 'normal', label: 'Normal (400)' },
              { value: 'medium', label: 'Medium (500)' },
              { value: 'semibold', label: 'Semibold (600)' },
              { value: 'bold', label: 'Bold (700)' },
            ]}
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Text Spacing</h3>
        <div className="space-y-4">
          <Select
            label="Line Height"
            value={preferences.lineHeight}
            onChange={(value) =>
              updatePreference('lineHeight', value as UIPreferences['lineHeight'])
            }
            options={[
              { value: 'compact', label: 'Compact (1.2)' },
              { value: 'normal', label: 'Normal (1.5)' },
              { value: 'relaxed', label: 'Relaxed (1.75)' },
              { value: 'loose', label: 'Loose (2)' },
            ]}
          />
          <Select
            label="Letter Spacing"
            value={preferences.letterSpacing}
            onChange={(value) =>
              updatePreference('letterSpacing', value as UIPreferences['letterSpacing'])
            }
            options={[
              { value: 'tight', label: 'Tight (-0.05em)' },
              { value: 'normal', label: 'Normal (0)' },
              { value: 'wide', label: 'Wide (0.05em)' },
              { value: 'wider', label: 'Wider (0.1em)' },
            ]}
          />
        </div>
      </GlassCard>
    </div>
  );
}

// =============================================================================
// ADVANCED SETTINGS TAB
// =============================================================================

export function AdvancedSettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Layout</h3>
        <div className="space-y-4">
          <Select
            label="Spacing"
            value={preferences.spacing}
            onChange={(value) => updatePreference('spacing', value as UIPreferences['spacing'])}
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
              updatePreference('contentWidth', value as UIPreferences['contentWidth'])
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
