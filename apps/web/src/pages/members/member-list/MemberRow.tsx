/**
 * MemberRow component - individual member table row
 */

import { Link } from 'react-router-dom';
import {
  UserIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';
import UserStars from '@/components/common/UserStars';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { formatDate, formatRelativeTime } from './utils';
import type { Member } from './types';

interface MemberRowProps {
  member: Member;
}

export function MemberRow({ member }: MemberRowProps) {
  return (
    <tr className="border-border hover:bg-muted/30 border-b transition-colors last:border-0">
      {/* Member */}
      <td className="px-4 py-3">
        <Link to={`/profile/${member.username}`} className="group flex items-center gap-3">
          <div className="relative">
            {member.avatarUrl ? (
              <ThemedAvatar
                src={member.avatarUrl}
                alt={member.displayName || member.username}
                size="small"
                className="h-10 w-10"
                avatarBorderId={member.avatarBorderId}
              />
            ) : (
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <UserIcon className="text-primary h-5 w-5" />
              </div>
            )}
            <OnlineStatusIndicator
              status={member.isOnline ? 'online' : 'offline'}
              size="sm"
              className="absolute -bottom-0.5 -right-0.5"
            />
          </div>
          <div>
            <span
              className="group-hover:text-primary font-medium transition-colors"
              style={{ color: member.userGroupColor || undefined }}
            >
              {member.displayName || member.username}
            </span>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>@{member.username}</span>
              {member.stars > 0 && <UserStars count={member.stars} size="xs" />}
            </div>
          </div>
        </Link>
      </td>

      {/* Group */}
      <td className="hidden px-4 py-3 sm:table-cell">
        <span
          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: member.userGroupColor ? `${member.userGroupColor}20` : undefined,
            color: member.userGroupColor || undefined,
          }}
        >
          {member.userGroup}
        </span>
      </td>

      {/* Joined */}
      <td className="text-muted-foreground hidden px-4 py-3 text-sm md:table-cell">
        <div className="flex items-center gap-1.5">
          <CalendarDaysIcon className="h-4 w-4" />
          {formatDate(member.joinedAt)}
        </div>
      </td>

      {/* Posts */}
      <td className="hidden px-4 py-3 text-center lg:table-cell">
        <div className="flex items-center justify-center gap-1.5 text-sm">
          <ChatBubbleLeftIcon className="text-muted-foreground h-4 w-4" />
          <span>{(member?.postCount ?? 0).toLocaleString()}</span>
        </div>
      </td>

      {/* Reputation */}
      <td className="hidden px-4 py-3 text-center lg:table-cell">
        <div
          className={`flex items-center justify-center gap-1 text-sm ${
            member.reputation > 0
              ? 'text-green-500'
              : member.reputation < 0
                ? 'text-red-500'
                : 'text-muted-foreground'
          }`}
        >
          {member.reputation > 0 ? (
            <StarSolidIcon className="h-4 w-4" />
          ) : (
            <StarIcon className="h-4 w-4" />
          )}
          <span>
            {member.reputation >= 0 ? '+' : ''}
            {member.reputation}
          </span>
        </div>
      </td>

      {/* Last Active */}
      <td className="text-muted-foreground hidden px-4 py-3 text-sm xl:table-cell">
        {formatRelativeTime(member.lastActive)}
      </td>
    </tr>
  );
}
