/**
 * Content Unlock Overlay
 *
 * Frosted overlay shown over gated content. Displays a lock icon
 * and an "Unlock for X Nodes" button. Handles insufficient balance
 * by redirecting to the Nodes shop.
 *
 * @module modules/nodes/components/content-unlock-overlay
 */

import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/shared/components/ui';
import { useUnlockContent } from '@/modules/nodes/hooks/useNodes';
import toast from 'react-hot-toast';

export interface ContentUnlockOverlayProps {
  postId: string;
  price: number;
  onUnlocked?: () => void;
}

/** Frosted overlay for gated forum content with unlock-for-Nodes CTA. */
export function ContentUnlockOverlay({ postId, price, onUnlocked }: ContentUnlockOverlayProps) {
  const navigate = useNavigate();
  const unlockMutation = useUnlockContent();

  const handleUnlock = () => {
    unlockMutation.mutate(postId, {
      onSuccess: () => {
        toast.success('Content unlocked!');
        onUnlocked?.();
      },
      onError: (error: unknown) => {
        let msg: string | undefined;
        if (
          error instanceof Object &&
          'response' in error &&
          error.response instanceof Object &&
          'data' in error.response &&
          error.response.data instanceof Object &&
          'error' in error.response.data &&
          typeof error.response.data.error === 'string'
        ) {
          msg = error.response.data.error;
        }
        if (msg === 'insufficient_balance') {
          toast.error('Not enough Nodes');
          navigate('/nodes/shop');
        } else {
          toast.error('Unlock failed. Please try again.');
        }
      },
    });
  };

  return (
    <GlassCard variant="frosted" className="mb-4 p-6 text-center">
      <div className="flex flex-col items-center gap-3 py-4">
        <span className="text-3xl">🔒</span>
        <h3 className="text-lg font-semibold text-white">Content Gated</h3>
        <p className="max-w-sm text-sm text-white/50">
          This thread's full content is gated. Unlock it to read the complete post and join the
          discussion.
        </p>
        <button
          className="mt-2 rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={unlockMutation.isPending}
          onClick={handleUnlock}
        >
          {unlockMutation.isPending ? 'Unlocking…' : `Unlock for ${price ?? '?'} Nodes`}
        </button>
      </div>
    </GlassCard>
  );
}
