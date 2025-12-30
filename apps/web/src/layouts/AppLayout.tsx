import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useGroupStore } from '@/stores/groupStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { socketManager } from '@/lib/socket';
import { ToastContainer } from '@/components/ui';
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
    path: '/community/leaderboard',
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

  // Initialize socket and fetch data on mount
  useEffect(() => {
    socketManager.connect();
    fetchConversations();
    fetchGroups();
    fetchNotifications();

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, [fetchConversations, fetchGroups, fetchNotifications]);

  const handleLogout = async () => {
    socketManager.disconnect();
    await logout();
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="flex h-screen bg-dark-900 text-white">
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      
      {/* Sidebar */}
      <aside 
        className="w-20 bg-dark-800 border-r border-dark-700 flex flex-col items-center py-4"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="mb-6">
          <div 
            className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center"
            role="img"
            aria-label="CGraph logo"
          >
            <svg
              className="h-7 w-7 text-white"
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
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="h-6 w-6" />
                {item.path === '/messages' && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Avatar & Logout */}
        <div className="mt-auto space-y-2" role="group" aria-label="User actions">
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-dark-800"
            title="Logout"
            aria-label="Logout from your account"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div 
            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-dark-600"
            role="img"
            aria-label={`Your profile picture: ${user?.displayName || user?.username || 'User'}`}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName || user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-600 flex items-center justify-center text-lg font-bold">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex overflow-hidden" role="main">
        <Outlet />
      </main>
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
