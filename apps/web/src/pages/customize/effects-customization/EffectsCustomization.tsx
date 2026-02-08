/**
 * EffectsCustomization Component
 *
 * Comprehensive visual effects customization with 3 sections:
 * 1. Particle Effects - 12+ particle systems (snow, confetti, stars, etc.)
 * 2. Background Effects - 10+ animated backgrounds (gradients, waves, matrix)
 * 3. UI Animations - 8+ interface animation sets (smooth, bouncy, instant)
 *
 * @module pages/customize/effects-customization
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import type { ParticleEffect, BackgroundEffect, AnimationSet } from './types';
import { ParticleEffectsSection, BackgroundEffectsSection, AnimationSetsSection } from './sections';
import { useEffectsCustomization } from './useEffectsCustomization';
import { SaveButton } from './SaveButton';

export default function EffectsCustomization() {
  const {
    activeCategory,
    searchQuery,
    previewingLockedItem,
    particleEffect,
    backgroundEffect,
    animationSpeed,
    isSaving,
    error,
    filteredItems,
    categories,
    setActiveCategory,
    setSearchQuery,
    handlePreviewItem,
    handleSaveEffectsSettings,
  } = useEffectsCustomization();

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {category.label}
              <span className="text-xs opacity-60">({category.count})</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeCategory}...`}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeCategory === 'particles' && (
            <ParticleEffectsSection
              particles={filteredItems as ParticleEffect[]}
              selectedParticle={particleEffect ?? 'particle-none'}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('particle', id, isUnlocked)}
            />
          )}

          {activeCategory === 'backgrounds' && (
            <BackgroundEffectsSection
              backgrounds={filteredItems as BackgroundEffect[]}
              selectedBackground={backgroundEffect ?? 'bg-none'}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('background', id, isUnlocked)}
            />
          )}

          {activeCategory === 'animations' && (
            <AnimationSetsSection
              animations={filteredItems as AnimationSet[]}
              selectedAnimation={animationSpeed}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('animation', id, isUnlocked)}
            />
          )}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-white/60">
              No effects found matching your search.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <SaveButton isSaving={isSaving} onClick={handleSaveEffectsSettings} />

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
