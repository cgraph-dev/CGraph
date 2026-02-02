import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import AnimatedLogo from '@/components/AnimatedLogo';
import { useChatStore } from '@/stores/chatStore';
import { useGroupStore } from '@/stores/groupStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { socketManager } from '@/lib/socket';
import { ToastContainer } from '@/components/ui';
import { useThemeEnhanced } from '@/contexts/ThemeContextEnhanced';
import ShaderBackground from '@/components/shaders/ShaderBackground';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { getAvatarBorderId } from '@/lib/utils';
import { pageTransitions, buttonVariantsSubtle } from '@/lib/animations/transitions';

// Reserved for future animation enhancements
void pageTransitions;
void buttonVariantsSubtle;
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  NewspaperIcon,
  PaintBrushIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UsersIcon as UsersIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  PaintBrushIcon as PaintBrushIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

const navItems = [
  {
    path: '/messages',
    label: 'Messages',
    icon: ChatBubbleLeftRightIcon,
    activeIcon: ChatBubbleLeftRightIconSolid,
  },
  {
    path: '/social',
    label: 'Social',
    icon: UsersIcon,
    activeIcon: UsersIconSolid,
  },
  {
    path: '/forums',
    label: 'Forums',
    icon: NewspaperIcon,
    activeIcon: NewspaperIconSolid,
  },
  {
    path: '/customize',
    label: 'Customize',
    icon: PaintBrushIcon,
    activeIcon: PaintBrushIconSolid,
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: UserCircleIcon,
    activeIcon: UserCircleIconSolid,
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
  const backgroundSettings = useMemo(
    () => ({
      effect: preferences.settings.backgroundEffect || 'none',
      variant: preferences.settings.shaderVariant || 'matrix',
      intensity: preferences.settings.backgroundIntensity || 0.6,
    }),
    [
      preferences.settings.backgroundEffect,
      preferences.settings.shaderVariant,
      preferences.settings.backgroundIntensity,
    ]
  );

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
    <div
      className="relative flex h-screen text-white"
      style={{ background: theme.colors.background }}
    >
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside
        className="relative z-10 flex w-20 flex-col items-center overflow-hidden border-r border-primary-500/20 bg-dark-900/50 py-4 backdrop-blur-xl"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Ambient glow effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
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

        {/* Logo - Links back to landing page */}
        <motion.div
          className="relative mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <Link to="/" title="Back to Home">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              role="img"
              aria-label="CGraph logo - Click to go home"
            >
              <AnimatedLogo size="sm" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Navigation */}
        <nav className="relative z-10 flex flex-1 flex-col items-center gap-2" aria-label="Primary">
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
                        className="flex h-12 w-12 items-center justify-center rounded-xl p-0"
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
                      <div className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-gray-400 transition-all duration-200 hover:text-white">
                        {/* Hover glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          initial={false}
                        />
                        <Icon className="relative z-10 h-6 w-6 transition-transform group-hover:scale-110" />
                      </div>
                    )}

                    {/* Badge for messages */}
                    <AnimatePresence>
                      {item.path === '/messages' && totalUnread > 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          className="absolute -right-1 -top-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 px-1 text-xs font-bold text-white shadow-lg"
                          style={{
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
                          }}
                        >
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Badge for social (notifications) */}
                    <AnimatePresence>
                      {item.path === '/social' && unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          className="absolute -right-1 -top-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 px-1 text-xs font-bold text-white shadow-lg"
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
                        className="absolute -left-3 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-500"
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
        <div className="relative z-10 mt-auto space-y-2" role="group" aria-label="User actions">
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
              className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-gray-400 transition-all hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              title="Logout"
              aria-label="Logout from your account"
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/20 via-pink-600/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                initial={false}
              />
              <ArrowRightOnRectangleIcon
                className="relative z-10 h-6 w-6 transition-all group-hover:scale-110"
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
              className="h-12 w-12 cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 p-0.5"
              role="img"
              aria-label={`Your profile picture: ${user?.displayName || user?.username || 'User'}`}
            >
              {user?.avatarUrl ? (
                <ThemedAvatar
                  src={user.avatarUrl}
                  alt={user.displayName || user.username || 'User avatar'}
                  size="medium"
                  className="h-full w-full rounded-lg"
                  avatarBorderId={getAvatarBorderId(user)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-purple-700 text-lg font-bold">
                  {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Pulsing glow around avatar */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary-500/40"
              animate={{
                boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.6)', '0 0 0 8px rgba(16, 185, 129, 0)'],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id="main-content"
        className="z-10 flex flex-1 overflow-hidden"
        role="main"
        style={{
          background:
            backgroundSettings.effect !== 'none'
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
