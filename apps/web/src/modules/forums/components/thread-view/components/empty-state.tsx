/**
 * Empty Comments State
 * @module modules/forums/components/thread-view/components/empty-state
 */

import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

/**
 * unknown for the forums module.
 */
/**
 * Empty Comments State — fallback UI for empty data states.
 */
export function EmptyCommentsState() {
  return (
    <GlassCard variant="frosted" className="p-8 text-center">
      <ChatBubbleLeftIcon className="mx-auto mb-3 h-12 w-12 text-gray-500" />
      <p className="text-gray-400">No comments yet. Be the first to comment!</p>
    </GlassCard>
  );
}
