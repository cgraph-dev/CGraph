/**
 * Customization Demo Component
 *
 * Interactive demo showcasing the app's customization capabilities.
 * Users can try different themes, effects, and animations directly on the landing page.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBorder, TiltCard, GlowText } from './effects';
import { fadeInUp, springs, staggerContainer } from './animations';

// =============================================================================
// TYPES
// =============================================================================

type ThemePreset = 'emerald' | 'purple' | 'cyan' | 'orange' | 'pink';
type EffectPreset = 'glassmorphism' | 'neon' | 'holographic' | 'minimal';
type AnimationSpeed = 'slow' | 'normal' | 'fast';

interface DemoState {
  theme: ThemePreset;
  effect: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  blurEnabled: boolean;
}

// =============================================================================
// THEME COLORS
// =============================================================================

const themeColors: Record<ThemePreset, { primary: string; secondary: string; glow: string }> = {
  emerald: { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16, 185, 129, 0.5)' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139, 92, 246, 0.5)' },
  cyan: { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6, 182, 212, 0.5)' },
  orange: { primary: '#f97316', secondary: '#fb923c', glow: 'rgba(249, 115, 22, 0.5)' },
  pink: { primary: '#ec4899', secondary: '#f472b6', glow: 'rgba(236, 72, 153, 0.5)' },
};

// =============================================================================
// COMPONENTS
// =============================================================================

function PreviewCard({ state }: { state: DemoState }) {
  const colors = themeColors[state.theme];
  const speedMultiplier = state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: state.effect === 'glassmorphism'
          ? 'rgba(17, 24, 39, 0.7)'
          : state.effect === 'neon'
          ? 'rgba(0, 0, 0, 0.9)'
          : state.effect === 'holographic'
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(30, 41, 59, 0.8))'
          : 'rgba(17, 24, 39, 0.95)',
        backdropFilter: state.blurEnabled ? 'blur(20px)' : 'none',
        boxShadow: state.glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
      }}
      animate={state.glowEnabled ? {
        boxShadow: [
          `0 0 30px ${colors.glow}`,
          `0 0 50px ${colors.glow}`,
          `0 0 30px ${colors.glow}`,
        ],
      } : {}}
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    >
      {/* Particles overlay */}
      {state.particlesEnabled && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: (2 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Holographic effect */}
      {state.effect === 'holographic' && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(
              45deg,
              transparent 30%,
              ${colors.primary}20 45%,
              ${colors.secondary}20 55%,
              transparent 70%
            )`,
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 4 * speedMultiplier, repeat: Infinity }}
        />
      )}

      {/* Neon border */}
      {state.effect === 'neon' && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            border: `2px solid ${colors.primary}`,
            boxShadow: `inset 0 0 20px ${colors.glow}, 0 0 20px ${colors.glow}`,
          }}
        />
      )}

      {/* Scanlines for holographic */}
      {state.effect === 'holographic' && (
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            animate={state.glowEnabled ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1 * speedMultiplier, repeat: Infinity }}
          >
            <span className="text-white">CG</span>
          </motion.div>
          <div>
            <div className="font-semibold text-white">CGraph</div>
            <div className="text-xs text-gray-400">@cgraph_user</div>
          </div>
        </div>

        {/* Message preview */}
        <div className="space-y-3">
          <motion.div
            className="rounded-lg p-3"
            style={{ background: `${colors.primary}20` }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.bouncy, duration: 0.5 * speedMultiplier }}
          >
            <p className="text-sm text-gray-300">
              Welcome to <span style={{ color: colors.primary }}>CGraph</span>! Try customizing the UI with the controls below.
            </p>
          </motion.div>

          <motion.div
            className="ml-auto max-w-[80%] rounded-lg p-3"
            style={{ background: colors.primary }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.bouncy, duration: 0.5 * speedMultiplier, delay: 0.2 }}
          >
            <p className="text-sm text-white">This looks amazing! 🎨</p>
          </motion.div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <motion.div
              className="h-2 w-2 rounded-full"
              style={{ background: colors.primary }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity }}
            />
            Online
          </span>
          <span>E2E Encrypted</span>
          <span style={{ color: colors.primary }}>Premium</span>
        </div>
      </div>
    </motion.div>
  );
}

function ControlPanel({
  state,
  onChange,
}: {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}) {
  const colors = themeColors[state.theme];

  return (
    <div className="space-y-6">
      {/* Theme Colors */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Theme Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeColors) as ThemePreset[]).map((theme) => (
            <motion.button
              key={theme}
              className={`h-10 w-10 rounded-full border-2 transition-all ${
                state.theme === theme ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors[theme].primary}, ${themeColors[theme].secondary})`,
                boxShadow: state.theme === theme ? `0 0 20px ${themeColors[theme].glow}` : 'none',
              }}
              onClick={() => onChange({ theme })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
      </div>

      {/* Effect Style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Effect Style</label>
        <div className="grid grid-cols-2 gap-2">
          {(['glassmorphism', 'neon', 'holographic', 'minimal'] as EffectPreset[]).map((effect) => (
            <motion.button
              key={effect}
              className={`rounded-lg border px-3 py-2 text-sm capitalize transition-all ${
                state.effect === effect
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ effect })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {effect}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Animation Speed */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Animation Speed</label>
        <div className="flex gap-2">
          {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map((speed) => (
            <motion.button
              key={speed}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-all ${
                state.animationSpeed === speed
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ animationSpeed: speed })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {speed}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Toggle Effects */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-400">Visual Effects</label>

        {[
          { key: 'particlesEnabled', label: 'Particles' },
          { key: 'glowEnabled', label: 'Glow' },
          { key: 'blurEnabled', label: 'Blur' },
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 p-3 transition-colors hover:border-white/20"
          >
            <span className="text-sm text-gray-300">{label}</span>
            <motion.div
              className={`relative h-6 w-11 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '22px' : '2px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CustomizationDemo() {
  const [state, setState] = useState<DemoState>({
    theme: 'emerald',
    effect: 'glassmorphism',
    animationSpeed: 'normal',
    particlesEnabled: true,
    glowEnabled: true,
    blurEnabled: true,
  });

  const updateState = (updates: Partial<DemoState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <section className="relative overflow-hidden bg-gray-950 py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={springs.gentle}
        >
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            50+ Customization Options
          </motion.span>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Make It <GlowText>Yours</GlowText>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            Every detail is customizable. Try different themes, effects, and animations in real-time.
          </p>
        </motion.div>

        {/* Demo Content */}
        <motion.div
          className="grid items-start gap-8 lg:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Preview Panel */}
          <motion.div variants={fadeInUp}>
            <TiltCard maxTilt={5}>
              <PreviewCard state={state} />
            </TiltCard>

            {/* Feature tags */}
            <motion.div
              className="mt-6 flex flex-wrap justify-center gap-2"
              variants={staggerContainer}
            >
              {[
                '50+ Color Options',
                '10 Glass Variants',
                '8 Particle Types',
                'Spring Physics',
                'Haptic Feedback',
                'Cross-Platform',
              ].map((tag) => (
                <motion.span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400"
                  variants={fadeInUp}
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Control Panel */}
          <motion.div variants={fadeInUp}>
            <AnimatedBorder>
              <div className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-white">Customize</h3>
                <ControlPanel state={state} onChange={updateState} />
              </div>
            </AnimatedBorder>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default CustomizationDemo;
