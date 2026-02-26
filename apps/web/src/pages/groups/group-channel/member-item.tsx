/**
 * MemberItem Component
 *
 * Displays a single member in the sidebar with avatar,
 * status indicator, and role color.
 */

import type { MemberItemProps } from './types';
import { getAvatarInitial, getDisplayName } from './utils';

/**
 * unknown for the groups module.
 */
/**
 * Member Item component.
 */
export function MemberItem({ member, isOffline = false }: MemberItemProps) {
  const roleColor = member.roles?.[0]?.color;
  const displayName = getDisplayName(member.user.username, member.user.displayName);
  const initial = getAvatarInitial(member.user.username, member.user.displayName);

  return (
    <div
      className={`flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-dark-700 ${
        isOffline ? 'opacity-60' : ''
      }`}
    >
      <div className="relative">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-dark-600">
          {member.user.avatarUrl ? (
            <img
              src={member.user.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">
              {initial}
            </div>
          )}
        </div>
        {!isOffline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-800 bg-green-500" />
        )}
      </div>
      <span
        className="truncate text-sm"
        style={{ color: roleColor || (isOffline ? '#6b7280' : '#ffffff') }}
      >
        {member.nickname || displayName}
      </span>
    </div>
  );
}
