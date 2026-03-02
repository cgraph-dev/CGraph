/**
 * Empty state shown when no blocked users match the current filter
 */

import { AnimatedEmptyState } from '@/shared/components';

interface EmptyStateProps {
  hasSearchQuery: boolean;
}

/**
 * Empty State — animated fallback for blocked users list.
 */
export function EmptyState({ hasSearchQuery }: EmptyStateProps) {
  if (hasSearchQuery) {
    return (
      <AnimatedEmptyState
        title="No users found"
        description="Try a different search term"
        variant="search"
      />
    );
  }

  return (
    <AnimatedEmptyState
      title="No blocked users"
      description="You haven't blocked anyone yet"
    />
  );
}
