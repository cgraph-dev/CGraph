/**
 * Chat Customization Sections
 * Section components for each customization category
 */

import { motion } from 'framer-motion';
import { SparklesIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { CustomizationItemCard } from '@/modules/settings/components/customize';
import RangeSliderControl from '@/modules/settings/components/customize/RangeSliderControl';
import AnimatedToggle from '@/modules/settings/components/customize/AnimatedToggle';
import type {
  BubbleStylesSectionProps,
  MessageEffectsSectionProps,
  ReactionStylesSectionProps,
  AdvancedControlsSectionProps,
} from './types';
import { ENTRANCE_ANIMATIONS } from './constants';

// ==================== BUBBLE STYLES SECTION ====================

export function BubbleStylesSection({
  bubbles,
  selectedBubble,
  previewingLockedItem,
  onSelect,
}: BubbleStylesSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {bubbles.map((bubble, index) => (
        <CustomizationItemCard
          key={bubble.id}
          item={bubble}
          index={index}
          isSelected={selectedBubble === bubble.id}
          isPreviewing={previewingLockedItem === bubble.id}
          onSelect={onSelect}
          layout="compact"
        >
          {/* Bubble Preview */}
          <div className="w-full space-y-2">
            <div
              className="ml-auto w-3/4 bg-primary-600 px-3 py-2 text-xs text-white"
              style={{
                borderRadius: bubble.borderRadius,
                boxShadow: bubble.shadow,
              }}
            >
              Your message
            </div>
            <div
              className="w-2/3 bg-dark-700 px-3 py-2 text-xs text-white"
              style={{
                borderRadius: bubble.borderRadius,
                boxShadow: bubble.shadow,
              }}
            >
              Reply
            </div>
          </div>
        </CustomizationItemCard>
      ))}
    </div>
  );
}

// ==================== MESSAGE EFFECTS SECTION ====================

/** Helper to get animation props for each effect type */
function getEffectAnimation(animation: string) {
  switch (animation) {
    case 'bounce':
      return { y: [0, -10, 0] };
    case 'slide':
      return { x: [-20, 0] };
    case 'scale':
      return { scale: [0.8, 1] };
    case 'rotate':
      return { rotate: [0, 360] };
    default:
      return {};
  }
}

export function MessageEffectsSection({
  effects,
  selectedEffect,
  previewingLockedItem,
  onSelect,
}: MessageEffectsSectionProps) {
  return (
    <div className="space-y-3">
      {effects.map((effect, index) => (
        <CustomizationItemCard
          key={effect.id}
          item={effect}
          index={index}
          isSelected={selectedEffect === effect.id}
          isPreviewing={previewingLockedItem === effect.id}
          onSelect={onSelect}
          layout="list"
          animationDirection="slide-left"
        >
          {/* Animation Preview */}
          <div className="flex h-16 w-32 items-center justify-center rounded-lg bg-dark-800">
            <motion.div
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white"
              animate={getEffectAnimation(effect.animation)}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
            >
              Message
            </motion.div>
          </div>
        </CustomizationItemCard>
      ))}
    </div>
  );
}

// ==================== REACTION STYLES SECTION ====================

/** Helper to get animation props for each reaction type */
function getReactionAnimation(animation: string) {
  switch (animation) {
    case 'bounce':
      return { y: [0, -20, 0] };
    case 'pop':
      return { scale: [1, 1.3, 1] };
    case 'spin':
      return { rotate: [0, 360] };
    case 'pulse':
      return { scale: [1, 1.1, 1] };
    case 'shake':
      return { x: [-5, 5, -5, 5, 0] };
    case 'float':
      return { y: [0, -30], opacity: [1, 0] };
    default:
      return {};
  }
}

export function ReactionStylesSection({
  reactions,
  selectedReaction,
  previewingLockedItem,
  onSelect,
}: ReactionStylesSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {reactions.map((reaction, index) => (
        <CustomizationItemCard
          key={reaction.id}
          item={reaction}
          index={index}
          isSelected={selectedReaction === reaction.id}
          isPreviewing={previewingLockedItem === reaction.id}
          onSelect={onSelect}
          layout="grid"
          centerText
        >
          {/* Reaction Preview */}
          <motion.div
            className="text-6xl"
            animate={getReactionAnimation(reaction.animation)}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          >
            ❤️
          </motion.div>
        </CustomizationItemCard>
      ))}
    </div>
  );
}

// ==================== ADVANCED CONTROLS SECTION ====================

export function AdvancedControlsSection({
  bubbleBorderRadius,
  onBorderRadiusChange,
  bubbleShadowIntensity,
  onShadowIntensityChange,
  enableGlassEffect,
  onGlassEffectChange,
  enableBubbleTail,
  onBubbleTailChange,
  enableHoverEffects,
  onHoverEffectsChange,
  selectedEntranceAnimation,
  onEntranceAnimationChange,
}: AdvancedControlsSectionProps) {
  const shadowValue = `0 ${2 + bubbleShadowIntensity / 10}px ${8 + bubbleShadowIntensity / 5}px rgba(0, 0, 0, ${bubbleShadowIntensity / 200})`;

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <GlassCard variant="neon" className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <SparklesIcon className="h-5 w-5 text-primary-400" />
          Live Preview
        </h3>

        <div className="flex justify-center gap-4">
          {/* Sent Message */}
          <motion.div
            className="relative max-w-[200px]"
            whileHover={enableHoverEffects ? { scale: 1.02, y: -2 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className={`px-4 py-2 text-sm text-white ${enableGlassEffect ? 'border border-white/20 bg-primary-600/70 backdrop-blur-md' : 'bg-primary-600'}`}
              style={{
                borderRadius: `${bubbleBorderRadius}px`,
                boxShadow: shadowValue,
              }}
            >
              Your message looks like this!
            </div>
            {enableBubbleTail && (
              <div
                className="absolute -bottom-1 right-3 h-3 w-3 rotate-45 bg-primary-600"
                style={{
                  borderRadius: `0 0 ${bubbleBorderRadius / 4}px 0`,
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            )}
          </motion.div>

          {/* Received Message */}
          <motion.div
            className="relative max-w-[200px]"
            whileHover={enableHoverEffects ? { scale: 1.02, y: -2 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className={`px-4 py-2 text-sm text-white ${enableGlassEffect ? 'border border-white/10 bg-dark-600/70 backdrop-blur-md' : 'bg-dark-600'}`}
              style={{
                borderRadius: `${bubbleBorderRadius}px`,
                boxShadow: shadowValue,
              }}
            >
              Reply bubble preview
            </div>
            {enableBubbleTail && (
              <div
                className="absolute -bottom-1 left-3 h-3 w-3 rotate-45 bg-dark-600"
                style={{
                  borderRadius: `0 0 0 ${bubbleBorderRadius / 4}px`,
                  boxShadow: '-2px 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            )}
          </motion.div>
        </div>
      </GlassCard>

      {/* Slider Controls */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-cyan-400" />
          Fine-Tune Controls
        </h3>

        <div className="space-y-6">
          <RangeSliderControl
            label="Border Radius"
            value={bubbleBorderRadius}
            onChange={onBorderRadiusChange}
            min={0}
            max={50}
            unit="px"
            color="#8B5CF6"
          />

          <RangeSliderControl
            label="Shadow Intensity"
            value={bubbleShadowIntensity}
            onChange={onShadowIntensityChange}
            min={0}
            max={100}
            unit="%"
            color="#F59E0B"
          />
        </div>
      </GlassCard>

      {/* Toggle Controls */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
          <SparklesIcon className="h-5 w-5 text-pink-400" />
          Visual Effects
        </h3>

        <div className="space-y-4">
          <AnimatedToggle
            label="Glassmorphic Effect"
            description="Adds a frosted glass background to bubbles"
            checked={enableGlassEffect}
            onChange={onGlassEffectChange}
          />

          <AnimatedToggle
            label="Bubble Tail"
            description="Show speech bubble tail pointer"
            checked={enableBubbleTail}
            onChange={onBubbleTailChange}
          />

          <AnimatedToggle
            label="Hover Effects"
            description="Lift and scale bubbles on hover"
            checked={enableHoverEffects}
            onChange={onHoverEffectsChange}
          />
        </div>
      </GlassCard>

      {/* Entrance Animation Picker */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Entrance Animation</h3>
        <div className="grid grid-cols-3 gap-3">
          {ENTRANCE_ANIMATIONS.map((anim) => (
            <motion.button
              key={anim}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEntranceAnimationChange(anim)}
              className={`rounded-lg p-3 text-center text-sm font-medium transition-all ${
                selectedEntranceAnimation === anim
                  ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                  : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {anim.charAt(0).toUpperCase() + anim.slice(1)}
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
