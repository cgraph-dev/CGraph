/**
 * Landing Page Skeleton Components
 *
 * Lightweight skeleton loaders for lazy-loaded landing page sections.
 * Provides instant visual feedback while components load.
 *
 * @since v0.9.5
 */

import { memo } from 'react';

/**
 * Animated shimmer effect for skeleton loaders
 */
const shimmerClass =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';

/**
 * Skeleton for CustomizationDemo section
 */
export const CustomizationDemoSkeleton = memo(function CustomizationDemoSkeleton() {
  return (
    <div className="w-full py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header skeleton */}
        <div className="mb-12 text-center">
          <div className={`mx-auto mb-4 h-10 w-64 rounded-lg bg-purple-500/10 ${shimmerClass}`} />
          <div className={`mx-auto h-6 w-96 max-w-full rounded bg-white/5 ${shimmerClass}`} />
        </div>

        {/* Demo content skeleton */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Avatar preview skeleton */}
          <div
            className={`aspect-square rounded-2xl bg-gradient-to-br from-purple-500/10 to-emerald-500/10 ${shimmerClass}`}
          />

          {/* Controls skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-14 rounded-xl bg-white/5 ${shimmerClass}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Skeleton for ForumShowcase section
 */
export const ForumShowcaseSkeleton = memo(function ForumShowcaseSkeleton() {
  return (
    <div className="w-full py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header skeleton */}
        <div className="mb-12 text-center">
          <div className={`mx-auto mb-4 h-10 w-48 rounded-lg bg-purple-500/10 ${shimmerClass}`} />
          <div className={`mx-auto h-6 w-80 max-w-full rounded bg-white/5 ${shimmerClass}`} />
        </div>

        {/* Forum cards skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-64 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] ${shimmerClass}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Generic section skeleton for other lazy-loaded sections
 */
export const SectionSkeleton = memo(function SectionSkeleton({
  height = 'h-96',
}: {
  height?: string;
}) {
  return (
    <div className={`w-full ${height}`}>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className={`h-full rounded-2xl bg-white/5 ${shimmerClass}`} />
      </div>
    </div>
  );
});

export default {
  CustomizationDemoSkeleton,
  ForumShowcaseSkeleton,
  SectionSkeleton,
};
