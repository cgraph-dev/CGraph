import { useState } from 'react';
import { format } from 'date-fns';
import { formatTimeAgo } from '@/lib/utils';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { StatusBadge } from '@/modules/admin/components';
import { BanUserModal } from '@/pages/admin/tabs/users/ban-user-modal';
import type { AdminUser } from '@/types/admin.types';

interface UserRowProps {
  user: AdminUser;
  onBan: (reason: string, duration?: number) => void;
  onUnban: () => void;
  isBanning: boolean;
  isUnbanning: boolean;
}

export function UserRow({ user, onBan, onUnban, isBanning, isUnbanning }: UserRowProps) {
  const [showBanModal, setShowBanModal] = useState(false);

  return (
    <>
      <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="whitespace-nowrap px-6 py-4">
          <div className="flex items-center space-x-3">
            <ThemedAvatar
              src={
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${user.username}&background=random`
              }
              alt={user.username}
              size="small"
              className="h-10 w-10"
              avatarBorderId={user.avatarBorderId ?? user.avatar_border_id ?? null}
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.displayName || user.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username} • {user.email}
              </p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <StatusBadge status={user.status} />
          {user.isPremium && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Premium
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(user.insertedAt), 'MMM d, yyyy')}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {user.lastSeenAt ? formatTimeAgo(user.lastSeenAt) : 'Never'}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-right">
          {user.status === 'banned' ? (
            <button
              onClick={onUnban}
              disabled={isUnbanning}
              className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
            >
              {isUnbanning ? 'Unbanning...' : 'Unban'}
            </button>
          ) : (
            <button
              onClick={() => setShowBanModal(true)}
              disabled={isBanning}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
            >
              Ban
            </button>
          )}
        </td>
      </tr>

      {showBanModal && (
        <BanUserModal
          user={user}
          onConfirm={(reason, duration) => {
            onBan(reason, duration);
            setShowBanModal(false);
          }}
          onClose={() => setShowBanModal(false)}
        />
      )}
    </>
  );
}
