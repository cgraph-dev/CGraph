import { useState, useEffect, useCallback } from 'react';
import {
  GlobeAltIcon,
  UserGroupIcon,
  UserIcon,
  EyeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

/**
 * Who's Online Page
 *
 * MyBB-style who's online page with:
 * - Currently online users list
 * - Guest count
 * - Bot count
 * - User locations (what page they're viewing)
 * - Historical records
 */

// Online user type
interface OnlineUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  userGroup: string;
  userGroupColor: string | null;
  currentLocation: string;
  currentLocationUrl: string | null;
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  ipHash?: string; // For admins only
  lastActivity: string;
  invisible: boolean;
}

// Online stats
interface OnlineStats {
  totalOnline: number;
  members: number;
  guests: number;
  bots: number;
  invisible: number; // Admins only
  recordOnline: number;
  recordDate: string;
}

// Activity breakdown
interface ActivityBreakdown {
  location: string;
  count: number;
  percentage: number;
}

export default function WhosOnline() {
  // State
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [stats, setStats] = useState<OnlineStats | null>(null);
  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'activity'>('list');
  const [showGuests, setShowGuests] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch online users
  const fetchOnlineData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/presence/online');
      const data = response.data;

      // Online users
      const users = ensureArray(data, 'users') as Record<string, unknown>[];
      setOnlineUsers(
        users.map((u) => ({
          id: u.id as string,
          username: (u.username as string) || 'Guest',
          displayName: (u.display_name as string) || null,
          avatarUrl: (u.avatar_url as string) || null,
          avatarBorderId: (u.avatar_border_id as string) || (u.avatarBorderId as string) || null,
          userGroup: (u.user_group as string) || 'Member',
          userGroupColor: (u.user_group_color as string) || null,
          currentLocation: (u.current_location as string) || 'Unknown',
          currentLocationUrl: (u.current_location_url as string) || null,
          device: (u.device as OnlineUser['device']) || 'unknown',
          ipHash: u.ip_hash as string | undefined,
          lastActivity: (u.last_activity as string) || new Date().toISOString(),
          invisible: (u.invisible as boolean) || false,
        }))
      );

      // Stats
      setStats({
        totalOnline: data.stats?.total_online || 0,
        members: data.stats?.members || 0,
        guests: data.stats?.guests || 0,
        bots: data.stats?.bots || 0,
        invisible: data.stats?.invisible || 0,
        recordOnline: data.stats?.record_online || 0,
        recordDate: data.stats?.record_date || new Date().toISOString(),
      });

      // Activity breakdown
      const breakdown = ensureArray(data, 'activity_breakdown') as Record<string, unknown>[];
      setActivityBreakdown(
        breakdown.map((b) => ({
          location: (b.location as string) || 'Unknown',
          count: (b.count as number) || 0,
          percentage: (b.percentage as number) || 0,
        }))
      );

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[WhosOnline] Failed to fetch data:', err);
      setError('Failed to load online users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOnlineData();
  }, [fetchOnlineData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchOnlineData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOnlineData]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Device icon
  const DeviceIcon = ({ device }: { device: OnlineUser['device'] }) => {
    switch (device) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="text-muted-foreground h-4 w-4" title="Mobile" />;
      case 'desktop':
        return <ComputerDesktopIcon className="text-muted-foreground h-4 w-4" title="Desktop" />;
      default:
        return null;
    }
  };

  // Filter visible users
  const visibleUsers = onlineUsers.filter((u) => !u.invisible);
  const memberUsers = visibleUsers.filter((u) => u.id && u.id !== 'guest');
  const guestCount = stats?.guests || 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <GlobeAltIcon className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-foreground text-2xl font-bold">Who's Online</h1>
            <p className="text-muted-foreground text-sm">
              Last updated: {formatRelativeTime(lastUpdated.toISOString())}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 sm:mt-0">
          {/* Auto-refresh toggle */}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
            />
            Auto-refresh
          </label>

          <button
            onClick={fetchOnlineData}
            className="bg-secondary hover:bg-secondary/80 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-card border-border rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-lg p-2">
                <UserGroupIcon className="text-primary h-5 w-5" />
              </div>
              <span className="text-muted-foreground text-sm font-medium">Total Online</span>
            </div>
          </div>
          <div className="text-foreground mt-2 text-2xl font-bold">{stats?.totalOnline || 0}</div>
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
              className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
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

      {/* User List View */}
      {viewMode === 'list' && (
        <div className="bg-card border-border overflow-hidden rounded-lg border">
          {/* Online Members */}
          <div className="border-border border-b p-4">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Online Members ({memberUsers.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Loading online users...</p>
            </div>
          ) : memberUsers.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No members currently online</p>
            </div>
          ) : (
            <div className="divide-border divide-y">
              {memberUsers.map((user) => (
                <div
                  key={user.id}
                  className="hover:bg-muted/30 flex items-center justify-between p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatarUrl ? (
                        <ThemedAvatar
                          src={user.avatarUrl}
                          alt={user.displayName || user.username}
                          size="small"
                          className="h-10 w-10"
                          avatarBorderId={user.avatarBorderId}
                        />
                      ) : (
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                          <UserIcon className="text-primary h-5 w-5" />
                        </div>
                      )}
                      <OnlineStatusIndicator
                        status="online"
                        size="sm"
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>
                    <div>
                      <Link
                        to={`/profile/${user.username}`}
                        className="font-medium hover:underline"
                        style={{ color: user.userGroupColor || undefined }}
                      >
                        {user.displayName || user.username}
                      </Link>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>{user.userGroup}</span>
                        <DeviceIcon device={user.device} />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-foreground text-sm">
                      {user.currentLocationUrl ? (
                        <Link
                          to={user.currentLocationUrl}
                          className="hover:text-primary hover:underline"
                        >
                          {user.currentLocation}
                        </Link>
                      ) : (
                        user.currentLocation
                      )}
                    </div>
                    <div className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
                      <ClockIcon className="h-3 w-3" />
                      {formatRelativeTime(user.lastActivity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guests */}
          {showGuests && guestCount > 0 && (
            <div className="bg-muted/30 border-border border-t p-4">
              <div className="text-muted-foreground flex items-center gap-2">
                <EyeIcon className="h-5 w-5" />
                <span>
                  <strong>{guestCount}</strong> guest{guestCount !== 1 ? 's' : ''} browsing
                </span>
              </div>
            </div>
          )}

          {/* Bots */}
          {stats?.bots && stats.bots > 0 && (
            <div className="bg-muted/30 border-border border-t p-4">
              <div className="text-muted-foreground flex items-center gap-2">
                <ComputerDesktopIcon className="h-5 w-5" />
                <span>
                  <strong>{stats.bots}</strong> bot{stats.bots !== 1 ? 's' : ''} indexing
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Breakdown View */}
      {viewMode === 'activity' && (
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
      )}

      {/* Legend */}
      <div className="bg-card border-border mt-6 rounded-lg border p-4">
        <h3 className="text-foreground mb-3 text-sm font-semibold">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Online Member</span>
          </div>
          <div className="flex items-center gap-2">
            <EyeIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Guest</span>
          </div>
          <div className="flex items-center gap-2">
            <ComputerDesktopIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Desktop</span>
          </div>
          <div className="flex items-center gap-2">
            <DevicePhoneMobileIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Mobile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
