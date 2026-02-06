/**
 * MemberStatsCards component - statistics summary cards
 */

import { UserGroupIcon, CalendarDaysIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { formatDate } from './utils';
import type { Member } from './types';

interface MemberStatsCardsProps {
  totalMembers: number;
  members: Member[];
}

export function MemberStatsCards({ totalMembers, members }: MemberStatsCardsProps) {
  const onlineCount = members.filter((m) => m.isOnline).length;
  const totalPosts = members.reduce((sum, m) => sum + m.postCount, 0);
  const newestMemberDate =
    members.length > 0
      ? formatDate(
          members.reduce((latest, m) =>
            new Date(m.joinedAt) > new Date(latest.joinedAt) ? m : latest
          ).joinedAt
        )
      : '-';

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="bg-card border-border rounded-lg border p-4 text-center">
        <UserGroupIcon className="text-primary mx-auto mb-2 h-6 w-6" />
        <div className="text-foreground text-2xl font-bold">
          {(totalMembers ?? 0).toLocaleString()}
        </div>
        <div className="text-muted-foreground text-sm">Total Members</div>
      </div>
      <div className="bg-card border-border rounded-lg border p-4 text-center">
        <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center">
          <span className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
        </div>
        <div className="text-foreground text-2xl font-bold">{onlineCount}</div>
        <div className="text-muted-foreground text-sm">Currently Online</div>
      </div>
      <div className="bg-card border-border rounded-lg border p-4 text-center">
        <CalendarDaysIcon className="text-primary mx-auto mb-2 h-6 w-6" />
        <div className="text-foreground text-2xl font-bold">{newestMemberDate}</div>
        <div className="text-muted-foreground text-sm">Newest Member</div>
      </div>
      <div className="bg-card border-border rounded-lg border p-4 text-center">
        <ChatBubbleLeftIcon className="text-primary mx-auto mb-2 h-6 w-6" />
        <div className="text-foreground text-2xl font-bold">{totalPosts.toLocaleString()}</div>
        <div className="text-muted-foreground text-sm">Total Posts</div>
      </div>
    </div>
  );
}
