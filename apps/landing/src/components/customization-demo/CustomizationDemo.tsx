/**
 * Simplified CustomizationDemo for the Landing App
 *
 * Showcases CGraph's customization capabilities with:
 * - Theme switching (light/dark/emerald/purple)
 * - Avatar border preview
 * - Chat bubble style preview
 * - Profile card preview
 *
 * Self-contained — no external dependencies beyond framer-motion.
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES & DATA
// =============================================================================

type Panel = 'theme' | 'avatar' | 'chat' | 'profile';

interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
}

const THEMES: ThemeOption[] = [
  { id: 'emerald', name: 'Emerald', primary: '#10b981', secondary: '#059669', bg: '#0f1a15' },
  { id: 'purple', name: 'Royal', primary: '#8b5cf6', secondary: '#7c3aed', bg: '#1a0f2e' },
  { id: 'cyan', name: 'Ocean', primary: '#06b6d4', secondary: '#0891b2', bg: '#0f1a1e' },
  { id: 'rose', name: 'Rose', primary: '#f43f5e', secondary: '#e11d48', bg: '#1e0f14' },
];

const BORDERS = [
  { id: 'none', name: 'None', gradient: 'transparent' },
  { id: 'gold', name: 'Gold', gradient: 'linear-gradient(135deg, #ffd700, #ff8c00)' },
  { id: 'emerald', name: 'Emerald', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  {
    id: 'legendary',
    name: 'Legendary',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    gradient: 'linear-gradient(135deg, #ff0080, #7928ca, #0070f3, #00dfd8)',
  },
];

const PANELS: { id: Panel; label: string; icon: string }[] = [
  { id: 'theme', label: 'Theme', icon: '🎨' },
  { id: 'avatar', label: 'Avatar', icon: '👤' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'profile', label: 'Profile', icon: '📋' },
];

const WEB_APP_URL = 'https://web.cgraph.org';

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ThemePanel({ theme, onSelect }: { theme: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Choose your community's look and feel</p>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`relative rounded-xl border p-4 text-left transition-all ${
              theme === t.id
                ? 'border-white/30 bg-white/10'
                : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full" style={{ background: t.primary }} />
              <span className="text-sm font-medium text-white">{t.name}</span>
            </div>
            <div
              className="h-8 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${t.primary}33, ${t.secondary}22)`,
              }}
            />
            {theme === t.id && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 rounded-xl border-2"
                style={{ borderColor: t.primary }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function AvatarPanel({ border, onSelect }: { border: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Choose your avatar border style</p>
      <div className="flex justify-center">
        <motion.div
          className="rounded-full p-1"
          style={{
            background: BORDERS.find((b) => b.id === border)?.gradient || 'transparent',
          }}
          layout
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-800 text-4xl">
            😎
          </div>
        </motion.div>
      </div>
      <div className="flex justify-center gap-3">
        {BORDERS.map((b) => (
          <motion.button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`h-10 w-10 rounded-full border-2 transition-all ${
              border === b.id ? 'border-white shadow-lg' : 'border-transparent'
            }`}
            style={{
              background: b.gradient !== 'transparent' ? b.gradient : 'rgba(255,255,255,0.1)',
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
      <p className="text-center text-xs text-gray-500">
        150+ themed borders available • Earn legendary borders through achievements
      </p>
    </div>
  );
}

function ChatPanel({ theme }: { theme: string }) {
  const color = THEMES.find((t) => t.id === theme)?.primary || '#10b981';
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Customize your chat experience</p>
      <div className="space-y-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
        {/* Incoming */}
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm">
            🦊
          </div>
          <div>
            <span className="text-xs font-semibold" style={{ color }}>
              Alex
            </span>
            <div className="mt-0.5 rounded-xl rounded-tl-sm bg-gray-700/50 px-3 py-2 text-sm text-white">
              Hey! Check out my new avatar border 🔥
            </div>
          </div>
        </div>
        {/* Outgoing */}
        <div className="flex items-start justify-end gap-2">
          <div>
            <div
              className="mt-0.5 rounded-xl rounded-tr-sm px-3 py-2 text-sm text-white"
              style={{ background: `${color}44`, borderLeft: `2px solid ${color}` }}
            >
              That looks amazing! How did you get it?
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm">
            😎
          </div>
        </div>
        {/* Incoming with reactions */}
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm">
            🦊
          </div>
          <div>
            <span className="text-xs font-semibold" style={{ color }}>
              Alex
            </span>
            <div className="mt-0.5 rounded-xl rounded-tl-sm bg-gray-700/50 px-3 py-2 text-sm text-white">
              Level 50 reward! Keep earning XP 💪
            </div>
            <div className="mt-1 flex gap-1">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">🔥 12</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">👏 8</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500">
        6 chat styles • Custom colors • Reactions • Thread replies
      </p>
    </div>
  );
}

function ProfilePanel({ theme, border }: { theme: string; border: string }) {
  const color = THEMES.find((t) => t.id === theme)?.primary || '#10b981';
  const borderGrad = BORDERS.find((b) => b.id === border)?.gradient || 'transparent';
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Design your unique profile card</p>
      <div className="overflow-hidden rounded-xl border border-gray-700/50">
        {/* Banner */}
        <div
          className="h-20"
          style={{ background: `linear-gradient(135deg, ${color}44, ${color}11)` }}
        />
        {/* Content */}
        <div className="relative bg-gray-800/50 px-4 pb-4">
          <div className="-mt-8 mb-3 flex items-end gap-3">
            <div className="rounded-full p-0.5" style={{ background: borderGrad || color }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-2xl">
                😎
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white">YourName</h4>
              <span className="text-xs" style={{ color }}>
                ✨ Level 24 • Early Adopter
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-center text-xs">
            <div>
              <div className="font-semibold text-white">1.2k</div>
              <div className="text-gray-500">Posts</div>
            </div>
            <div>
              <div className="font-semibold text-white">89</div>
              <div className="text-gray-500">Friends</div>
            </div>
            <div>
              <div className="font-semibold text-white">Level 24</div>
              <div className="text-gray-500">Rank</div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500">
        6 card styles • Animated backgrounds • Custom badges
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const CustomizationDemo = memo(function CustomizationDemo() {
  const [theme, setTheme] = useState('emerald');
  const [border, setBorder] = useState('legendary');
  const [activePanel, setActivePanel] = useState<Panel>('avatar');

  return (
    <section className="relative overflow-hidden bg-transparent py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="mb-4 inline-block animate-[badge-subtle-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15),0_0_24px_rgba(16,185,129,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3),0_0_40px_rgba(16,185,129,0.15)]">
            100+ Customization Options
          </span>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Make It{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Yours
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            Create your unique identity with animated avatar borders, custom chat bubbles, and
            personalized profiles.
            <span className="mt-2 block text-emerald-400">Your style follows you everywhere.</span>
          </p>
        </motion.div>

        {/* Demo Content */}
        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {activePanel === 'theme' && <ThemePanel theme={theme} onSelect={setTheme} />}
                  {activePanel === 'avatar' && <AvatarPanel border={border} onSelect={setBorder} />}
                  {activePanel === 'chat' && <ChatPanel theme={theme} />}
                  {activePanel === 'profile' && <ProfilePanel theme={theme} border={border} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Feature tags */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                '150+ Themed Borders',
                '6 Chat Styles',
                '8 Color Themes',
                '6 Effect Modes',
                'Cross-Platform',
                'Premium Options',
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
              {/* Panel Tabs */}
              <div className="mb-6 flex rounded-lg bg-gray-800/50 p-1">
                {PANELS.map((panel) => (
                  <button
                    key={panel.id}
                    className={`relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      activePanel === panel.id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
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
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                  {activePanel === 'theme' && <ThemePanel theme={theme} onSelect={setTheme} />}
                  {activePanel === 'avatar' && <AvatarPanel border={border} onSelect={setBorder} />}
                  {activePanel === 'chat' && <ChatPanel theme={theme} />}
                  {activePanel === 'profile' && <ProfilePanel theme={theme} border={border} />}
                </motion.div>
              </AnimatePresence>
            </div>

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
                  href={`${WEB_APP_URL}/register`}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
                >
                  Upgrade
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default CustomizationDemo;
