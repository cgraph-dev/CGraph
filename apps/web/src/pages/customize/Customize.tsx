import { useCallback, memo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';

// Lazy load heavy customization components for better performance
const IdentityCustomization = lazy(() => import('./IdentityCustomization'));
const ThemeCustomization = lazy(() => import('./ThemeCustomization'));
const ChatCustomization = lazy(() => import('./ChatCustomization'));
const EffectsCustomization = lazy(() => import('./EffectsCustomization'));
const ProgressionCustomization = lazy(() => import('./ProgressionCustomization'));

// New V2 panels for enhanced experience (optional use)
import { LivePreviewPanel } from '@/components/customize';

/**
 * Customize Hub - Main Page
 *
 * Revolutionary customization interface with 5 comprehensive categories:
 * 1. Identity - Avatar borders (150+), titles (25+), badges, profile layouts
 * 2. Themes - Profile, chat, forum, and app color themes
 * 3. Chat Styling - Bubble customization (50+), effects, reactions
 * 4. Effects - Particles (12+), backgrounds (10+), animations (8+)
 * 5. Progression - Achievements, leaderboards, quests, daily rewards
 *
 * Layout: 3-panel design (sidebar, main content, live preview)
 */

type CategoryId = 'identity' | 'themes' | 'chat' | 'effects' | 'progression';

interface Category {
  id: CategoryId;
  label: string;
  icon: typeof UserCircleIcon;
  description: string;
  gradient: string;
  features: string[];
}

const categories: Category[] = [
  {
    id: 'identity',
    label: 'Identity',
    icon: UserCircleIcon,
    description: 'Avatar borders, titles, badges & layouts',
    gradient: 'from-purple-500 to-pink-500',
    features: ['150+ Borders', '25+ Titles', 'Badges', 'Layouts'],
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: PaintBrushIcon,
    description: 'Profile, chat, forum & app themes',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['20+ Themes', 'Custom Colors', 'Presets'],
  },
  {
    id: 'chat',
    label: 'Chat Styling',
    icon: ChatBubbleLeftRightIcon,
    description: 'Bubble styles, effects & reactions',
    gradient: 'from-green-500 to-emerald-500',
    features: ['50+ Styles', 'Animations', 'Reactions'],
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: SparklesIcon,
    description: 'Particles, backgrounds & animations',
    gradient: 'from-yellow-500 to-orange-500',
    features: ['12+ Particles', '10+ BGs', 'UI Animations'],
  },
  {
    id: 'progression',
    label: 'Progression',
    icon: TrophyIcon,
    description: 'Achievements, quests & leaderboards',
    gradient: 'from-red-500 to-pink-500',
    features: ['Achievements', 'Quests', 'Rewards'],
  },
];

// =============================================================================
// LOADING SKELETON
// =============================================================================

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-48 rounded-lg bg-white/10" />
    <div className="h-4 w-96 rounded bg-white/5" />
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="aspect-square rounded-xl bg-white/5" />
      ))}
    </div>
    <div className="h-32 rounded-xl bg-white/5" />
  </div>
);

// =============================================================================
// SIDEBAR NAVIGATION
// =============================================================================

interface SidebarProps {
  activeCategory: CategoryId;
  onCategoryChange: (id: CategoryId) => void;
}

const Sidebar = memo(function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-primary-500/20 bg-dark-900/50 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto p-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
            Customize
          </h1>
          <p className="mt-1 text-sm text-white/60">Personalize your experience</p>
        </div>

        {/* Category Navigation */}
        <nav className="space-y-2">
          {categories.map((cat, index) => {
            const isActive = cat.id === activeCategory;
            const Icon = cat.icon;

            return (
              <motion.button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full rounded-xl p-3 text-left transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${cat.gradient} text-white`
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{cat.label}</div>
                    <div className="truncate text-xs opacity-80">{cat.description}</div>
                  </div>
                </div>

                {/* Feature tags */}
                {isActive && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cat.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 rounded-xl border-2 border-white/30"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info */}
      <div className="border-t border-primary-500/20 p-4">
        <GlassCard variant="crystal" className="p-3">
          <div className="flex items-start gap-2">
            <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-400" />
            <div className="text-xs text-white/70">
              <div className="mb-1 font-semibold text-white">Live Preview</div>
              See changes in real-time as you customize. All settings auto-save.
            </div>
          </div>
        </GlassCard>
      </div>
    </aside>
  );
});

// =============================================================================
// MAIN CUSTOMIZE COMPONENT
// =============================================================================

export default function Customize() {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const navigate = useNavigate();

  // Validate URL category or default to 'identity'
  const isValidCategory = (cat: string | undefined): cat is CategoryId => {
    return categories.some((c) => c.id === cat);
  };

  const activeCategory: CategoryId = isValidCategory(urlCategory) ? urlCategory : 'identity';

  const handleCategoryChange = useCallback(
    (id: CategoryId) => {
      navigate(`/customize/${id}`);
    },
    [navigate]
  );

  // Always guaranteed to have a valid category (fallback to first)
  const category = categories.find((cat) => cat.id === activeCategory) || categories[0];
  // TypeScript needs explicit assertion since we guarantee category exists via fallback
  const safeCategory = category as Category;
  const CategoryIcon = safeCategory.icon;

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Left Sidebar - Category Navigation */}
      <Sidebar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className={`rounded-xl bg-gradient-to-r p-3 ${safeCategory.gradient}`}>
                <CategoryIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{safeCategory.label}</h2>
                <p className="text-sm text-white/60">{safeCategory.description}</p>
              </div>
            </div>

            {/* Feature badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {safeCategory.features.map((feature) => (
                <span
                  key={feature}
                  className={`rounded-full bg-gradient-to-r ${safeCategory.gradient} px-3 py-1 text-xs font-medium text-white`}
                >
                  {feature}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Content Area - Renders category-specific components */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* IMPORTANT: hover3D disabled to prevent performance issues with particle animations */}
              <GlassCard variant="frosted" hover3D={false} className="p-8">
                <Suspense fallback={<LoadingSkeleton />}>
                  {activeCategory === 'identity' && <IdentityCustomization />}
                  {activeCategory === 'themes' && <ThemeCustomization />}
                  {activeCategory === 'chat' && <ChatCustomization />}
                  {activeCategory === 'effects' && <EffectsCustomization />}
                  {activeCategory === 'progression' && <ProgressionCustomization />}
                </Suspense>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Right Panel - Live Preview */}
      <aside className="w-80 overflow-y-auto border-l border-primary-500/20 bg-dark-900/50 backdrop-blur-xl">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold text-white">Live Preview</h3>
            <p className="text-xs text-white/60">See your changes in real-time</p>
          </div>

          {/* Use the enhanced LivePreviewPanel if available, fallback to placeholder */}
          <Suspense
            fallback={
              <GlassCard variant="crystal" glow glowColor="rgba(139, 92, 246, 0.3)" className="p-4">
                <div className="text-center text-sm text-white/60">
                  <SparklesIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
                  <p>Loading preview...</p>
                </div>
              </GlassCard>
            }
          >
            <LivePreviewPanel />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}
