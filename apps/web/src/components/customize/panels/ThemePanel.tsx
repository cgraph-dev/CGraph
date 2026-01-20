/**
 * Theme Panel
 *
 * Customization panel for theme colors, effects, and animations.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  ColorPickerGrid,
  SpeedSelector,
  ToggleRow,
  SectionHeader,
  OptionButton,
} from '../CustomizationUI';
import {
  useCustomizationStoreV2,
  themeColors,
  type EffectPreset,
} from '@/stores/customizationStoreV2';

// =============================================================================
// EFFECT PRESETS
// =============================================================================

const effectPresets: { id: EffectPreset; name: string; icon: string; description: string }[] = [
  { id: 'glassmorphism', name: 'Glass', icon: '🪟', description: 'Frosted glass effect with blur' },
  { id: 'neon', name: 'Neon', icon: '💡', description: 'Vibrant neon glow effects' },
  { id: 'holographic', name: 'Holo', icon: '🌈', description: 'Shimmering holographic finish' },
  { id: 'minimal', name: 'Minimal', icon: '⬜', description: 'Clean, simple aesthetics' },
  { id: 'aurora', name: 'Aurora', icon: '🌌', description: 'Northern lights gradients' },
  { id: 'cyberpunk', name: 'Cyber', icon: '🤖', description: 'Futuristic tech style' },
];

// =============================================================================
// THEME PANEL COMPONENT
// =============================================================================

export const ThemePanel = memo(function ThemePanel() {
  const {
    themePreset,
    effectPreset,
    animationSpeed,
    particlesEnabled,
    glowEnabled,
    blurEnabled,
    animatedBackground,
    setTheme,
    setEffect,
    setAnimationSpeed,
    toggleParticles,
    toggleGlow,
    toggleBlur,
    toggleAnimatedBackground,
  } = useCustomizationStoreV2();

  const colors = themeColors[themePreset];

  return (
    <div className="space-y-8">
      {/* Color Theme */}
      <section>
        <SectionHeader
          title="Color Theme"
          subtitle="Choose your primary color palette"
          icon={<span className="text-lg">🎨</span>}
        />
        <ColorPickerGrid selected={themePreset} onSelect={setTheme} size="lg" />
        <p className="mt-2 text-xs text-white/50">
          Currently: <span style={{ color: colors.primary }}>{colors.name}</span>
        </p>
      </section>

      {/* Effect Style */}
      <section>
        <SectionHeader
          title="Effect Style"
          subtitle="Select your visual effect preset"
          icon={<span className="text-lg">✨</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {effectPresets.map((effect) => (
            <OptionButton
              key={effect.id}
              selected={effectPreset === effect.id}
              onClick={() => setEffect(effect.id)}
              icon={<span className="text-xl">{effect.icon}</span>}
              label={effect.name}
              description={effect.description}
              colorPreset={themePreset}
            />
          ))}
        </div>
      </section>

      {/* Animation Speed */}
      <section>
        <SectionHeader
          title="Animation Speed"
          subtitle="Control how fast animations play"
          icon={<span className="text-lg">⚡</span>}
        />
        <SpeedSelector
          value={animationSpeed}
          onChange={setAnimationSpeed}
          colorPreset={themePreset}
        />
      </section>

      {/* Visual Effects Toggles */}
      <section>
        <SectionHeader
          title="Visual Effects"
          subtitle="Enable or disable individual effects"
          icon={<span className="text-lg">💎</span>}
        />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <ToggleRow
            label="Particles"
            description="Floating particle animations"
            icon="✨"
            enabled={particlesEnabled}
            onToggle={toggleParticles}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Glow Effects"
            description="Ambient glow on elements"
            icon="💡"
            enabled={glowEnabled}
            onToggle={toggleGlow}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Blur Effects"
            description="Background blur and glass"
            icon="🌫️"
            enabled={blurEnabled}
            onToggle={toggleBlur}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Animated Background"
            description="Moving gradient background"
            icon="🎨"
            enabled={animatedBackground}
            onToggle={toggleAnimatedBackground}
            colorPreset={themePreset}
          />
        </div>
      </section>

      {/* Info Card */}
      <motion.div
        className="rounded-xl border border-white/10 p-4"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-white">Pro Tip</h4>
            <p className="mt-1 text-xs text-white/60">
              Effects are applied across your entire profile, chat bubbles, and forum posts. Premium
              users get access to exclusive effect combinations!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default ThemePanel;
