/**
 * User Dropdown Menu
 *
 * Avatar button with a profile/settings/logout dropdown panel.
 *
 * @module components/layout/nav/UserDropdown
 */

import { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { glassSurfaceElevated } from '@/components/liquid-glass/shared';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/store';
import { usePremiumStore } from '@/modules/premium/store';

/** User avatar button + dropdown menu */
export function UserDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isSubscribed } = usePremiumStore();
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

  const handleLogout = () => {
    HapticFeedback.medium();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          HapticFeedback.light();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-white/10"
      >
        <ThemedAvatar
          src={user.avatarUrl}
          alt={user.displayName || user.username || 'User'}
          size="small"
          avatarBorderId={getAvatarBorderId(user)}
        />
        {isSubscribed && <SparklesIcon className="h-4 w-4 text-amber-400" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56"
          >
            <div className={`rounded-xl p-2 ${glassSurfaceElevated}`}>
              <div className="border-b border-white/[0.06] p-3">
                <p className="font-medium text-white">{user.displayName || user.username}</p>
                <p className="text-sm text-white/40">{user.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <UserCircleIcon className="h-5 w-5" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  Settings
                </Link>
                {!isSubscribed && (
                  <Link
                    to="/premium"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-amber-400 hover:bg-white/10"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    Upgrade to Premium
                  </Link>
                )}
              </div>

              <div className="border-t border-white/[0.06] pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:bg-red-500/10"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
