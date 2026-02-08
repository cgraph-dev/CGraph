import { memo } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { categories, type CategoryId } from '@/pages/customize/customizeCategories';

// =============================================================================
// LOADING SKELETON
// =============================================================================

export const LoadingSkeleton = () => (
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

export const Sidebar = memo(function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
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
