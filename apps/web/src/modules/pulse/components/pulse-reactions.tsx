/**
 * PulseReactions — Resonate / Fade / Not-for-me reaction buttons
 * Used on forum posts/threads for community-scoped reputation
 */

import { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export interface PulseReactionsProps {
  contentId: string;
  contentType: string;
  authorId: string;
  forumId: string;
  userPulse?: number; // User's pulse in this forum (for fade gating)
  className?: string;
}

type VoteType = 'resonate' | 'fade' | 'not_for_me';

export const PulseReactions = memo(function PulseReactions({
  contentId,
  contentType,
  authorId,
  forumId,
  userPulse = 0,
  className,
}: PulseReactionsProps) {
  const [activeVote, setActiveVote] = useState<VoteType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canFade = userPulse >= 50;

  const handleVote = useCallback(
    async (voteType: VoteType) => {
      if (isLoading) return;
      if (voteType === 'fade' && !canFade) return;

      setIsLoading(true);
      try {
        await api.post('/api/v1/pulse/vote', {
          to_user_id: authorId,
          forum_id: forumId,
          content_id: contentId,
          content_type: contentType,
          vote_type: voteType,
        });
        setActiveVote(voteType);
      } catch {
        // Error handled by api interceptor
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, canFade, authorId, forumId, contentId, contentType]
  );

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Resonate */}
      <button
        type="button"
        onClick={() => handleVote('resonate')}
        disabled={isLoading || activeVote !== null}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
          activeVote === 'resonate'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-white/5 text-white/60 hover:bg-green-500/10 hover:text-green-400'
        )}
      >
        ▲ Resonate
      </button>

      {/* Fade */}
      <button
        type="button"
        onClick={() => handleVote('fade')}
        disabled={isLoading || activeVote !== null || !canFade}
        title={canFade ? 'Fade this content' : 'Pulse ≥ 50 required to Fade'}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
          !canFade && 'cursor-not-allowed opacity-30',
          activeVote === 'fade'
            ? 'bg-red-500/20 text-red-400'
            : canFade
              ? 'bg-white/5 text-white/60 hover:bg-red-500/10 hover:text-red-400'
              : 'bg-white/5 text-white/40'
        )}
      >
        ▼ Fade
      </button>

      {/* Not for me */}
      <button
        type="button"
        onClick={() => handleVote('not_for_me')}
        disabled={isLoading || activeVote !== null}
        title="Not for me (algorithmic signal only, no pulse change)"
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
          activeVote === 'not_for_me'
            ? 'bg-gray-500/20 text-gray-400'
            : 'bg-white/5 text-white/60 hover:bg-gray-500/10 hover:text-gray-300'
        )}
      >
        ✕ Not for me
      </button>
    </div>
  );
});
