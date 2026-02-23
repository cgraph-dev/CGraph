/**
 * ChatCustomization Component
 *
 * Comprehensive chat styling customization with 3 sections:
 * 1. Bubble Styles - 25+ chat bubble shapes and styles
 * 2. Message Effects - 15+ send/receive animations
 * 3. Reaction Styles - 10+ emoji reaction animations
 *
 * State & logic live in useChatCustomization hook.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { BubbleStyle, MessageEffect, ReactionStyle } from './types';
import {
  BubbleStylesSection,
  MessageEffectsSection,
  ReactionStylesSection,
  AdvancedControlsSection,
} from './sections';
import { useChatCustomization } from './useChatCustomization';

// ==================== MAIN COMPONENT ====================

export default function ChatCustomization() {
  const {
    bubbleStyle,
    messageEffect,
    reactionStyle,
    isSaving,
    error,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    categories,
    filteredItems,
    previewingLockedItem,
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
    handlePreviewItem,
    handleSaveChatSettings,
  } = useChatCustomization();

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
              bubbles={filteredItems as BubbleStyle[]} // safe downcast – runtime verified
              selectedBubble={bubbleStyle}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('bubble', id, isUnlocked)}
            />
          )}

          {activeCategory === 'effects' && (
            <MessageEffectsSection
              effects={filteredItems as MessageEffect[]} // safe downcast – runtime verified
              selectedEffect={messageEffect}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('effect', id, isUnlocked)}
            />
          )}

          {activeCategory === 'reactions' && (
            <ReactionStylesSection
              reactions={filteredItems as ReactionStyle[]} // safe downcast – runtime verified
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
              onBubbleTailChange={setEnableBubbleTail}
              enableHoverEffects={enableHoverEffects}
              onHoverEffectsChange={setEnableHoverEffects}
              selectedEntranceAnimation={selectedEntranceAnimation}
              onEntranceAnimationChange={handleEntranceAnimationChange}
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
