/**
 * useChatCustomization Hook
 *
 * Encapsulates all state and logic for the ChatCustomization page:
 * - Advanced bubble controls (border radius, shadow, glass, tail, hover, entrance)
 * - Active category & search filtering
 * - Locked-item preview handling
 * - Save flow with validation
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  FaceSmileIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import {
  useCustomizationStore,
  getBubbleStyle,
  getBubbleAnimation,
} from '@/modules/settings/store/customization';
import toast from 'react-hot-toast';
import type {
  ChatCategory,
  BubbleStyle,
  MessageEffect,
  ReactionStyle,
  CategoryDefinition,
  EntranceAnimation,
} from './types';
import { BUBBLE_STYLES, MESSAGE_EFFECTS, REACTION_STYLES } from './constants';

/**
 * Hook for managing chat customization.
 */
export function useChatCustomization() {
  const { user } = useAuthStore();
  const store = useCustomizationStore();
  const {
    bubbleStyle,
    messageEffect,
    reactionStyle,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateChatStyle,
    setChatBubbleStyle,
    setBubbleAnimation,
    updateSettings,
  } = store;

  // Fine-grained chat controls – initialised from store
  const [bubbleBorderRadius, setBubbleBorderRadius] = useState(store.bubbleBorderRadius ?? 16);
  const [bubbleShadowIntensity, setBubbleShadowIntensity] = useState(
    store.bubbleShadowIntensity ?? 50
  );
  const [enableGlassEffect, setEnableGlassEffect] = useState(store.bubbleGlassEffect ?? false);
  const [enableBubbleTail, setEnableBubbleTail] = useState(store.bubbleShowTail ?? true);
  const [enableHoverEffects, setEnableHoverEffects] = useState(store.bubbleHoverEffect ?? true);
  const [selectedEntranceAnimation, setSelectedEntranceAnimation] = useState<EntranceAnimation>(
    (store.bubbleEntranceAnimation as EntranceAnimation | undefined) ?? 'fade' // safe downcast – structural boundary
  );

  const [activeCategory, setActiveCategory] = useState<ChatCategory>('bubbles');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingLockedItem, setPreviewingLockedItem] = useState<string | null>(null);

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  // Preview handler – updates the unified store directly
  const handlePreviewItem = useCallback(
    (category: 'bubble' | 'effect' | 'reaction', id: string, isUnlocked: boolean) => {
      if (category === 'bubble') {
        updateChatStyle('bubbleStyle', id);
        setChatBubbleStyle(getBubbleStyle(id));
        setPreviewingLockedItem(isUnlocked ? null : id);
      } else if (category === 'effect') {
        updateChatStyle('messageEffect', id);
        setBubbleAnimation(getBubbleAnimation(id));
        setPreviewingLockedItem(isUnlocked ? null : id);
      } else {
        updateChatStyle('reactionStyle', id);
        setPreviewingLockedItem(isUnlocked ? null : id);
      }
    },
    [updateChatStyle, setChatBubbleStyle, setBubbleAnimation]
  );

  // Save handler with validation
  const handleSaveChatSettings = useCallback(async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (previewingLockedItem) {
      toast.error(
        'Please purchase premium to save this customization, or select an unlocked item.'
      );
      return;
    }

    try {
      updateSettings({
        bubbleBorderRadius,
        bubbleShadowIntensity,
        bubbleGlassEffect: enableGlassEffect,
        bubbleShowTail: enableBubbleTail,
        bubbleHoverEffect: enableHoverEffects,
        bubbleEntranceAnimation: selectedEntranceAnimation,
      });

      await saveCustomizations(user.id);
      toast.success('Chat settings saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save chat settings');
    }
  }, [
    user?.id,
    previewingLockedItem,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    enableGlassEffect,
    enableBubbleTail,
    enableHoverEffects,
    selectedEntranceAnimation,
    updateSettings,
    saveCustomizations,
  ]);

  // Category tab definitions
  const categories: CategoryDefinition[] = useMemo(
    () => [
      {
        id: 'bubbles',
        label: 'Bubble Styles',
        icon: ChatBubbleLeftRightIcon,
        count: BUBBLE_STYLES.length,
      },
      {
        id: 'effects',
        label: 'Message Effects',
        icon: SparklesIcon,
        count: MESSAGE_EFFECTS.length,
      },
      {
        id: 'reactions',
        label: 'Reaction Styles',
        icon: FaceSmileIcon,
        count: REACTION_STYLES.length,
      },
      {
        id: 'advanced',
        label: 'Fine Controls',
        icon: AdjustmentsHorizontalIcon,
        count: 5,
      },
    ],
    []
  );

  // Filter items by search
  const filteredItems: (BubbleStyle | MessageEffect | ReactionStyle)[] = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const source =
      activeCategory === 'bubbles'
        ? BUBBLE_STYLES
        : activeCategory === 'effects'
          ? MESSAGE_EFFECTS
          : REACTION_STYLES;

    return source.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    );
  }, [searchQuery, activeCategory]);

  // Entrance-animation change also syncs the store
  const handleEntranceAnimationChange = useCallback(
    (anim: EntranceAnimation) => {
      setSelectedEntranceAnimation(anim);
      setBubbleAnimation(anim);
    },
    [setBubbleAnimation]
  );

  return {
    // Store-derived selections
    bubbleStyle,
    messageEffect,
    reactionStyle,
    isSaving,
    error,

    // Category / search
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    categories,
    filteredItems,

    // Locked-item preview
    previewingLockedItem,

    // Advanced controls
    bubbleBorderRadius,
    setBubbleBorderRadius,
    bubbleShadowIntensity,
    setBubbleShadowIntensity,
    enableGlassEffect,
    setEnableGlassEffect,
    enableBubbleTail,
    setEnableBubbleTail,
    enableHoverEffects,
    setEnableHoverEffects,
    selectedEntranceAnimation,
    handleEntranceAnimationChange,

    // Actions
    handlePreviewItem,
    handleSaveChatSettings,
  };
}
