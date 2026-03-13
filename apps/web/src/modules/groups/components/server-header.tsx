/**
 * Server Header — Top bar of the server sidebar
 *
 * Shows server name with a dropdown chevron. Clicking opens a menu with:
 * Invite People, Server Settings, Create Channel, Create Category,
 * Notification Settings, Privacy Settings, Edit Server Profile,
 * Hide Muted Channels, Leave Server (red).
 *
 * @module modules/groups/components/server-header
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  UserPlusIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  FolderPlusIcon,
  BellIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  SpeakerXMarkIcon,
  ArrowRightStartOnRectangleIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/solid';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface ServerHeaderProps {
  serverName: string;
  boostLevel?: number;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  separator?: boolean;
  onClick?: () => void;
}

// ── Menu Items ─────────────────────────────────────────────────────────

const menuItems: MenuItem[] = [
  { id: 'invite', label: 'Invite People', icon: UserPlusIcon },
  { id: 'settings', label: 'Server Settings', icon: Cog6ToothIcon, separator: true },
  { id: 'create-channel', label: 'Create Channel', icon: PlusCircleIcon },
  { id: 'create-category', label: 'Create Category', icon: FolderPlusIcon, separator: true },
  { id: 'notifications', label: 'Notification Settings', icon: BellIcon },
  { id: 'privacy', label: 'Privacy Settings', icon: ShieldCheckIcon },
  { id: 'edit-profile', label: 'Edit Server Profile', icon: PencilSquareIcon, separator: true },
  { id: 'hide-muted', label: 'Hide Muted Channels', icon: SpeakerXMarkIcon, separator: true },
  { id: 'leave', label: 'Leave Server', icon: ArrowRightStartOnRectangleIcon, danger: true },
];

// ── Boost Badge ────────────────────────────────────────────────────────

function BoostBadge({ level }: { level: number }) {
  if (level <= 0) return null;

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-1.5 py-0.5">
      <RocketLaunchIcon className="h-3 w-3 text-white" />
      <span className="text-[10px] font-bold text-white">Lvl {level}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

/** Description. */
/** Server Header component. */
export function ServerHeader({ serverName, boostLevel = 0, className }: ServerHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleMenuClick = useCallback((item: MenuItem) => {
    item.onClick?.();
    setIsOpen(false);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Header button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3',
          'border-b border-black/20 shadow-sm transition-colors',
          isOpen && 'bg-white/[0.06]'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <h2 className="truncate text-[15px] font-semibold text-white">{serverName}</h2>
          {boostLevel > 0 && <BoostBadge level={boostLevel} />}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={springs.snappy}>
          {isOpen ? (
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          )}
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={springs.snappy}
              className={cn(
                'absolute left-2 right-2 top-full z-50 mt-1 overflow-hidden rounded-lg',
                'border border-white/[0.06] bg-[#111214] p-1.5 shadow-xl'
              )}
            >
              {menuItems.map((item) => (
                <div key={item.id}>
                  <motion.button
                    onClick={() => handleMenuClick(item)}
                    whileHover={{
                      backgroundColor: item.danger
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(99, 102, 241, 0.15)',
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                      item.danger ? 'text-red-400' : 'text-gray-300'
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0 opacity-70" />
                    <span className="flex-1">{item.label}</span>
                  </motion.button>
                  {item.separator && <div className="my-1 h-px bg-white/[0.06]" />}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServerHeader;
