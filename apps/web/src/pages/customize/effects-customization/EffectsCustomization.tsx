/**
 * EffectsCustomization Component
 *
 * Comprehensive visual effects customization with 3 sections:
 * 1. Particle Effects - 12+ particle systems (snow, confetti, stars, etc.)
 * 2. Background Effects - 10+ animated backgrounds (gradients, waves, matrix)
 * 3. UI Animations - 8+ interface animation sets (smooth, bouncy, instant)
 *
 * Features:
 * - Live preview of particle systems
 * - Interactive background demos
 * - Animation speed controls
 * - Lock system for premium effects
 * - Performance impact indicators
 *
 * @module pages/customize/effects-customization
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  PhotoIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import toast from 'react-hot-toast';

import type { EffectCategory, ParticleEffect, BackgroundEffect, AnimationSet } from './types';
import {
  PARTICLE_ID_TO_EFFECT,
  PARTICLE_EFFECTS,
  BACKGROUND_EFFECTS,
  ANIMATION_SETS,
} from './constants';
import { ParticleEffectsSection, BackgroundEffectsSection, AnimationSetsSection } from './sections';

export default function EffectsCustomization() {
  const { user } = useAuthStore();
  const store = useCustomizationStore();
  const {
    particleEffect,
    backgroundEffect,
    animationSpeed,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateEffects,
    setEffect,
    updateSettings,
    setAnimationSpeed,
  } = store;

  const [activeCategory, setActiveCategory] = useState<EffectCategory>('particles');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingLockedItem, setPreviewingLockedItem] = useState<string | null>(null);

  // Apply particle effect to store for live preview
  const applyParticleToStore = useCallback(
    (particleId: string) => {
      const effectPreset = PARTICLE_ID_TO_EFFECT[particleId] || 'minimal';
      setEffect(effectPreset);
      // Use updateSettings instead of toggle to prevent infinite loop
      updateSettings({ particlesEnabled: particleId !== 'particle-none' });
    },
    [setEffect, updateSettings]
  );

  // Apply background effect to store for live preview
  const applyBackgroundToStore = useCallback(
    (bgId: string) => {
      // Background effects map to animated background - use updateSettings instead of toggle
      const isAnimated = BACKGROUND_EFFECTS.find((bg) => bg.id === bgId)?.animated || false;
      updateSettings({ animatedBackground: isAnimated });
    },
    [updateSettings]
  );

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  // Apply current selection to store on mount
  useEffect(() => {
    if (particleEffect) {
      const effectPreset = PARTICLE_ID_TO_EFFECT[particleEffect] || 'minimal';
      setEffect(effectPreset);
    }
  }, [particleEffect, setEffect]);

  // Handle preview for locked items
  const handlePreviewItem = (
    category: 'particle' | 'background' | 'animation',
    id: string,
    isUnlocked: boolean
  ) => {
    if (category === 'particle') {
      updateEffects('particleEffect', id);
      applyParticleToStore(id);
      setPreviewingLockedItem(isUnlocked ? null : id);
    } else if (category === 'background') {
      updateEffects('backgroundEffect', id);
      applyBackgroundToStore(id);
      setPreviewingLockedItem(isUnlocked ? null : id);
    } else {
      // For animations, extract the speed value from the animation set
      const animation = ANIMATION_SETS.find((a) => a.id === id);
      const speedValue = animation?.speed || 'normal';
      updateEffects('animationSpeed', speedValue);
      // Also update store directly for immediate preview
      setAnimationSpeed(speedValue as 'slow' | 'normal' | 'fast');
      setPreviewingLockedItem(isUnlocked ? null : id);
    }
  };

  const handleSaveEffectsSettings = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Block save if previewing a locked item
    if (previewingLockedItem) {
      toast.error('Please purchase premium to save this effect, or select an unlocked item.');
      return;
    }

    try {
      await saveCustomizations(user.id);
      toast.success('Effects settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save effects settings');
    }
  };

  const categories = [
    {
      id: 'particles' as EffectCategory,
      label: 'Particle Effects',
      icon: SparklesIcon,
      count: PARTICLE_EFFECTS.length,
    },
    {
      id: 'backgrounds' as EffectCategory,
      label: 'Background Effects',
      icon: PhotoIcon,
      count: BACKGROUND_EFFECTS.length,
    },
    {
      id: 'animations' as EffectCategory,
      label: 'UI Animations',
      icon: BeakerIcon,
      count: ANIMATION_SETS.length,
    },
  ];

  // Filter items by search
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase();
    if (activeCategory === 'particles') {
      return PARTICLE_EFFECTS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else if (activeCategory === 'backgrounds') {
      return BACKGROUND_EFFECTS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else {
      return ANIMATION_SETS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    }
  };

  const filteredItems = getFilteredItems();

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
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSaveEffectsSettings}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Effects Settings'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
