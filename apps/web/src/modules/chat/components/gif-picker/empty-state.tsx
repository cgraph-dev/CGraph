/**
 * EmptyState Component
 *
 * Empty state displays for different GIF picker views.
 */

import { AnimatedEmptyState } from '@/shared/components';
import { HeartIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  type: 'favorites' | 'recent' | 'search';
}

/**
 * Animated Empty State — fallback for GIF picker tabs.
 */
export function EmptyState({ type }: EmptyStateProps) {
  if (type === 'favorites') {
    return (
      <AnimatedEmptyState
        title="No favorite GIFs yet"
        description="Click the heart on any GIF to save it"
        icon={<HeartIcon className="h-20 w-20 text-gray-500" />}
      />
    );
  }

  if (type === 'recent') {
    return (
      <AnimatedEmptyState
        title="No recent GIFs"
        description="GIFs you use will appear here"
        icon={<ClockIcon className="h-20 w-20 text-gray-500" />}
      />
    );
  }

  return (
    <AnimatedEmptyState
      title="No GIFs found"
      description="Try a different search term"
      variant="search"
      icon={<MagnifyingGlassIcon className="h-20 w-20 text-gray-500" />}
    />
  );
}
