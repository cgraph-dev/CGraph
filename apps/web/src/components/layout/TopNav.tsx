/**
 * TopNav Component
 *
 * Top navigation bar with search, notifications, and user menu.
 * Features:
 * - Global search
 * - Notification bell with badge
 * - User dropdown menu
 * - Breadcrumbs
 * - Mobile menu toggle
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { getAvatarBorderId } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePremiumStore } from '@/modules/premium/store';

export interface TopNavProps {
  variant?: 'default' | 'transparent' | 'solid';
  showSearch?: boolean;
  showBreadcrumbs?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  variant = 'default',
  showSearch = true,
  showBreadcrumbs = true,
  showNotifications = true,
  showUserMenu = true,
  onMenuToggle,
  isMobileMenuOpen = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Theme is always dark mode
  const isDarkMode = true;
  const toggleDarkMode = () => {};
  const { user, logout } = useAuthStore();
  const { unreadCount, notifications } = useNotificationStore();
  const { isSubscribed } = usePremiumStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Generate breadcrumbs from current path
  const breadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return pathSegments.map((segment, index) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      path:
        index < pathSegments.length - 1
          ? '/' + pathSegments.slice(0, index + 1).join('/')
          : undefined,
    }));
  }, [location.pathname]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    HapticFeedback.medium();
    logout();
    navigate('/login');
  };

  const getBackgroundClass = () => {
    switch (variant) {
      case 'transparent':
        return 'bg-transparent';
      case 'solid':
        return 'bg-dark-900';
      default:
        return 'bg-dark-900/80 backdrop-blur-xl';
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-30 border-b border-white/5 ${getBackgroundClass()} ${className} `}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        {/* Left section: Menu toggle and breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button onClick={onMenuToggle} className="rounded-lg p-2 hover:bg-white/10 lg:hidden">
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-white" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Breadcrumbs */}
          {showBreadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden items-center gap-1 text-sm md:flex">
              <Link to="/" className="text-white/40 transition-colors hover:text-white">
                Home
              </Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.label}>
                  <ChevronRightIcon className="h-4 w-4 text-white/20" />
                  {crumb.path ? (
                    <Link
                      to={crumb.path}
                      className="text-white/40 transition-colors hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-white">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Center section: Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="hidden max-w-md flex-1 sm:block">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <motion.input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                animate={{
                  backgroundColor: isSearchFocused
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                }}
                className="w-full rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <XMarkIcon className="h-4 w-4 text-white/40 hover:text-white" />
                </button>
              )}
            </div>
          </form>
        )}

        {/* Right section: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className="rounded-lg p-2 hover:bg-white/10"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 text-white/60" />
            ) : (
              <MoonIcon className="h-5 w-5 text-white/60" />
            )}
          </motion.button>

          {/* Notifications */}
          {showNotifications && (
            <div ref={notificationRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  HapticFeedback.light();
                  setShowNotificationPanel(!showNotificationPanel);
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

              {/* Notification dropdown */}
              <AnimatePresence>
                {showNotificationPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80"
                  >
                    <GlassCard variant="crystal" className="max-h-96 overflow-y-auto p-2">
                      <div className="flex items-center justify-between border-b border-white/10 p-2">
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
                        onClick={() => setShowNotificationPanel(false)}
                        className="block border-t border-white/10 p-2 text-center text-sm text-primary-400 hover:text-primary-300"
                      >
                        View all notifications
                      </Link>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User menu */}
          {showUserMenu && user && (
            <div ref={userMenuRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  HapticFeedback.light();
                  setShowUserDropdown(!showUserDropdown);
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

              {/* User dropdown */}
              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56"
                  >
                    <GlassCard variant="crystal" className="p-2">
                      <div className="border-b border-white/10 p-3">
                        <p className="font-medium text-white">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-sm text-white/40">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                        >
                          <UserCircleIcon className="h-5 w-5" />
                          Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                        >
                          <Cog6ToothIcon className="h-5 w-5" />
                          Settings
                        </Link>
                        {!isSubscribed && (
                          <Link
                            to="/premium"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-amber-400 hover:bg-white/10"
                          >
                            <SparklesIcon className="h-5 w-5" />
                            Upgrade to Premium
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-white/10 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:bg-red-500/10"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          Sign Out
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default TopNav;
