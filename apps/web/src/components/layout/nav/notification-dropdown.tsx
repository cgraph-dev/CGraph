/**
 * Notification Dropdown
 *
 * Bell icon with unread badge and a slide-down notification list panel.
 *
 * @module components/layout/nav/NotificationDropdown
 */

import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { glassSurfaceElevated } from '@/components/liquid-glass/shared';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useNotificationStore } from '@/modules/social/store';

/** Notification dropdown bell + panel */
export function NotificationDropdown() {
  const { unreadCount, notifications } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); // type assertion: EventTarget to Node for contains check
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          HapticFeedback.light();
          setOpen((v) => !v);
        }}
        className="relative rounded-lg p-2 hover:bg-white/10"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-5 w-5 text-white" />
        ) : (
          <BellIcon className="h-5 w-5 text-white/60" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80"
          >
            <div className={`max-h-96 overflow-y-auto rounded-xl p-2 ${glassSurfaceElevated}`}>
              <div className="flex items-center justify-between border-b border-white/[0.06] p-2">
                <h3 className="font-semibold text-white">Notifications</h3>
                <button className="text-xs text-primary-400 hover:text-primary-300">
                  Mark all read
                </button>
              </div>
              {notifications.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className="cursor-pointer rounded-lg p-2 hover:bg-white/5"
                    >
                      <p className="text-sm text-white">{notification.title}</p>
                      <p className="mt-1 text-xs text-white/40">{notification.createdAt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-white/40">No notifications</div>
              )}
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block border-t border-white/[0.06] p-2 text-center text-sm text-primary-400 hover:text-primary-300"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
