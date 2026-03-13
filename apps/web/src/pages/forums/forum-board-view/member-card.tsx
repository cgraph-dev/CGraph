/** MemberCard — displays a forum member with avatar, role badge, and stats. */
import { Link } from 'react-router-dom';
import { UserIcon, StarIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getAvatarBorderId } from '@/lib/utils';
import { InlineTitle } from '@/shared/components/ui/inline-title';
import { ROLE_COLORS } from './constants';
import type { MemberCardProps } from './types';

/**
 * Individual member card component displaying avatar, name, role badge, and stats
 */
export function MemberCard({ member }: MemberCardProps) {
  const roleIcons = {
    owner: StarIcon,
    admin: ShieldCheckIcon,
    moderator: ShieldCheckIcon,
    member: UserIcon,
  };

  const RoleIcon = roleIcons[member.role];

  return (
    <Link
      to={`/profile/${member.userId}`}
      className="flex items-center gap-4 rounded-lg border border-white/[0.08] bg-white/[0.06] p-4 transition-colors hover:border-primary-500/50"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {member.avatarUrl ? (
          <ThemedAvatar
            src={member.avatarUrl}
            alt={member.displayName || 'User'}
            size="medium"
            avatarBorderId={getAvatarBorderId(member)}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
            <UserIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-white">{member.displayName || 'Member'}</h3>
          {member.role !== 'member' && (
            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${ROLE_COLORS[member.role]}`}
            >
              <RoleIcon className="h-3 w-3" />
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </span>
          )}
        </div>
        {member.title && <InlineTitle titleId={member.title} size="xs" />}
        <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
          <span>{member.postCount.toLocaleString()} posts</span>
          <span>
            {member.reputation >= 0 ? '+' : ''}
            {member.reputation} rep
          </span>
          {member.joinedAt && <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </Link>
  );
}
