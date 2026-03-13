/**
 * ProfileHeader — Instagram/Discord-style profile header with banner, avatar, stats.
 * @module modules/social/components/profile-header
 */
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface ProfileStats {
  messages: number;
  friends: number;
  groups: number;
  memberSince: string;
}

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerColor?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: { emoji?: string; text: string };
  bio?: string;
  stats: ProfileStats;
  roles?: { name: string; color: string }[];
  isOwnProfile?: boolean;
  isFriend?: boolean;
  onEditProfile?: () => void;
  onAddFriend?: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  className?: string;
}

/**
 * ProfileHeader — large banner + overlapping avatar + stats row + action buttons.
 */
export function ProfileHeader({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  bannerColor = '#5865F2',
  status = 'offline',
  customStatus,
  bio,
  stats,
  roles = [],
  isOwnProfile = false,
  isFriend = false,
  onEditProfile,
  onAddFriend,
  onMessage,
  onBlock: _onBlock,
  className,
}: ProfileHeaderProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Banner */}
      <div
        className="h-[200px] w-full rounded-t-lg bg-cover bg-center"
        style={{
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          backgroundColor: bannerUrl ? undefined : bannerColor,
        }}
      />

      {/* Content area */}
      <div className="relative px-6 pb-4">
        {/* Avatar — overlapping banner */}
        <div className="absolute -top-14">
          <Avatar
            size="3xl"
            name={displayName}
            src={avatarUrl}
            status={status}
            storyRing={false}
            className="ring-4 ring-[rgb(18,18,24)]"
          />
        </div>

        {/* Action buttons (top right) */}
        <div className="flex justify-end gap-2 pt-3">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={onEditProfile}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium',
                'bg-white/[0.06] text-white/80 hover:bg-white/[0.1]',
                'border border-white/[0.08] transition-colors'
              )}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onMessage}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-medium',
                  'bg-[#5865F2] text-white hover:bg-[#4752C4]',
                  'transition-colors'
                )}
              >
                Message
              </button>
              {!isFriend && (
                <button
                  type="button"
                  onClick={onAddFriend}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-medium',
                    'bg-white/[0.06] text-white/80 hover:bg-white/[0.1]',
                    'border border-white/[0.08] transition-colors'
                  )}
                >
                  Add Friend
                </button>
              )}
            </>
          )}
        </div>

        {/* Name + username + status */}
        <div className="mt-8">
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-sm text-white/40">@{username}</p>
          {customStatus && (
            <p className="mt-1 text-sm text-white/50">
              {customStatus.emoji && <span className="mr-1">{customStatus.emoji}</span>}
              {customStatus.text}
            </p>
          )}
          {bio && <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">{bio}</p>}
        </div>

        {/* Role badges */}
        {roles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {roles.map((role) => (
              <span
                key={role.name}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: role.color + '20',
                  color: role.color,
                }}
              >
                {role.name}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-4 flex gap-6 text-sm">
          <StatItem label="Messages" value={formatCount(stats.messages)} />
          <StatItem label="Friends" value={formatCount(stats.friends)} />
          <StatItem label="Groups" value={formatCount(stats.groups)} />
          <div className="text-white/30">
            <span className="text-white/50">Member since </span>
            {stats.memberSince}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-semibold text-white">{value}</span>{' '}
      <span className="text-white/40">{label}</span>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default ProfileHeader;
