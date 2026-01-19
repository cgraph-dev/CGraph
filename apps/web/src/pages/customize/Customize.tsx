import { useParams, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import IdentityCustomization from './IdentityCustomization';
import ThemeCustomization from './ThemeCustomization';
import ChatCustomization from './ChatCustomization';
import EffectsCustomization from './EffectsCustomization';
import ProgressionCustomization from './ProgressionCustomization';

/**
 * Customize Hub - Main Page
 *
 * Revolutionary customization interface with 5 categories:
 * 1. Identity - Avatar borders, titles, badges, profile layouts
 * 2. Themes - Profile, chat, forum, and app themes
 * 3. Chat Styling - Bubble customization, effects, reactions
 * 4. Effects - Particles, backgrounds, animations
 * 5. Progression - Gamification hub (merged from leaderboard/rewards)
 *
 * Layout: 3-panel design (sidebar, main content, live preview)
 */

const categories = [
  {
    id: 'identity',
    label: 'Identity',
    icon: UserCircleIcon,
    description: 'Avatar borders, titles, badges & profile layouts',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: PaintBrushIcon,
    description: 'Profile, chat, forum & app color themes',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'chat',
    label: 'Chat Styling',
    icon: ChatBubbleLeftRightIcon,
    description: 'Bubble styles, message effects & reactions',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: SparklesIcon,
    description: 'Particles, backgrounds & animations',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'progression',
    label: 'Progression',
    icon: TrophyIcon,
    description: 'Levels, achievements, quests & leaderboards',
    color: 'from-red-500 to-pink-500',
  },
];

export default function Customize() {
  const { category = 'identity' } = useParams<{ category: string }>();

  const activeCategory = categories.find((cat) => cat.id === category) || categories[0];

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Left Sidebar - Category Navigation */}
      <aside className="w-64 border-r border-primary-500/20 bg-dark-900/50 backdrop-blur-xl overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              Customize
            </h1>
            <p className="text-xs text-white/60 mt-1">Personalize your experience</p>
          </div>

          {/* Category Navigation */}
          <nav className="space-y-2">
            {categories.map((cat, index) => {
              const isActive = cat.id === category;
              const Icon = cat.icon;

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavLink to={`/customize/${cat.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r ' + cat.color + ' text-white'
                          : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{cat.label}</div>
                          <div className="text-xs opacity-80 truncate">{cat.description}</div>
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeCategory"
                          className="absolute inset-0 rounded-xl border-2 border-white/30"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </NavLink>
                </motion.div>
              );
            })}
          </nav>

          {/* Bottom Info */}
          <div className="mt-8 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <div className="flex items-start gap-2">
              <SparklesIcon className="h-4 w-4 text-primary-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/70">
                <div className="font-semibold text-white mb-1">Live Preview</div>
                See changes in real-time as you customize. All settings auto-save.
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${activeCategory.color}`}>
                <activeCategory.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{activeCategory.label}</h2>
                <p className="text-sm text-white/60">{activeCategory.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Content Area - Renders category-specific components */}
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <GlassCard variant="frost" className="p-8">
                {category === 'identity' && <IdentityCustomization />}
                {category === 'themes' && <ThemeCustomization />}
                {category === 'chat' && <ChatCustomization />}
                {category === 'effects' && <EffectsCustomization />}
                {category === 'progression' && <ProgressionCustomization />}
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Right Panel - Live Preview (coming soon) */}
      <aside className="w-80 border-l border-primary-500/20 bg-dark-900/50 backdrop-blur-xl overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white mb-1">Live Preview</h3>
            <p className="text-xs text-white/60">See your changes in real-time</p>
          </div>

          <GlassCard variant="crystal" glow glowColor="rgba(139, 92, 246, 0.3)" className="p-4">
            <div className="text-center text-white/60 text-sm">
              <SparklesIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Live preview will show here</p>
            </div>
          </GlassCard>
        </div>
      </aside>
    </div>
  );
}

// ==================== PLACEHOLDER COMPONENTS ====================

function IdentityPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Avatar Borders</h3>
        <p className="text-sm text-white/60 mb-4">
          Choose from 150+ animated borders with themed color palettes
        </p>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-2">Titles</h3>
        <p className="text-sm text-white/60 mb-4">25+ animated title styles</p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-2">Badges</h3>
        <p className="text-sm text-white/60 mb-4">Equip up to 5 badges to showcase</p>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-white/60 text-center">
          Full implementation coming in Phase 3.2
        </p>
      </div>
    </div>
  );
}

function ThemesPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Profile Themes</h3>
        <p className="text-sm text-white/60 mb-4">20+ preset themes for your profile card</p>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-white/60 text-center">Theme customization coming soon</p>
      </div>
    </div>
  );
}

function ChatPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Chat Bubble Styles</h3>
        <p className="text-sm text-white/60 mb-4">
          50+ customization options for chat bubbles
        </p>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-white/60 text-center">
          Chat customization coming soon
        </p>
      </div>
    </div>
  );
}

function EffectsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Border Particles</h3>
        <p className="text-sm text-white/60 mb-4">16 particle effect types</p>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-white/60 text-center">Effects customization coming soon</p>
      </div>
    </div>
  );
}

function ProgressionPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Your Progress</h3>
        <p className="text-sm text-white/60 mb-4">Level, XP, achievements & leaderboard</p>
        <div className="space-y-4">
          <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-white/60 text-center">
          Gamification hub will be moved here from /gamification route
        </p>
      </div>
    </div>
  );
}
