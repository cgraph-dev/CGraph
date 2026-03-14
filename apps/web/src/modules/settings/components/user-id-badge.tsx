/**
 * User ID display badge component.
 * @module
 */
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getAvatarBorderId } from '@/lib/utils';
import type { User } from '@/modules/auth/store/authStore.types';

interface UserIdBadgeProps {
  user: User | null;
}

/**
 * unknown for the settings module.
 */
/**
 * User Id Badge component.
 */
export function UserIdBadge({ user }: UserIdBadgeProps) {
  return (
    <GlassCard
      variant="holographic"
      glow
      glowColor="rgba(16, 185, 129, 0.25)"
      className="relative mb-6 overflow-hidden p-5"
    >
      {/* Top accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20 ring-2 ring-primary-400/20">
          {user?.avatarUrl ? (
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user?.displayName || user?.username || 'User'}
              size="large"
              className="h-16 w-16 rounded-2xl"
              avatarBorderId={getAvatarBorderId(user)}
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-xl font-bold text-white">
              {user?.displayName || user?.username || 'Anonymous User'}
            </span>
            {user?.isVerified && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
                ✓
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-primary-500/20 bg-primary-500/[0.06] px-2.5 py-0.5 font-mono text-sm text-primary-400">
              {user?.userIdDisplay || '#0000'}
            </span>
            {user?.username && <span className="text-sm text-white/40">@{user.username}</span>}
            {user?.pulse !== undefined && user.pulse > 0 && (
              <span className="rounded-lg bg-amber-500/[0.08] px-2 py-0.5 text-sm text-amber-400 ring-1 ring-amber-500/20">
                ⚡ {(user.pulse ?? 0).toLocaleString()} pulse
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
