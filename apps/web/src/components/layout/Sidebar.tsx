/**
 * Sidebar Component
 *
 * Collapsible sidebar navigation with groups, channels, and quick actions.
 * Features:
 * - Collapsible/expandable
 * - Group/server list
 * - Quick action buttons
 * - User status
 * - Premium badge
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  CogIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { getAvatarBorderId } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useGroupStore } from '@/stores/groupStore';
import { usePremiumStore } from '@/modules/premium/store';

export interface SidebarProps {
  variant?: 'default' | 'compact' | 'floating';
  defaultCollapsed?: boolean;
  showGroups?: boolean;
  showQuickActions?: boolean;
  showUserStatus?: boolean;
  onGroupSelect?: (groupId: string) => void;
  className?: string;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  variant = 'default',
  defaultCollapsed = false,
  showGroups = true,
  showQuickActions = true,
  showUserStatus = true,
  onGroupSelect,
  className = '',
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { groups } = useGroupStore();
  const { isSubscribed } = usePremiumStore();

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const toggleCollapsed = useCallback(() => {
    HapticFeedback.light();
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const handleGroupClick = useCallback(
    (groupId: string) => {
      HapticFeedback.light();
      onGroupSelect?.(groupId);
      navigate(`/groups/${groupId}`);
    },
    [navigate, onGroupSelect]
  );

  const quickActions: QuickAction[] = [
    {
      icon: <HomeIcon className="h-5 w-5" />,
      label: 'Home',
      onClick: () => navigate('/'),
    },
    {
      icon: <MagnifyingGlassIcon className="h-5 w-5" />,
      label: 'Search',
      onClick: () => navigate('/search'),
    },
    {
      icon: <PlusIcon className="h-5 w-5" />,
      label: 'Create',
      onClick: () => navigate('/groups/create'),
    },
  ];

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed bottom-4 left-4 top-4 z-40 ${className}`}
      >
        <GlassCard
          variant="crystal"
          className={`h-full ${sidebarWidth} flex flex-col p-2 transition-all duration-300`}
        >
          {/* Toggle button */}
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 top-8 rounded-full border border-white/10 bg-dark-800 p-1.5 hover:bg-dark-700"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-white" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-white" />
            )}
          </button>

          {/* Groups list */}
          {showGroups && (
            <div className="flex-1 space-y-2 overflow-y-auto">
              {groups.map((group) => (
                <motion.button
                  key={group.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onHoverStart={() => setHoveredGroup(group.id)}
                  onHoverEnd={() => setHoveredGroup(null)}
                  onClick={() => handleGroupClick(group.id)}
                  className={`relative w-full rounded-xl p-2 transition-colors ${hoveredGroup === group.id ? 'bg-white/10' : 'hover:bg-white/5'} `}
                >
                  <div className="flex items-center gap-3">
                    <ThemedAvatar src={group.iconUrl} alt={group.name} size="medium" />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="truncate text-sm font-medium text-white"
                        >
                          {group.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hover tooltip for collapsed state */}
                  {isCollapsed && hoveredGroup === group.id && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg bg-dark-800 px-3 py-1.5 text-sm text-white"
                    >
                      {group.name}
                    </motion.div>
                  )}
                </motion.button>
              ))}

              {/* Add group button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/groups/create')}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 p-2 hover:border-primary-500/50"
              >
                <PlusIcon className="h-5 w-5 text-white/40" />
                {!isCollapsed && <span className="text-sm text-white/40">Add Group</span>}
              </motion.button>
            </div>
          )}

          {/* Quick actions */}
          {showQuickActions && (
            <div
              className={`mt-2 border-t border-white/10 pt-2 ${isCollapsed ? 'space-y-2' : 'flex gap-2'}`}
            >
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={action.onClick}
                  className={`rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10 ${isCollapsed ? 'w-full' : 'flex-1'} flex items-center justify-center`}
                >
                  {action.icon}
                </motion.button>
              ))}
            </div>
          )}

          {/* User status */}
          {showUserStatus && user && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ThemedAvatar
                    src={user.avatarUrl}
                    alt={user.displayName || user.username || 'User'}
                    size="medium"
                    avatarBorderId={getAvatarBorderId(user)}
                  />
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-800 bg-green-500" />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-white">
                          {user.displayName || user.username}
                        </span>
                        {isSubscribed && <SparklesIcon className="h-4 w-4 text-amber-400" />}
                      </div>
                      <span className="text-xs text-white/40">Online</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isCollapsed && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="rounded-lg p-1.5 hover:bg-white/10"
                  >
                    <CogIcon className="h-4 w-4 text-white/40" />
                  </button>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    );
  }

  // Default and compact variants
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2 }}
      className={`relative flex flex-col border-r border-white/5 bg-dark-900 ${variant === 'compact' ? 'py-2' : 'py-4'} ${className} `}
    >
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-6 z-10 rounded-full border border-white/10 bg-dark-800 p-1.5 hover:bg-dark-700"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-3 w-3 text-white" />
        ) : (
          <ChevronLeftIcon className="h-3 w-3 text-white" />
        )}
      </button>

      {/* Groups list */}
      {showGroups && (
        <div className="flex-1 space-y-1 overflow-y-auto px-2">
          {groups.map((group) => (
            <motion.button
              key={group.id}
              whileHover={{ x: 2 }}
              onClick={() => handleGroupClick(group.id)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5`}
            >
              <ThemedAvatar src={group.iconUrl} alt={group.name} size="small" />
              {!isCollapsed && <span className="truncate text-sm text-white">{group.name}</span>}
            </motion.button>
          ))}
        </div>
      )}

      {/* User section */}
      {showUserStatus && user && (
        <div className="border-t border-white/5 px-2 pt-2">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5"
          >
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user.displayName || user.username || 'User'}
              size="small"
              avatarBorderId={getAvatarBorderId(user)}
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user.displayName || user.username}
                </p>
              </div>
            )}
          </NavLink>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
