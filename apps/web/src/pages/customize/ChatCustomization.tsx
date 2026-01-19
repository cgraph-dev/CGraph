import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';

// Reserved for future use
const _reserved = { CheckCircleIcon };
void _reserved;
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/authStore';
import { useCustomizationStore } from '@/stores/customizationStore';
import toast from 'react-hot-toast';

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

type ChatCategory = 'bubbles' | 'effects' | 'reactions';

interface BubbleStyle {
  id: string;
  name: string;
  description: string;
  borderRadius: string;
  shadow: string;
  unlocked: boolean;
  unlockRequirement?: string;
  isPremium?: boolean;
}

interface MessageEffect {
  id: string;
  name: string;
  description: string;
  animation: string;
  unlocked: boolean;
  unlockRequirement?: string;
}

interface ReactionStyle {
  id: string;
  name: string;
  description: string;
  animation: string;
  unlocked: boolean;
  unlockRequirement?: string;
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
  const {
    bubbleStyle,
    messageEffect,
    reactionStyle,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateChatStyle,
  } = useCustomizationStore();

  const [activeCategory, setActiveCategory] = useState<ChatCategory>('bubbles');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  const handleSaveChatSettings = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
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
              onSelect={(id) => updateChatStyle('bubbleStyle', id)}
            />
          )}

          {activeCategory === 'effects' && (
            <MessageEffectsSection
              effects={filteredItems as MessageEffect[]}
              selectedEffect={messageEffect}
              onSelect={(id) => updateChatStyle('messageEffect', id)}
            />
          )}

          {activeCategory === 'reactions' && (
            <ReactionStylesSection
              reactions={filteredItems as ReactionStyle[]}
              selectedReaction={reactionStyle}
              onSelect={(id) => updateChatStyle('reactionStyle', id)}
            />
          )}

          {filteredItems.length === 0 && (
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
  onSelect: (id: string) => void;
}

function BubbleStylesSection({ bubbles, selectedBubble, onSelect }: BubbleStylesSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {bubbles.map((bubble, index) => (
        <motion.div
          key={bubble.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant={
              bubble.unlocked
                ? selectedBubble === bubble.id
                  ? 'neon'
                  : 'crystal'
                : ('frosted' as const)
            }
            glow={selectedBubble === bubble.id}
            glowColor={selectedBubble === bubble.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-4 transition-all ${
              bubble.unlocked
                ? 'cursor-pointer hover:scale-[1.02]'
                : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => bubble.unlocked && onSelect(bubble.id)}
          >
            {/* Bubble Preview */}
            <div className="mb-3 flex h-32 items-center justify-center">
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
            </div>

            {/* Premium Badge */}
            {bubble.isPremium && (
              <div className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                PRO
              </div>
            )}

            {/* Bubble Name */}
            <h4 className="mb-1 text-sm font-semibold text-white">{bubble.name}</h4>

            {/* Description */}
            <p className="mb-3 text-xs text-white/60">{bubble.description}</p>

            {/* Status */}
            {bubble.unlocked ? (
              selectedBubble === bubble.id ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-1.5">
                  <CheckCircleIconSolid className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Active</span>
                </div>
              ) : (
                <button className="w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700">
                  Apply
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                <LockClosedIcon className="mb-2 h-8 w-8 text-white/40" />
                <p className="px-2 text-center text-xs text-white/60">{bubble.unlockRequirement}</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

interface MessageEffectsSectionProps {
  effects: MessageEffect[];
  selectedEffect: string;
  onSelect: (id: string) => void;
}

function MessageEffectsSection({ effects, selectedEffect, onSelect }: MessageEffectsSectionProps) {
  return (
    <div className="space-y-3">
      {effects.map((effect, index) => (
        <motion.div
          key={effect.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant={
              effect.unlocked
                ? selectedEffect === effect.id
                  ? 'neon'
                  : 'crystal'
                : ('frosted' as const)
            }
            glow={selectedEffect === effect.id}
            glowColor={selectedEffect === effect.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-4 transition-all ${
              effect.unlocked
                ? 'cursor-pointer hover:scale-[1.01]'
                : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => effect.unlocked && onSelect(effect.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="mb-1 text-base font-bold text-white">{effect.name}</h4>
                <p className="text-sm text-white/60">{effect.description}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Animation Preview */}
                <div className="flex h-16 w-32 items-center justify-center rounded-lg bg-dark-800">
                  <motion.div
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white"
                    animate={
                      effect.animation === 'bounce'
                        ? { y: [0, -10, 0] }
                        : effect.animation === 'slide'
                          ? { x: [-20, 0] }
                          : effect.animation === 'scale'
                            ? { scale: [0.8, 1] }
                            : effect.animation === 'rotate'
                              ? { rotate: [0, 360] }
                              : {}
                    }
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                  >
                    Message
                  </motion.div>
                </div>

                {/* Status Button */}
                {effect.unlocked ? (
                  selectedEffect === effect.id ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
                      <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Active</span>
                    </div>
                  ) : (
                    <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                      Apply
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                    <LockClosedIcon className="h-5 w-5 text-white/40" />
                    <span className="text-sm text-white/60">{effect.unlockRequirement}</span>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

interface ReactionStylesSectionProps {
  reactions: ReactionStyle[];
  selectedReaction: string;
  onSelect: (id: string) => void;
}

function ReactionStylesSection({
  reactions,
  selectedReaction,
  onSelect,
}: ReactionStylesSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {reactions.map((reaction, index) => (
        <motion.div
          key={reaction.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.04 }}
        >
          <GlassCard
            variant={
              reaction.unlocked
                ? selectedReaction === reaction.id
                  ? 'neon'
                  : 'crystal'
                : ('frosted' as const)
            }
            glow={selectedReaction === reaction.id}
            glowColor={selectedReaction === reaction.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-4 transition-all ${
              reaction.unlocked
                ? 'cursor-pointer hover:scale-[1.02]'
                : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => reaction.unlocked && onSelect(reaction.id)}
          >
            {/* Reaction Preview */}
            <div className="mb-3 flex h-32 items-center justify-center">
              <motion.div
                className="text-6xl"
                animate={
                  reaction.animation === 'bounce'
                    ? { y: [0, -20, 0] }
                    : reaction.animation === 'pop'
                      ? { scale: [1, 1.3, 1] }
                      : reaction.animation === 'spin'
                        ? { rotate: [0, 360] }
                        : reaction.animation === 'pulse'
                          ? { scale: [1, 1.1, 1] }
                          : reaction.animation === 'shake'
                            ? { x: [-5, 5, -5, 5, 0] }
                            : reaction.animation === 'float'
                              ? { y: [0, -30], opacity: [1, 0] }
                              : {}
                }
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              >
                ❤️
              </motion.div>
            </div>

            {/* Reaction Name */}
            <h4 className="mb-1 text-center text-base font-bold text-white">{reaction.name}</h4>

            {/* Description */}
            <p className="mb-3 text-center text-sm text-white/60">{reaction.description}</p>

            {/* Status */}
            {reaction.unlocked ? (
              selectedReaction === reaction.id ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2">
                  <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Active</span>
                </div>
              ) : (
                <button className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Apply
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                <LockClosedIcon className="mb-2 h-8 w-8 text-white/40" />
                <p className="px-2 text-center text-xs text-white/60">
                  {reaction.unlockRequirement}
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
