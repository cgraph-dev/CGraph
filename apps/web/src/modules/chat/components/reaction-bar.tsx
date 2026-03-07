/**
 * ReactionBar — inline reaction pills below message with counts.
 * @module chat/components/reaction-bar
 */
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui';
import { LottieRenderer } from '@/lib/lottie';
import { getReactionAnimation } from '@/lib/chat/reactionUtils';

interface Reaction {
  emoji: string;
  count: number;
  /** Whether current user has reacted with this emoji */
  hasReacted: boolean;
  /** Usernames who reacted (for tooltip) */
  users: string[];
}

interface ReactionBarProps {
  reactions: Reaction[];
  onToggleReaction?: (emoji: string) => void;
  onAddReaction?: () => void;
  className?: string;
}

/**
 * ReactionBar — compact pills showing reactions below a message.
 */
export function ReactionBar({
  reactions,
  onToggleReaction,
  onAddReaction,
  className,
}: ReactionBarProps) {
  if (reactions.length === 0) return null;

  return (
    <div className={cn('mt-1 flex flex-wrap gap-1', className)}>
      <AnimatePresence mode="popLayout">
        {reactions.map((r) => (
          <motion.button
            key={r.emoji}
            type="button"
            layout
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onToggleReaction?.(r.emoji)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs',
              'cursor-pointer transition-colors',
              r.hasReacted
                ? 'border-[var(--color-brand-purple)]/40 bg-[var(--color-brand-purple)]/10 text-white'
                : 'border-white/[0.06] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
            )}
          >
            <Tooltip
              content={
                r.users.slice(0, 10).join(', ') +
                (r.users.length > 10 ? ` and ${r.users.length - 10} more` : '')
              }
              side="top"
            >
              <span className="flex items-center gap-1">
                <span>
                  {(() => {
                    const anim = getReactionAnimation(r.emoji);
                    if (anim) {
                      return (
                        <LottieRenderer
                          codepoint={anim.codepoint}
                          emoji={r.emoji}
                          size={16}
                          playOnHover
                          fallbackSrc={anim.webp}
                        />
                      );
                    }
                    return r.emoji;
                  })()}
                </span>
                <motion.span
                  key={r.count}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="min-w-[12px] text-center tabular-nums"
                >
                  {r.count}
                </motion.span>
              </span>
            </Tooltip>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add reaction button */}
      <button
        type="button"
        onClick={onAddReaction}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full',
          'border border-white/[0.06] bg-white/[0.02] text-white/30',
          'transition-colors hover:bg-white/[0.06] hover:text-white/50'
        )}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

export default ReactionBar;
