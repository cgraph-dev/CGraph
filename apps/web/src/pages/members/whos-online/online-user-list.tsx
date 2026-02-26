/**
 * Online User List Component
 */

import { Link } from 'react-router-dom';
import {
  UserIcon,
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import OnlineStatusIndicator from '@/modules/social/components/common/online-status-indicator';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { OnlineUserListProps, OnlineUser } from './types';

function DeviceIcon({ device }: { device: OnlineUser['device'] }) {
  switch (device) {
    case 'mobile':
      return <DevicePhoneMobileIcon className="text-muted-foreground h-4 w-4" title="Mobile" />;
    case 'desktop':
      return <ComputerDesktopIcon className="text-muted-foreground h-4 w-4" title="Desktop" />;
    default:
      return null;
  }
}

/**
 * unknown for the members module.
 */
/**
 * Online User List component.
 */
export function OnlineUserList({
  users,
  isLoading,
  showGuests,
  guestCount,
  botsCount,
  formatRelativeTime,
}: OnlineUserListProps) {
  const memberUsers = users.filter((u) => u.id && u.id !== 'guest');

  return (
    <div className="bg-card border-border overflow-hidden rounded-lg border">
      {/* Online Members Header */}
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
      {botsCount > 0 && (
        <div className="bg-muted/30 border-border border-t p-4">
          <div className="text-muted-foreground flex items-center gap-2">
            <ComputerDesktopIcon className="h-5 w-5" />
            <span>
              <strong>{botsCount}</strong> bot{botsCount !== 1 ? 's' : ''} indexing
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
