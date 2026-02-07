/**
 * ChatCustomization Component
 *
 * Comprehensive chat styling customization with 3 sections:
 * 1. Bubble Styles - 25+ chat bubble shapes and styles
 * 2. Message Effects - 15+ send/receive animations
 * 3. Reaction Styles - 10+ emoji reaction animations
 *
 * Features:
 * - Live preview of chat bubbles
 * - Interactive animation demos
 * - Search/filter functionality
 * - Lock system for premium styles
 * - One-click apply
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  FaceSmileIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore, getBubbleStyle, getBubbleAnimation } from '@/stores/customization';
import toast from 'react-hot-toast';
import type { ChatCategory, BubbleStyle, MessageEffect, ReactionStyle } from './types';
import { BUBBLE_STYLES, MESSAGE_EFFECTS, REACTION_STYLES } from './constants';
import {
  BubbleStylesSection,
  MessageEffectsSection,
  ReactionStylesSection,
  AdvancedControlsSection,
} from './sections';

// ==================== MAIN COMPONENT ====================

export default function ChatCustomization() {
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

  // Fine-grained chat controls - initialize from store
  const [bubbleBorderRadius, setBubbleBorderRadius] = useState(store.bubbleBorderRadius ?? 16);
  const [bubbleShadowIntensity, setBubbleShadowIntensity] = useState(
    store.bubbleShadowIntensity ?? 50
  );
  const [enableGlassEffect, setEnableGlassEffect] = useState(store.bubbleGlassEffect ?? false);
  const [enableBubbleTail, setEnableBubbleTail] = useState(store.bubbleShowTail ?? true);
  const [enableHoverEffects, setEnableHoverEffects] = useState(store.bubbleHoverEffect ?? true);
  const [selectedEntranceAnimation, setSelectedEntranceAnimation] = useState<string>(
    store.bubbleEntranceAnimation ?? 'fade'
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

  // Handle preview for locked items - updates the unified store directly
  const handlePreviewItem = (
    category: 'bubble' | 'effect' | 'reaction',
    id: string,
    isUnlocked: boolean
  ) => {
    if (category === 'bubble') {
      updateChatStyle('bubbleStyle', id);
      // Also update the canonical chat bubble style using centralized mapping
      const bubbleStyleType = getBubbleStyle(id);
      setChatBubbleStyle(bubbleStyleType);
      setPreviewingLockedItem(isUnlocked ? null : id);
    } else if (category === 'effect') {
      updateChatStyle('messageEffect', id);
      // Also update the canonical bubble animation using centralized mapping
      const animationType = getBubbleAnimation(id);
      setBubbleAnimation(animationType);
      setPreviewingLockedItem(isUnlocked ? null : id);
    } else {
      updateChatStyle('reactionStyle', id);
      setPreviewingLockedItem(isUnlocked ? null : id);
    }
  };

  const handleSaveChatSettings = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Block save if previewing a locked item
    if (previewingLockedItem) {
      toast.error(
        'Please purchase premium to save this customization, or select an unlocked item.'
      );
      return;
    }

    try {
      // Update advanced controls in store before saving
      updateSettings({
        bubbleBorderRadius,
        bubbleShadowIntensity,
        bubbleGlassEffect: enableGlassEffect,
        bubbleShowTail: enableBubbleTail,
        bubbleHoverEffect: enableHoverEffects,
        bubbleEntranceAnimation: selectedEntranceAnimation as
          | 'none'
          | 'slide'
          | 'fade'
          | 'scale'
          | 'bounce'
          | 'flip',
      });

      await saveCustomizations(user.id);
      toast.success('Chat settings saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save chat settings');
    }
  };

  const categories = [
    {
      id: 'bubbles' as ChatCategory,
      label: 'Bubble Styles',
      icon: ChatBubbleLeftRightIcon,
      count: BUBBLE_STYLES.length,
    },
    {
      id: 'effects' as ChatCategory,
      label: 'Message Effects',
      icon: SparklesIcon,
      count: MESSAGE_EFFECTS.length,
    },
    {
      id: 'reactions' as ChatCategory,
      label: 'Reaction Styles',
      icon: FaceSmileIcon,
      count: REACTION_STYLES.length,
    },
    {
      id: 'advanced' as ChatCategory,
      label: 'Fine Controls',
      icon: AdjustmentsHorizontalIcon,
      count: 5,
    },
  ];

  // Filter items by search
  const getFilteredItems = (): (BubbleStyle | MessageEffect | ReactionStyle)[] => {
    const query = searchQuery.toLowerCase();
    if (activeCategory === 'bubbles') {
      return BUBBLE_STYLES.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else if (activeCategory === 'effects') {
      return MESSAGE_EFFECTS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else {
      return REACTION_STYLES.filter(
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
          {activeCategory === 'bubbles' && (
            <BubbleStylesSection
              bubbles={filteredItems as BubbleStyle[]}
              selectedBubble={bubbleStyle}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('bubble', id, isUnlocked)}
            />
          )}

          {activeCategory === 'effects' && (
            <MessageEffectsSection
              effects={filteredItems as MessageEffect[]}
              selectedEffect={messageEffect}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('effect', id, isUnlocked)}
            />
          )}

          {activeCategory === 'reactions' && (
            <ReactionStylesSection
              reactions={filteredItems as ReactionStyle[]}
              selectedReaction={reactionStyle}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('reaction', id, isUnlocked)}
            />
          )}

          {activeCategory === 'advanced' && (
            <AdvancedControlsSection
              bubbleBorderRadius={bubbleBorderRadius}
              onBorderRadiusChange={setBubbleBorderRadius}
              bubbleShadowIntensity={bubbleShadowIntensity}
              onShadowIntensityChange={setBubbleShadowIntensity}
              enableGlassEffect={enableGlassEffect}
              onGlassEffectChange={setEnableGlassEffect}
              enableBubbleTail={enableBubbleTail}
              onBubbleTailChange={(val) => {
                setEnableBubbleTail(val);
              }}
              enableHoverEffects={enableHoverEffects}
              onHoverEffectsChange={setEnableHoverEffects}
              selectedEntranceAnimation={selectedEntranceAnimation}
              onEntranceAnimationChange={(anim) => {
                setSelectedEntranceAnimation(anim);
                setBubbleAnimation(anim as 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip');
              }}
            />
          )}

          {filteredItems.length === 0 && activeCategory !== 'advanced' && (
            <div className="py-12 text-center text-white/60">
              No items found matching your search.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSaveChatSettings}
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
            'Save Chat Settings'
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
