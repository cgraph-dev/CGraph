/**
 * Thread Loading Skeleton
 * @module modules/forums/components/thread-view/components/loading-skeleton
 */

import { GlassCard } from '@/shared/components/ui';

export function ThreadLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <GlassCard variant="frosted" className="animate-pulse p-6">
        <div className="flex gap-4">
          <div className="w-16 space-y-2">
            <div className="mx-auto h-6 w-6 rounded bg-dark-700" />
            <div className="mx-auto h-4 w-10 rounded bg-dark-700" />
            <div className="mx-auto h-6 w-6 rounded bg-dark-700" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="h-8 w-3/4 rounded bg-dark-700" />
            <div className="h-4 w-1/2 rounded bg-dark-700" />
            <div className="h-32 rounded bg-dark-700" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
