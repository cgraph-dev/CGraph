/**
 * Message reaction display and picker.
 * @module
 */
import { durations } from '@cgraph/animation-constants';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaceSmileIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { LottieRenderer } from '@/lib/lottie';
import { AnimatedEmoji } from '@/lib/lottie';
import { getReactionAnimation } from '@/lib/chat/reactionUtils';

/**
 * Message Reactions Component
 *
 * Provides an intuitive, emoji-based reaction system for messages.
 * Features:
 * - Quick reactions with emoji picker
 * - Animated reaction bubbles that bounce and glow
 * - Aggregated reaction counts with user lists on hover
 * - Accessibility support with keyboard navigation
 * - Haptic feedback for tactile response on interactions
 *
 * This component significantly enhances the expressiveness of conversations
 * without cluttering the UI. Users can quickly acknowledge messages or express
 * emotions that might not warrant a full reply.
 */

interface Reaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; username: string }>;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  currentUserId: string;
  disabled?: boolean;
}

// Most commonly used reactions for quick access
// Carefully selected to cover the most common emotional responses
// without overwhelming users with choices
const QUICK_REACTIONS = [
  '👍', // thumbs up - agreement/approval
  '❤️', // heart - love/strong approval
  '😂', // laugh - humor
  '😮', // wow - surprise/amazement
  '😢', // sad - empathy/sadness
  '🎉', // celebrate - excitement/achievement
  '🔥', // fire - something awesome/hot take
  '👀', // eyes - interesting/paying attention
];

// Expanded emoji picker organized by category
// Users can access these through the picker interface
const EMOJI_CATEGORIES = {
  Emotions: ['😊', '😂', '🥰', '😎', '🤔', '😅', '😢', '😡', '🥳', '😴', '🤯', '😱'],
  Reactions: ['👍', '👎', '👏', '🙌', '🤝', '💪', '🙏', '👀', '💯', '✨', '🔥', '❤️'],
  Objects: ['🎉', '🎊', '🎁', '🏆', '⭐', '💎', '🚀', '💡', '⚡', '🌈', '☀️', '🌙'],
  Symbols: ['✅', '❌', '⚠️', '❓', '❗', '💬', '💭', '🔔', '📌', '🎯', '📍', '🔗'],
};

/**
 * Message Reactions component.
 */
export default function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
  disabled = false,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Emotions');

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (pickerRef.current && target instanceof Node && !pickerRef.current.contains(target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showPicker]);

  const handleReaction = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji);

    if (reaction?.hasReacted) {
      onRemoveReaction(messageId, emoji);
      HapticFeedback.light();
    } else {
      onAddReaction(messageId, emoji);
      HapticFeedback.medium();
    }

    setShowPicker(false);
  };

  const getTotalReactions = () => {
    return reactions.reduce((sum, r) => sum + r.count, 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Existing reactions */}
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleReaction(reaction.emoji)}
            onMouseEnter={() => setShowTooltip(reaction.emoji)}
            onMouseLeave={() => setShowTooltip(null)}
            disabled={disabled}
            className={`group relative inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all duration-200 ${
              reaction.hasReacted
                ? 'border border-primary-500/50 bg-gradient-to-r from-primary-500/30 to-purple-500/30'
                : 'border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.10]'
            } `}
          >
            {/* Animated glow for user's own reaction */}
            {reaction.hasReacted && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary-400/20 blur-md"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  duration: durations.loop.ms / 1000,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            <span className="relative text-base leading-none">
              {(() => {
                const anim = getReactionAnimation(reaction.emoji);
                if (anim) {
                  return (
                    <LottieRenderer
                      codepoint={anim.codepoint}
                      emoji={reaction.emoji}
                      size={24}
                      playOnHover
                      fallbackSrc={anim.webp}
                    />
                  );
                }
                return reaction.emoji;
              })()}
            </span>
            {reaction.count > 1 && (
              <span
                className={`relative font-medium ${reaction.hasReacted ? 'text-primary-200' : 'text-gray-300'}`}
              >
                {reaction.count}
              </span>
            )}

            {/* Tooltip showing who reacted */}
            {showTooltip === reaction.emoji && reaction.users.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-gray-200 shadow-xl"
              >
                <div className="mb-1 font-medium">Reacted with {reaction.emoji}</div>
                <div className="text-gray-400">
                  {reaction.users.slice(0, 5).map((user, idx) => (
                    <div key={user.id}>
                      {user.username}
                      {idx < Math.min(4, reaction.users.length - 1) && ','}
                    </div>
                  ))}
                  {reaction.users.length > 5 && (
                    <div className="text-primary-400">and {reaction.users.length - 5} more</div>
                  )}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute left-1/2 top-full -mt-px h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/[0.08] bg-white/[0.04]" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add reaction button */}
      <div className="relative" ref={pickerRef}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowPicker(!showPicker);
            HapticFeedback.light();
          }}
          disabled={disabled}
          className={`rounded-full p-1.5 transition-all duration-200 ${getTotalReactions() > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-60 hover:opacity-100'} ${showPicker ? 'bg-primary-500/20' : 'hover:bg-white/[0.06]'} `}
          aria-label="Add reaction"
        >
          {showPicker ? (
            <PlusIcon className="h-4 w-4 rotate-45 text-primary-400 transition-transform" />
          ) : (
            <FaceSmileIcon className="h-4 w-4 text-gray-400" />
          )}
        </motion.button>

        {/* Emoji picker popup */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full left-0 z-50 mb-2 min-w-[280px] rounded-lg border border-white/[0.08] bg-white/[0.04] p-3 shadow-2xl"
            >
              {/* Quick reactions */}
              <div className="mb-3">
                <div className="mb-2 text-xs font-medium text-gray-400">Quick Reactions</div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleReaction(emoji)}
                      className="rounded-lg p-2 transition-colors hover:bg-white/[0.08]"
                    >
                      <span className="text-2xl leading-none">
                        <AnimatedEmoji emoji={emoji} size={28} playOnHover />
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Category tabs */}
              <div className="mb-2 flex gap-1 border-t border-dark-700 pt-2">
                {}
                {(
                  ['Emotions', 'Reactions', 'Objects', 'Symbols'] satisfies Array<
                    keyof typeof EMOJI_CATEGORIES
                  >
                ).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      activeCategory === category
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'text-gray-400 hover:bg-white/[0.06] hover:text-gray-300'
                    } `}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Emoji grid */}
              <div className="custom-scrollbar grid max-h-40 grid-cols-6 gap-1 overflow-y-auto">
                {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReaction(emoji)}
                    className="rounded p-2 transition-colors hover:bg-white/[0.08]"
                  >
                    <span className="text-xl leading-none">
                      <AnimatedEmoji emoji={emoji} size={24} playOnHover />
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
