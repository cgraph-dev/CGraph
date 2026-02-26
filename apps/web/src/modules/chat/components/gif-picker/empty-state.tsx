/**
 * EmptyState Component
 *
 * Empty state displays for different GIF picker views.
 */

import { HeartIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  type: 'favorites' | 'recent' | 'search';
}

/**
 * unknown for the chat module.
 */
/**
 * Empty State — fallback UI for empty data states.
 */
export function EmptyState({ type }: EmptyStateProps) {
  if (type === 'favorites') {
    return (
      <>
        <HeartIcon className="mb-2 h-12 w-12" />
        <p className="text-sm">No favorite GIFs yet</p>
        <p className="text-xs">Click the heart on any GIF to save it</p>
      </>
    );
  }

  if (type === 'recent') {
    return (
      <>
        <ClockIcon className="mb-2 h-12 w-12" />
        <p className="text-sm">No recent GIFs</p>
        <p className="text-xs">GIFs you use will appear here</p>
      </>
    );
  }

  return (
    <>
      <MagnifyingGlassIcon className="mb-2 h-12 w-12" />
      <p className="text-sm">No GIFs found</p>
      <p className="text-xs">Try a different search term</p>
    </>
  );
}
