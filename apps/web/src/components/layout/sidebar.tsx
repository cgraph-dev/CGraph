/** Collapsible sidebar navigation with groups, channels, and quick actions. */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { springs } from '@/lib/animation-presets/presets';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  HomeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/store';
import { useGroupStore } from '@/modules/groups/store';
import { usePremiumStore } from '@/modules/premium/store';
import { FloatingSidebar } from './floating-sidebar';

export interface SidebarProps {
  variant?: 'default' | 'compact' | 'floating';
  defaultCollapsed?: boolean;
  showGroups?: boolean;
  showQuickActions?: boolean;
  showUserStatus?: boolean;
  onGroupSelect?: (groupId: string) => void;
  className?: string;
}

export interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

export function Sidebar({
  variant = 'default',
  defaultCollapsed = false,
  showGroups = true,
  showQuickActions = true,
  showUserStatus = true,
  onGroupSelect,
  className = '',
}: SidebarProps): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { groups } = useGroupStore();
  const { isSubscribed } = usePremiumStore();

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

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

  if (variant === 'floating') {
    return (
      <FloatingSidebar
        defaultCollapsed={defaultCollapsed}
        showGroups={showGroups}
        showQuickActions={showQuickActions}
        showUserStatus={showUserStatus}
        onGroupSelect={onGroupSelect}
        className={className}
        groups={groups}
        user={user}
        isSubscribed={isSubscribed}
        quickActions={quickActions}
      />
    );
  }

  // Default and compact variants
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ ...springs.stiff, mass: 0.8 }}
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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springs.snappy}
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
}

export default Sidebar;
