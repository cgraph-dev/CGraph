/**
 * Custom hook for effects customization state and logic.
 *
 * Manages particle, background, and animation effect selection,
 * filtering, preview of locked items, and save operations.
 *
 * @module pages/customize/effects-customization
 */

import { useState, useEffect, useCallback } from 'react';
import { SparklesIcon, PhotoIcon, BeakerIcon } from '@heroicons/react/24/outline';
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

export interface CategoryTab {
  id: EffectCategory;
  label: string;
  icon: typeof SparklesIcon;
  count: number;
}

const CATEGORIES: CategoryTab[] = [
  {
    id: 'particles',
    label: 'Particle Effects',
    icon: SparklesIcon,
    count: PARTICLE_EFFECTS.length,
  },
  {
    id: 'backgrounds',
    label: 'Background Effects',
    icon: PhotoIcon,
    count: BACKGROUND_EFFECTS.length,
  },
  {
    id: 'animations',
    label: 'UI Animations',
    icon: BeakerIcon,
    count: ANIMATION_SETS.length,
  },
];

function filterByQuery<T extends { name: string; description: string }>(
  items: T[],
  query: string
): T[] {
  const q = query.toLowerCase();
  return items.filter(
    (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  );
}

/**
 * unknown for the customize module.
 */
/**
 * Hook for managing effects customization.
 */
export function useEffectsCustomization() {
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
      updateSettings({ particlesEnabled: particleId !== 'particle-none' });
    },
    [setEffect, updateSettings]
  );

  // Apply background effect to store for live preview
  const applyBackgroundToStore = useCallback(
    (bgId: string) => {
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
      const animation = ANIMATION_SETS.find((a) => a.id === id);
      const speedValue = animation?.speed || 'normal';
      updateEffects('animationSpeed', speedValue);
       
      setAnimationSpeed(speedValue as 'slow' | 'normal' | 'fast');
      setPreviewingLockedItem(isUnlocked ? null : id);
    }
  };

  const handleSaveEffectsSettings = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (previewingLockedItem) {
      toast.error('Please purchase premium to save this effect, or select an unlocked item.');
      return;
    }

    try {
      await saveCustomizations(user.id);
      toast.success('Effects settings saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save effects settings');
    }
  };

  // Filter items by search
  const getFilteredItems = (): (ParticleEffect | BackgroundEffect | AnimationSet)[] => {
    if (activeCategory === 'particles') {
      return filterByQuery(PARTICLE_EFFECTS, searchQuery);
    } else if (activeCategory === 'backgrounds') {
      return filterByQuery(BACKGROUND_EFFECTS, searchQuery);
    }
    return filterByQuery(ANIMATION_SETS, searchQuery);
  };

  const filteredItems = getFilteredItems();

  return {
    // State
    activeCategory,
    searchQuery,
    previewingLockedItem,
    particleEffect,
    backgroundEffect,
    animationSpeed,
    isSaving,
    error,
    filteredItems,
    categories: CATEGORIES,

    // Actions
    setActiveCategory,
    setSearchQuery,
    handlePreviewItem,
    handleSaveEffectsSettings,
  };
}
