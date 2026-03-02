/**
 * PageSkeleton
 *
 * Generic wrapper that renders a skeleton placeholder while data loads,
 * then swaps to the real content. Prevents layout shift by matching
 * the skeleton shape to the final page layout.
 *
 * @module shared/components/PageSkeleton
 */

import type { ReactNode } from 'react';

interface PageSkeletonProps {
  /** Whether the page data is still loading */
  isLoading: boolean;
  /** Skeleton placeholder matching the page layout shape */
  skeleton: ReactNode;
  /** The actual page content to render when loaded */
  children: ReactNode;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Conditionally renders a skeleton or real content.
 *
 * @example
 * ```tsx
 * <PageSkeleton isLoading={isLoading} skeleton={<ConversationSkeleton />}>
 *   <ConversationView data={data} />
 * </PageSkeleton>
 * ```
 */
export function PageSkeleton({
  isLoading,
  skeleton,
  children,
  className,
}: PageSkeletonProps): React.ReactElement {
  if (isLoading) {
    return <div className={className}>{skeleton}</div>;
  }
  return <div className={className}>{children}</div>;
}

export default PageSkeleton;
