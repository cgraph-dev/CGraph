/**
 * Main customization page layout.
 * @module
 */
import { useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { categories, type CategoryId } from '@/pages/customize/customizeCategories';
import { Sidebar, LoadingSkeleton } from '@/pages/customize/customize-sidebar';

// Lazy load heavy customization components for better performance
const IdentityCustomization = lazy(() => import('./identity-customization'));
const ThemeCustomization = lazy(() => import('./theme-customization'));
const ChatCustomization = lazy(() => import('./chat-customization'));
const EffectsCustomization = lazy(() => import('./effects-customization'));
const ProgressionCustomization = lazy(() => import('./progression-customization'));

// New V2 panels for enhanced experience (optional use)
import { LivePreviewPanel } from '@/modules/settings/components/customize';

/**
 * unknown.
 * unknown for the customize module.
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

/**
 * Customize component.
 */
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
  const category = categories.find((cat) => cat.id === activeCategory) ?? categories[0]!;
  const CategoryIcon = category.icon;

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
              <div className={`rounded-xl bg-gradient-to-r p-3 ${category.gradient}`}>
                <CategoryIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{category.label}</h2>
                <p className="text-sm text-white/60">{category.description}</p>
              </div>
            </div>

            {/* Feature badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {category.features.map((feature) => (
                <span
                  key={feature}
                  className={`rounded-full bg-gradient-to-r ${category.gradient} px-3 py-1 text-xs font-medium text-white`}
                >
                  {feature}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Content Area - Renders category-specific components */}
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
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
        </div>
      </main>

      {/* Right Panel - Live Preview */}
      <aside className="w-80 overflow-y-auto border-l border-primary-500/20 bg-[rgb(30,32,40)]/[0.50] backdrop-blur-xl">
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
