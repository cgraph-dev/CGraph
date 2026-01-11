import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useGroupStore } from '@/stores/groupStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { socketManager } from '@/lib/socket';
import { ToastContainer } from '@/components/ui';
import { useThemeEnhanced } from '@/contexts/ThemeContextEnhanced';
import ShaderBackground from '@/components/shaders/ShaderBackground';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UsersIcon as UsersIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  BellIcon as BellIconSolid,
  TrophyIcon as TrophyIconSolid,
} from '@heroicons/react/24/solid';

const navItems = [
  {
    path: '/messages',
    label: 'Messages',
    icon: ChatBubbleLeftRightIcon,
    activeIcon: ChatBubbleLeftRightIconSolid,
  },
  {
    path: '/friends',
    label: 'Friends',
    icon: UsersIcon,
    activeIcon: UsersIconSolid,
  },
  {
    path: '/notifications',
    label: 'Notifications',
    icon: BellIcon,
    activeIcon: BellIconSolid,
  },
  {
    path: '/search',
    label: 'Search',
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingGlassIconSolid,
  },
  {
    path: '/groups',
    label: 'Groups',
    icon: UserGroupIcon,
    activeIcon: UserGroupIconSolid,
  },
  {
    path: '/forums',
    label: 'Forums',
    icon: NewspaperIcon,
    activeIcon: NewspaperIconSolid,
  },
  {
    path: '/leaderboard',
    label: 'Leaderboard',
    icon: TrophyIcon,
    activeIcon: TrophyIconSolid,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothIconSolid,
  },
];

export default function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { fetchConversations, conversations } = useChatStore();
  const { fetchGroups } = useGroupStore();
  const { fetchNotifications, unreadCount } = useNotificationStore();
  const { theme, preferences } = useThemeEnhanced();

  // Get background settings from preferences
  const backgroundSettings = useMemo(() => ({
    effect: preferences.settings.backgroundEffect || 'none',
    variant: preferences.settings.shaderVariant || 'matrix',
    intensity: preferences.settings.backgroundIntensity || 0.6,
  }), [preferences.settings.backgroundEffect, preferences.settings.shaderVariant, preferences.settings.backgroundIntensity]);

  // Get colors for shader background based on theme
  const shaderColors = useMemo(() => {
    if (theme.category === 'special' || theme.id === 'matrix') {
      return {
        color1: theme.colors.primary,
        color2: theme.colors.background,
        color3: theme.colors.holoAccent,
      };
    }
    return {
      color1: theme.colors.primary,
      color2: theme.colors.background,
      color3: theme.colors.accent,
    };
  }, [theme]);

  // Initialize socket and fetch data on mount
  useEffect(() => {
    const initializeApp = async () => {
      await socketManager.connect();
      
      // Join user's personal channel for real-time notifications
      if (user?.id) {
        socketManager.joinUserChannel(user.id);
      }
      
      fetchConversations();
      fetchGroups();
      fetchNotifications();
    };
    
    initializeApp();

    return () => {
      // Leave user channel on unmount but keep socket alive
      if (user?.id) {
        socketManager.leaveUserChannel(user.id);
      }
    };
  }, [fetchConversations, fetchGroups, fetchNotifications, user?.id]);

  const handleLogout = async () => {
    socketManager.disconnect();
    await logout();
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="flex h-screen text-white relative" style={{ background: theme.colors.background }}>
      {/* Dynamic Background Effect */}
      {backgroundSettings.effect === 'shader' && (
        <ShaderBackground
          variant={backgroundSettings.variant}
          color1={shaderColors.color1}
          color2={shaderColors.color2}
          color3={shaderColors.color3}
          speed={0.6}
          intensity={backgroundSettings.intensity}
          interactive={false}
          className="fixed inset-0 -z-10"
        />
      )}
      
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      
      {/* Sidebar */}
      <aside
        className="w-20 bg-dark-900/50 backdrop-blur-xl border-r border-primary-500/20 flex flex-col items-center py-4 z-10 relative overflow-hidden"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Ambient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Logo */}
        <motion.div
          className="mb-6 relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <GlassCard
              variant="holographic"
              glow
              glowColor="rgba(16, 185, 129, 0.5)"
              className="h-12 w-12 rounded-xl p-0 flex items-center justify-center cursor-pointer"
              role="img"
              aria-label="CGraph logo"
            >
              <div className="relative z-10">
                <svg
                  className="h-7 w-7 text-white drop-shadow-lg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </GlassCard>
          </motion.div>

          {/* Pulsing ring effect around logo */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-primary-500/30 pointer-events-none"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2 relative z-10" aria-label="Primary">
          {navItems.map((item, index) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: 0.1 + index * 0.05,
                }}
              >
                <NavLink
                  to={item.path}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => HapticFeedback.light()}
                  title={item.label}
                  className="relative block"
                >
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="relative"
                  >
                    {isActive ? (
                      <GlassCard
                        variant="neon"
                        glow
                        glowColor="rgba(16, 185, 129, 0.6)"
                        className="w-12 h-12 rounded-xl p-0 flex items-center justify-center"
                      >
                        <div className="relative z-10">
                          <Icon
                            className="h-6 w-6 text-white drop-shadow-lg"
                            style={{
                              filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))',
                            }}
                          />
                        </div>
                      </GlassCard>
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 group relative overflow-hidden">
                        {/* Hover glow effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={false}
                        />
                        <Icon className="h-6 w-6 relative z-10 transition-transform group-hover:scale-110" />
                      </div>
                    )}

                    {/* Badge for messages */}
                    <AnimatePresence>
                      {item.path === '/messages' && totalUnread > 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-xs font-bold flex items-center justify-center text-white shadow-lg z-20"
                          style={{
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
                          }}
                        >
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Badge for notifications */}
                    <AnimatePresence>
                      {item.path === '/notifications' && unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-xs font-bold flex items-center justify-center text-white shadow-lg z-20"
                          style={{
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
                          }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active indicator line */}
                    {isActive && (
                      <motion.div
                        className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-500"
                        layoutId="activeIndicator"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                        }}
                      />
                    )}
                  </motion.div>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* User Avatar & Logout */}
        <div className="mt-auto space-y-2 relative z-10" role="group" aria-label="User actions">
          {/* Logout Button */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <button
              onClick={() => {
                HapticFeedback.medium();
                handleLogout();
              }}
              className="relative w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-dark-800 group overflow-hidden"
              title="Logout"
              aria-label="Logout from your account"
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-pink-600/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <ArrowRightOnRectangleIcon
                className="h-6 w-6 relative z-10 transition-all group-hover:scale-110"
                aria-hidden="true"
                style={{
                  filter: 'drop-shadow(0 0 0 transparent)',
                  transition: 'filter 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0 transparent)';
                }}
              />
            </button>
          </motion.div>

          {/* User Avatar */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative"
          >
            <div
              className="w-12 h-12 rounded-xl overflow-hidden p-0.5 bg-gradient-to-br from-primary-500 to-purple-600 cursor-pointer"
              role="img"
              aria-label={`Your profile picture: ${user?.displayName || user?.username || 'User'}`}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || user.username || 'User avatar'}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-700 flex items-center justify-center text-lg font-bold rounded-lg">
                  {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Pulsing glow around avatar */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-primary-500/40 pointer-events-none"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(16, 185, 129, 0.6)',
                  '0 0 0 8px rgba(16, 185, 129, 0)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        id="main-content" 
        className="flex-1 flex overflow-hidden z-10" 
        role="main"
        style={{
          background: backgroundSettings.effect !== 'none' 
            ? `${theme.colors.background}dd` // Semi-transparent overlay
            : undefined,
        }}
      >
        <Outlet />
      </main>
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
