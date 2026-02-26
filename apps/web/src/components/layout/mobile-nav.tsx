/**
 * MobileNav Component
 *
 * Bottom navigation bar for mobile devices.
 * Features:
 * - Fixed bottom position
 * - Icon + label navigation
 * - Active state indicators
 * - Badge support
 * - Haptic feedback
 */

import { durations } from '@cgraph/animation-constants';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  BellIcon as BellIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useNotificationStore } from '@/modules/social/store';
import { useChatStore } from '@/modules/chat/store';
import { tweens, loop } from '@/lib/animation-presets';

export interface MobileNavProps {
  variant?: 'default' | 'floating' | 'minimal';
  showLabels?: boolean;
  className?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

/**
 * unknown for the layout module.
 */
/**
 * Mobile Nav component.
 */
export function MobileNav({
  variant = 'default',
  showLabels = true,
  className = '',
}: MobileNavProps): React.ReactElement {
  const location = useLocation();
  const { unreadCount } = useNotificationStore();
  const { conversations } = useChatStore();

  // Memoize to prevent recalculation on every render
  const unreadMessages = useMemo(
    () => conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0),
    [conversations]
  );

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      path: '/messages',
      label: 'Messages',
      icon: ChatBubbleLeftRightIcon,
      activeIcon: ChatBubbleLeftRightIconSolid,
      badge: unreadMessages,
    },
    {
      path: '/search',
      label: 'Search',
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIconSolid,
    },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: BellIcon,
      activeIcon: BellIconSolid,
      badge: unreadCount,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: UserCircleIcon,
      activeIcon: UserCircleIconSolid,
    },
  ];

  const handleNavClick = () => {
    HapticFeedback.light();
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (variant === 'floating') {
    return (
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
      >
        <div className="rounded-2xl border border-white/10 bg-dark-800/90 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-around p-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = active ? item.activeIcon : item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className="relative p-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`relative flex items-center justify-center ${active ? 'text-primary-400' : 'text-white/60'} `}
                  >
                    <Icon className="h-6 w-6" />
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ scale: { duration: durations.loop.ms / 1000, repeat: Infinity, ease: 'easeInOut' } }}
                        className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                  {active && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary-500"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </motion.nav>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={`safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-dark-900 ${className}`}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = active ? item.activeIcon : item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className="relative flex flex-1 justify-center p-2"
              >
                <div className={active ? 'text-primary-400' : 'text-white/50'}>
                  <Icon className="mx-auto h-6 w-6" />
                </div>
                {item.badge && item.badge > 0 && (
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={loop(tweens.ambient)}
                    className="absolute right-1/4 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                  >
                    {item.badge > 99 ? '99' : item.badge}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </div>
      </motion.nav>
    );
  }

  // Default variant
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-dark-900/95 backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.activeIcon : item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className="relative flex-1"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 py-1"
              >
                <div className="relative">
                  <Icon
                    className={`h-6 w-6 transition-colors ${
                      active ? 'text-primary-400' : 'text-white/50'
                    }`}
                  />
                  {item.badge && item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ scale: { duration: durations.loop.ms / 1000, repeat: Infinity, ease: 'easeInOut' } }}
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.span>
                  )}
                </div>
                {showLabels && (
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      active ? 'text-primary-400' : 'text-white/40'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </motion.div>
              {active && (
                <motion.div
                  layoutId="mobileNavActive"
                  className="absolute -top-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary-500"
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNav;
