/**
 * PageSkeleton
 *
 * Generic wrapper that renders a skeleton placeholder while data loads,
 * then swaps to the real content. Prevents layout shift by matching
 * the skeleton shape to the final page layout.
 *
 * Supports optional fade transitions and error state handling.
 *
 * @module shared/components/PageSkeleton
 */

import { transitions } from '@cgraph/animation-constants';
import { AnimatePresence, motion } from 'motion/react';
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
  /** Whether to animate the transition from skeleton to content */
  animated?: boolean;
  /** Optional error state to show instead of content */
  error?: ReactNode;
  /** Minimum display time for skeleton in ms (prevents flash) */
  minDisplayTime?: number;
}

/**
 * Conditionally renders a skeleton or real content with optional fade transitions.
 *
 * @example
 * ```tsx
 * <PageSkeleton isLoading={isLoading} skeleton={<ConversationSkeleton />}>
 *   <ConversationView data={data} />
 * </PageSkeleton>
 * ```
 *
 * @example With animation
 * ```tsx
 * <PageSkeleton isLoading={isLoading} animated skeleton={<SettingsSkeleton />}>
 *   <SettingsPage />
 * </PageSkeleton>
 * ```
 */
export function PageSkeleton({
  isLoading,
  skeleton,
  children,
  className,
  animated = false,
  error,
}: PageSkeletonProps): React.ReactElement {
  if (error) {
    return <div className={className}>{error}</div>;
  }

  if (!animated) {
    if (isLoading) {
      return <div className={className}>{skeleton}</div>;
    }
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitions.pageEnter.transition}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transitions.pageEnter.transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageSkeleton;
