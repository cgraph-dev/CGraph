/**
 * OnlineNowRow — Messenger-style horizontal row of online friends.
 * @module modules/chat/components/conversation-list/online-now-row
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface OnlineUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface OnlineNowRowProps {
  users: OnlineUser[];
  onUserPress?: (userId: string) => void;
  className?: string;
}

/**
 * Horizontal scrollable row of online friends with green status dots.
 */
export function OnlineNowRow({
  users,
  onUserPress,
  className,
}: OnlineNowRowProps) {
  if (users.length === 0) return null;

  return (
    <div className={cn('border-b border-white/[0.06] px-3 py-2', className)}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/30">
          Online Now
        </span>
        <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
          {users.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none">
        {users.map((user, i) => (
          <motion.button
            key={user.id}
            type="button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => onUserPress?.(user.id)}
            className="flex flex-shrink-0 flex-col items-center gap-0.5"
          >
            <Avatar
              size="sm"
              name={user.name}
              src={user.avatarUrl}
              status="online"
            />
            <span className="max-w-[40px] truncate text-[9px] text-white/30">
              {user.name.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default OnlineNowRow;
