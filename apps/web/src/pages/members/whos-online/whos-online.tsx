/**
 * Who's Online Page
 */

import { useState } from 'react';
import { GlobeAltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useOnlineData } from './useOnlineData';
import { formatRelativeTime, formatDate } from './utils';
import { StatsCards } from './stats-cards';
import { OnlineUserList } from './online-user-list';
import { ActivityBreakdownView } from './activity-breakdown-view';
import { OnlineLegend } from './online-legend';

/**
 * Whos Online component.
 */
export default function WhosOnline() {
  const [viewMode, setViewMode] = useState<'list' | 'activity'>('list');
  const [showGuests, setShowGuests] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { onlineUsers, stats, activityBreakdown, isLoading, error, lastUpdated, refetch } =
    useOnlineData(autoRefresh);

  const visibleUsers = onlineUsers.filter((u) => !u.invisible);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <GlobeAltIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Who's Online</h1>
            <p className="text-muted-foreground text-sm">
              Last updated: {formatRelativeTime(lastUpdated.toISOString())}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 sm:mt-0">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="border-border h-4 w-4 rounded text-primary focus:ring-primary"
            />
            Auto-refresh
          </label>

          <button
            onClick={refetch}
            className="bg-secondary hover:bg-secondary/80 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} formatDate={formatDate} />

      {/* View toggle */}
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-muted flex items-center rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            User List
          </button>
          <button
            onClick={() => setViewMode('activity')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'activity'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Activity Breakdown
          </button>
        </div>

        {viewMode === 'list' && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showGuests}
              onChange={(e) => setShowGuests(e.target.checked)}
              className="border-border h-4 w-4 rounded text-primary focus:ring-primary"
            />
            Show guest count
          </label>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 mb-6 rounded-lg border p-4">
          {error}
        </div>
      )}

      {/* Views */}
      {viewMode === 'list' && (
        <OnlineUserList
          users={visibleUsers}
          isLoading={isLoading}
          showGuests={showGuests}
          guestCount={stats?.guests || 0}
          botsCount={stats?.bots || 0}
          formatRelativeTime={formatRelativeTime}
        />
      )}

      {viewMode === 'activity' && (
        <ActivityBreakdownView activityBreakdown={activityBreakdown} isLoading={isLoading} />
      )}

      {/* Legend */}
      <OnlineLegend />
    </div>
  );
}
