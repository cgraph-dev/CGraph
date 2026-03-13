/**
 * Online Stats Cards
 */

import { UserGroupIcon, UserIcon, EyeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { StatsCardsProps } from './types';

/**
 * unknown for the members module.
 */
/**
 * Stats Cards display component.
 */
export function StatsCards({ stats, formatDate }: StatsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <UserGroupIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-muted-foreground text-sm font-medium">Total Online</span>
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-foreground">{stats?.totalOnline || 0}</div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-green-500/10 p-2">
              <UserIcon className="h-5 w-5 text-green-500" />
            </div>
            <span className="text-muted-foreground text-sm font-medium">Members</span>
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-green-500">{stats?.members || 0}</div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <EyeIcon className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-muted-foreground text-sm font-medium">Guests</span>
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-blue-500">{stats?.guests || 0}</div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <ChartBarIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <span className="text-muted-foreground text-sm font-medium">Record</span>
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-yellow-500">{stats?.recordOnline || 0}</div>
        {stats?.recordDate && (
          <div className="text-muted-foreground mt-1 text-xs">{formatDate(stats.recordDate)}</div>
        )}
      </div>
    </div>
  );
}
