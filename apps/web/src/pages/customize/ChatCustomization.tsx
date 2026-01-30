import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  FaceSmileIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/authStore';
import {
  useCustomizationStore,
  getBubbleStyle,
  getBubbleAnimation,
} from '@/stores/customization';
import { CustomizationItemCard, type CustomizationItem } from '@/components/customize';
import toast from 'react-hot-toast';

// Import reusable customization controls
import RangeSliderControl from '@/components/customize/RangeSliderControl';
import AnimatedToggle from '@/components/customize/AnimatedToggle';

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

// ==================== TYPE DEFINITIONS ====================

type ChatCategory = 'bubbles' | 'effects' | 'reactions' | 'advanced';

// Extend base CustomizationItem with bubble-specific properties
interface BubbleStyle extends CustomizationItem {
  borderRadius: string;
  shadow: string;
}

// Extend base CustomizationItem with effect-specific properties
interface MessageEffect extends CustomizationItem {
  animation: string;
}

// Extend base CustomizationItem with reaction-specific properties
interface ReactionStyle extends CustomizationItem {
  animation: string;
}

// ==================== MOCK DATA ====================

const BUBBLE_STYLES: BubbleStyle[] = [
  {
    id: 'bubble-default',
    name: 'Default Rounded',
    description: 'Classic rounded corners',
    borderRadius: '1rem',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-pill',
    name: 'Pill Shape',
    description: 'Fully rounded pill style',
    borderRadius: '9999px',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-sharp',
    name: 'Sharp Corners',
    description: 'No border radius',
    borderRadius: '0',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-telegram',
    name: 'Telegram Style',
    description: 'Telegram-inspired bubbles',
    borderRadius: '0.75rem 0.75rem 0.75rem 0',
    shadow: '0 1px 3px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-imessage',
    name: 'iMessage Style',
    description: 'Apple iMessage bubbles',
    borderRadius: '1.25rem',
    shadow: '0 1px 2px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-whatsapp',
    name: 'WhatsApp Style',
    description: 'WhatsApp-inspired',
    borderRadius: '0.5rem 0.5rem 0.5rem 0',
    shadow: '0 1px 4px rgba(0,0,0,0.12)',
    unlocked: true,
  },
  {
    id: 'bubble-glass',
    name: 'Glassmorphic',
    description: 'Frosted glass effect',
    borderRadius: '1rem',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    unlocked: false,
    unlockRequirement: 'Reach Level 15',
  },
  {
    id: 'bubble-neon',
    name: 'Neon Glow',
    description: 'Glowing neon borders',
    borderRadius: '1rem',
    shadow: '0 0 20px rgba(139, 92, 246, 0.5)',
    unlocked: false,
    unlockRequirement: 'Send 1000 Messages',
    isPremium: true,
  },
  {
    id: 'bubble-comic',
    name: 'Comic Book',
    description: 'Comic-style speech bubble',
    borderRadius: '2rem 2rem 2rem 0.2rem',
    shadow: '4px 4px 0 rgba(0,0,0,0.2)',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
    isPremium: true,
  },
];

const MESSAGE_EFFECTS: MessageEffect[] = [
  {
    id: 'effect-none',
    name: 'No Animation',
    description: 'Instant appearance',
    animation: 'none',
    unlocked: true,
  },
  {
    id: 'effect-fade',
    name: 'Fade In',
    description: 'Smooth fade entrance',
    animation: 'fade',
    unlocked: true,
  },
  {
    id: 'effect-slide',
    name: 'Slide In',
    description: 'Slide from side',
    animation: 'slide',
    unlocked: true,
  },
  {
    id: 'effect-bounce',
    name: 'Bounce',
    description: 'Bouncy entrance',
    animation: 'bounce',
    unlocked: true,
  },
  {
    id: 'effect-scale',
    name: 'Scale Pop',
    description: 'Pop in with scale',
    animation: 'scale',
    unlocked: false,
    unlockRequirement: 'Reach Level 10',
  },
  {
    id: 'effect-rotate',
    name: 'Rotate In',
    description: 'Spinning entrance',
    animation: 'rotate',
    unlocked: false,
    unlockRequirement: 'Send 500 Messages',
  },
  {
    id: 'effect-typewriter',
    name: 'Typewriter',
    description: 'Letter-by-letter reveal',
    animation: 'typewriter',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
  },
  {
    id: 'effect-glitch',
    name: 'Glitch Effect',
    description: 'Digital glitch entrance',
    animation: 'glitch',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
  },
];

const REACTION_STYLES: ReactionStyle[] = [
  {
    id: 'reaction-bounce',
    name: 'Bounce',
    description: 'Classic bounce animation',
    animation: 'bounce',
    unlocked: true,
  },
  {
    id: 'reaction-pop',
    name: 'Pop',
    description: 'Quick pop effect',
    animation: 'pop',
    unlocked: true,
  },
  {
    id: 'reaction-spin',
    name: 'Spin',
    description: '360° rotation',
    animation: 'spin',
    unlocked: true,
  },
  {
    id: 'reaction-pulse',
    name: 'Pulse',
    description: 'Pulsating glow',
    animation: 'pulse',
    unlocked: true,
  },
  {
    id: 'reaction-shake',
    name: 'Shake',
    description: 'Vigorous shake',
    animation: 'shake',
    unlocked: false,
    unlockRequirement: 'React 100 Times',
  },
  {
    id: 'reaction-float',
    name: 'Float Up',
    description: 'Floats upward',
    animation: 'float',
    unlocked: false,
    unlockRequirement: 'Reach Level 20',
  },
  {
    id: 'reaction-explode',
    name: 'Explode',
    description: 'Explosive particles',
    animation: 'explode',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
  },
];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save chat settings');
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
  const getFilteredItems = () => {
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

// ==================== SECTION COMPONENTS ====================

interface BubbleStylesSectionProps {
  bubbles: BubbleStyle[];
  selectedBubble: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

function BubbleStylesSection({
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

interface MessageEffectsSectionProps {
  effects: MessageEffect[];
  selectedEffect: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

function MessageEffectsSection({
  effects,
  selectedEffect,
  previewingLockedItem,
  onSelect,
}: MessageEffectsSectionProps) {
  // Helper to get animation props for each effect type
  const getEffectAnimation = (animation: string) => {
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
  };

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

interface ReactionStylesSectionProps {
  reactions: ReactionStyle[];
  selectedReaction: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

function ReactionStylesSection({
  reactions,
  selectedReaction,
  previewingLockedItem,
  onSelect,
}: ReactionStylesSectionProps) {
  // Helper to get animation props for each reaction type
  const getReactionAnimation = (animation: string) => {
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
  };

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

interface AdvancedControlsSectionProps {
  bubbleBorderRadius: number;
  onBorderRadiusChange: (value: number) => void;
  bubbleShadowIntensity: number;
  onShadowIntensityChange: (value: number) => void;
  enableGlassEffect: boolean;
  onGlassEffectChange: (value: boolean) => void;
  enableBubbleTail: boolean;
  onBubbleTailChange: (value: boolean) => void;
  enableHoverEffects: boolean;
  onHoverEffectsChange: (value: boolean) => void;
  selectedEntranceAnimation: string;
  onEntranceAnimationChange: (value: string) => void;
}

function AdvancedControlsSection({
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
          {['slide', 'fade', 'scale', 'bounce', 'flip', 'none'].map((anim) => (
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
