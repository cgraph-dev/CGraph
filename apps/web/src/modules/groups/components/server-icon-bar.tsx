/**
 * Server Icon Bar — Discord far-left sidebar
 *
 * Vertical bar (72px) showing server icons with:
 * - Home (DM) button at top with separator
 * - Server icons with squircle hover transition
 * - Unread pill indicators on left edge
 * - Active server highlight (squircle border-radius)
 * - Add Server / Discover buttons at bottom
 * - Tooltip on hover (right side)
 *
 * @module modules/groups/components/server-icon-bar
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, PlusIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import { ScrollArea } from '@/components/ui/scroll-area';
import Tooltip from '@/components/ui/tooltip';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface ServerIconBarProps {
  className?: string;
}

interface ServerEntry {
  id: string;
  name: string;
  iconUrl?: string;
  hasUnread?: boolean;
  mentionCount?: number;
}

// ── Pill Indicator ─────────────────────────────────────────────────────

function UnreadPill({
  active,
  hasUnread,
  mentionCount,
}: {
  active: boolean;
  hasUnread?: boolean;
  mentionCount?: number;
}) {
  const show = active || hasUnread || (mentionCount && mentionCount > 0);
  if (!show) return null;

  return (
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      exit={{ scaleY: 0 }}
      className={cn(
        'absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-white transition-all',
        active ? 'h-9' : 'h-2',
        hasUnread && !active && 'h-2'
      )}
    />
  );
}

// ── Server Icon ────────────────────────────────────────────────────────

function ServerIcon({ server, isActive }: { server: ServerEntry; isActive: boolean }) {
  return (
    <Tooltip content={server.name} side="right">
      <NavLink
        to={`/groups/${server.id}`}
        className="group relative flex items-center justify-center"
      >
        <AnimatePresence>
          <UnreadPill
            active={isActive}
            hasUnread={server.hasUnread}
            mentionCount={server.mentionCount}
          />
        </AnimatePresence>

        <motion.div
          whileHover={{ borderRadius: '35%' }}
          animate={{
            borderRadius: isActive ? '35%' : '50%',
          }}
          transition={springs.snappy}
          className={cn(
            'relative flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden',
            'bg-white/[0.06] transition-colors hover:bg-primary-600',
            isActive && 'bg-primary-600'
          )}
          style={{
            boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.3)' : undefined,
          }}
        >
          {server.iconUrl ? (
            <img src={server.iconUrl} alt={server.name} className="h-full w-full object-cover" />
          ) : (
            <span className="select-none text-sm font-bold text-white">
              {server.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </motion.div>

        {/* Mention badge */}
        {(server.mentionCount ?? 0) > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springs.superBouncy}
            className="absolute -bottom-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[#1e1f22] bg-red-500 px-1"
          >
            <span className="text-[10px] font-bold text-white">
              {(server.mentionCount ?? 0) > 99 ? '99+' : server.mentionCount}
            </span>
          </motion.div>
        )}
      </NavLink>
    </Tooltip>
  );
}

// ── Action Button ──────────────────────────────────────────────────────

function ActionButton({
  icon: Icon,
  label,
  onClick,
  colorClass = 'text-green-500 hover:bg-green-500 hover:text-white',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <Tooltip content={label} side="right">
      <motion.button
        onClick={onClick}
        whileHover={{ borderRadius: '35%' }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full',
          'bg-white/[0.06] transition-colors',
          colorClass
        )}
      >
        <Icon className="h-5 w-5" />
      </motion.button>
    </Tooltip>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

/** Mock servers — replace with store data */
const MOCK_SERVERS: ServerEntry[] = [
  { id: '1', name: 'Gaming', hasUnread: true },
  { id: '2', name: 'Design Team', mentionCount: 3 },
  { id: '3', name: 'CGraph Dev' },
  { id: '4', name: 'Music Lovers', hasUnread: true },
];

/** Description. */
/** Server Icon Bar component. */
export function ServerIconBar({ className }: ServerIconBarProps) {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const handleHome = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  return (
    <div className={cn('flex h-full w-[72px] flex-col items-center bg-[#1e1f22] py-3', className)}>
      {/* Home / DMs button */}
      <Tooltip content="Direct Messages" side="right">
        <motion.button
          onClick={handleHome}
          whileHover={{ borderRadius: '35%' }}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            'bg-white/[0.06] transition-colors hover:bg-primary-600',
            !groupId && 'bg-primary-600'
          )}
          animate={{
            borderRadius: !groupId ? '35%' : '50%',
          }}
          transition={springs.snappy}
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        </motion.button>
      </Tooltip>

      {/* Separator */}
      <div className="my-2 h-[2px] w-8 rounded-full bg-white/[0.08]" />

      {/* Server List (scrollable) */}
      <ScrollArea className="w-full flex-1">
        <div className="flex flex-col items-center gap-2 px-3">
          {MOCK_SERVERS.map((server) => (
            <ServerIcon key={server.id} server={server} isActive={groupId === server.id} />
          ))}
        </div>
      </ScrollArea>

      {/* Separator */}
      <div className="my-2 h-[2px] w-8 rounded-full bg-white/[0.08]" />

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-2">
        <ActionButton
          icon={PlusIcon}
          label="Add a Server"
          onClick={() => navigate('/groups/create')}
        />
        <ActionButton
          icon={GlobeAltIcon}
          label="Explore Public Servers"
          onClick={() => navigate('/groups/discover')}
          colorClass="text-emerald-500 hover:bg-emerald-500 hover:text-white"
        />
      </div>
    </div>
  );
}

export default ServerIconBar;
