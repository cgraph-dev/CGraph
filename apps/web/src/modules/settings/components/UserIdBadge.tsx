import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { getAvatarBorderId } from '@/lib/utils';
import type { User } from '@/modules/auth/store/authStore.types';

interface UserIdBadgeProps {
  user: User | null;
}

export function UserIdBadge({ user }: UserIdBadgeProps) {
  return (
    <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="mb-8 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 ring-4 ring-primary-500/20">
          {user?.avatarUrl ? (
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user?.displayName || user?.username || 'User'}
              size="large"
              className="h-16 w-16"
              avatarBorderId={getAvatarBorderId(user)}
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              {user?.displayName || user?.username || 'Anonymous User'}
            </span>
            {user?.isVerified && <span className="text-blue-400">✓</span>}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="rounded border border-primary-800/50 bg-dark-700 px-2 py-1 font-mono text-sm text-primary-400">
              {user?.userIdDisplay || '#0000'}
            </span>
            {user?.username && <span className="text-gray-400">@{user.username}</span>}
            {user?.karma !== undefined && user.karma > 0 && (
              <span className="text-sm text-amber-400">
                ⚡ {(user.karma ?? 0).toLocaleString()} karma
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
