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
import GlassCard from '@/components/ui/GlassCard';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useAuthStore } from '@/stores/authStore';
import { useGroupStore } from '@/stores/groupStore';
import { usePremiumStore } from '@/features/premium/stores';

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

  const handleGroupClick = useCallback((groupId: string) => {
    HapticFeedback.light();
    onGroupSelect?.(groupId);
    navigate(`/groups/${groupId}`);
  }, [navigate, onGroupSelect]);

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
        className={`fixed left-4 top-4 bottom-4 z-40 ${className}`}
      >
        <GlassCard
          variant="crystal"
          className={`h-full ${sidebarWidth} transition-all duration-300 flex flex-col p-2`}
        >
          {/* Toggle button */}
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 top-8 p-1.5 bg-dark-800 border border-white/10 rounded-full hover:bg-dark-700"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-white" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-white" />
            )}
          </button>

          {/* Groups list */}
          {showGroups && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {groups.map((group) => (
                <motion.button
                  key={group.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onHoverStart={() => setHoveredGroup(group.id)}
                  onHoverEnd={() => setHoveredGroup(null)}
                  onClick={() => handleGroupClick(group.id)}
                  className={`
                    relative w-full p-2 rounded-xl transition-colors
                    ${hoveredGroup === group.id ? 'bg-white/10' : 'hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <ThemedAvatar
                      src={group.iconUrl}
                      alt={group.name}
                      size="medium"
                    />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-sm font-medium text-white truncate"
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
                      className="absolute left-full ml-2 px-3 py-1.5 bg-dark-800 rounded-lg text-sm text-white whitespace-nowrap z-50"
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
                className="w-full p-2 rounded-xl border-2 border-dashed border-white/20 hover:border-primary-500/50 flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5 text-white/40" />
                {!isCollapsed && (
                  <span className="text-sm text-white/40">Add Group</span>
                )}
              </motion.button>
            </div>
          )}

          {/* Quick actions */}
          {showQuickActions && (
            <div className={`border-t border-white/10 pt-2 mt-2 ${isCollapsed ? 'space-y-2' : 'flex gap-2'}`}>
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={action.onClick}
                  className={`
                    p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors
                    ${isCollapsed ? 'w-full' : 'flex-1'}
                    flex items-center justify-center
                  `}
                >
                  {action.icon}
                </motion.button>
              ))}
            </div>
          )}

          {/* User status */}
          {showUserStatus && user && (
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ThemedAvatar
                    src={user.avatarUrl}
                    alt={user.displayName || user.username || 'User'}
                    size="medium"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-800" />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {user.displayName || user.username}
                        </span>
                        {isSubscribed && (
                          <SparklesIcon className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <span className="text-xs text-white/40">Online</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isCollapsed && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-1.5 rounded-lg hover:bg-white/10"
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
      className={`
        relative bg-dark-900 border-r border-white/5 flex flex-col
        ${variant === 'compact' ? 'py-2' : 'py-4'}
        ${className}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-6 p-1.5 bg-dark-800 border border-white/10 rounded-full hover:bg-dark-700 z-10"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-3 w-3 text-white" />
        ) : (
          <ChevronLeftIcon className="h-3 w-3 text-white" />
        )}
      </button>

      {/* Groups list */}
      {showGroups && (
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {groups.map((group) => (
            <motion.button
              key={group.id}
              whileHover={{ x: 2 }}
              onClick={() => handleGroupClick(group.id)}
              className={`
                w-full p-2 rounded-lg transition-colors text-left
                hover:bg-white/5 flex items-center gap-3
              `}
            >
              <ThemedAvatar
                src={group.iconUrl}
                alt={group.name}
                size="small"
              />
              {!isCollapsed && (
                <span className="text-sm text-white truncate">{group.name}</span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* User section */}
      {showUserStatus && user && (
        <div className="px-2 pt-2 border-t border-white/5">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
          >
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user.displayName || user.username || 'User'}
              size="small"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
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
