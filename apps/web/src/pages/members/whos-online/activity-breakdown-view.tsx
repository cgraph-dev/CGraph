/**
 * Activity Breakdown View Component
 */

import { ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { ActivityBreakdownViewProps } from './types';

export function ActivityBreakdownView({
  activityBreakdown,
  isLoading,
}: ActivityBreakdownViewProps) {
  return (
    <div className="bg-card border-border overflow-hidden rounded-lg border">
      <div className="border-border border-b p-4">
        <h2 className="text-foreground text-lg font-semibold">What Users Are Doing</h2>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <ArrowPathIcon className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading activity data...</p>
        </div>
      ) : activityBreakdown.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center">
          <ChartBarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No activity data available</p>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {activityBreakdown.map((activity, index) => (
            <div key={index}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">{activity.location}</span>
                <span className="text-muted-foreground text-sm">
                  {activity.count} ({activity.percentage}%)
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${activity.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
