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

import React from 'react';
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
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useNotificationStore } from '@/stores/notificationStore';
import { useChatStore } from '@/stores/chatStore';

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

export const MobileNav: React.FC<MobileNavProps> = ({
  variant = 'default',
  showLabels = true,
  className = '',
}) => {
  const location = useLocation();
  const { unreadCount } = useNotificationStore();
  const { conversations } = useChatStore();

  const unreadMessages = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

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
        <div className="bg-dark-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
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
                    className={`
                      relative flex items-center justify-center
                      ${active ? 'text-primary-400' : 'text-white/60'}
                    `}
                  >
                    <Icon className="h-6 w-6" />
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                  {active && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"
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
        className={`fixed bottom-0 left-0 right-0 z-50 bg-dark-900 border-t border-white/5 safe-area-bottom ${className}`}
      >
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = active ? item.activeIcon : item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className="relative flex-1 flex justify-center p-2"
              >
                <div className={active ? 'text-primary-400' : 'text-white/50'}>
                  <Icon className="h-6 w-6 mx-auto" />
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 min-w-[14px] h-3.5 flex items-center justify-center px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {item.badge > 99 ? '99' : item.badge}
                  </span>
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
      className={`fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom ${className}`}
    >
      <div className="flex items-center justify-around py-2 px-2">
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
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full"
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
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full"
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
