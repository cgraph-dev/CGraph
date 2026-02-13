/**
 * Customization Demo Component
 *
 * Interactive demo showcasing the app's extensive customization capabilities.
 * Features:
 * - Theme customization (colors, effects, animations)
 * - Avatar borders with animated RPG-style effects
 * - Profile customization (chat bubbles, user cards)
 * - Premium customization options
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBorder, TiltCard, GlowText } from './effects';
import { fadeInUp, staggerContainer } from './animations';
import { StarBorder } from '../effects';

// Import all types and components from submodule
import type { DemoState, DemoPanel } from './CustomizationDemo/types';
import { springs } from './animations';
import {
  AvatarPreview,
  ChatPreview,
  ProfilePreview,
  ThemeControlPanel,
  AvatarControlPanel,
  ChatControlPanel,
  ProfileControlPanel,
} from './CustomizationDemo/index';

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
    avatarBorder: 'legendary',
    avatarBorderColor: 'emerald',
    selectedBorderTheme: undefined, // User can select to explore themed borders
    chatBubbleStyle: 'default',
    chatBubbleColor: 'emerald',
    bubbleBorderRadius: 16,
    bubbleShadowIntensity: 20,
    bubbleEntranceAnimation: 'slide',
    bubbleGlassEffect: false,
    bubbleShowTail: true,
    bubbleHoverEffect: true,
    groupMessages: true,
    showTimestamps: true,
    compactMode: false,
    profileCardStyle: 'detailed',
    showBadges: true,
    showStatus: true,
    animatedBackground: true,
  });

  const [activePanel, setActivePanel] = useState<DemoPanel>('avatar');

  const updateState = (updates: Partial<DemoState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const panels: { id: DemoPanel; label: string; icon: string }[] = [
    { id: 'theme', label: 'Theme', icon: '🎨' },
    { id: 'avatar', label: 'Avatar', icon: '👤' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '📋' },
  ];

  return (
    <section className="relative overflow-hidden bg-transparent py-24">
      {/* Background - subtle gradients that blend with parent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.03),transparent_70%)]" />

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
          <StarBorder
            color="#10b981"
            speed="5s"
            className="section-header__badge section-header__badge--emerald"
          >
            100+ Customization Options
          </StarBorder>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Make It <GlowText>Yours</GlowText>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            Create your unique identity with animated avatar borders, custom chat bubbles, and
            personalized profiles.
            <span className="mt-2 block text-emerald-400">Your style follows you everywhere.</span>
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {activePanel === 'theme' && (
                    <ProfilePreview state={state} onChange={updateState} />
                  )}
                  {activePanel === 'avatar' && (
                    <AvatarPreview state={state} onChange={updateState} />
                  )}
                  {activePanel === 'chat' && <ChatPreview state={state} />}
                  {activePanel === 'profile' && (
                    <ProfilePreview state={state} onChange={updateState} />
                  )}
                </motion.div>
              </AnimatePresence>
            </TiltCard>

            {/* Feature tags */}
            <motion.div
              className="mt-6 flex flex-wrap justify-center gap-2"
              variants={staggerContainer}
            >
              {[
                '150+ Themed Borders',
                '6 Chat Styles',
                '8 Color Themes',
                '6 Effect Modes',
                'Cross-Platform',
                'Premium Options',
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
              <div className="p-5">
                {/* Panel Tabs */}
                <div className="mb-6 flex rounded-lg bg-gray-800/50 p-1">
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      className={`relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        activePanel === panel.id
                          ? 'text-white'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      onClick={() => setActivePanel(panel.id)}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        <span>{panel.icon}</span>
                        <span className="hidden sm:inline">{panel.label}</span>
                      </span>
                      {activePanel === panel.id && (
                        <motion.div
                          layoutId="activeCustomPanel"
                          className="absolute inset-0 rounded-md bg-white/10"
                          transition={springs.stiff}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Panel Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePanel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activePanel === 'theme' && (
                      <ThemeControlPanel state={state} onChange={updateState} />
                    )}
                    {activePanel === 'avatar' && (
                      <AvatarControlPanel state={state} onChange={updateState} />
                    )}
                    {activePanel === 'chat' && (
                      <ChatControlPanel state={state} onChange={updateState} />
                    )}
                    {activePanel === 'profile' && (
                      <ProfileControlPanel state={state} onChange={updateState} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </AnimatedBorder>

            {/* Premium CTA */}
            <motion.div
              className="mt-6 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span>👑</span> Unlock Premium Customizations
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Epic, Legendary & Mythic borders, exclusive themes, and more
                  </p>
                </div>
                <a
                  href="/register"
                  className="shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
                >
                  Upgrade
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default CustomizationDemo;
