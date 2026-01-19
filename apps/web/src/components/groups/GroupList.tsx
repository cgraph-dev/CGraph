import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LockClosedIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore, type Group } from '@/stores/groupStore';
import GlassCard from '@/components/ui/GlassCard';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

// Reserved for future use
void ThemedAvatar;

/**
 * GroupList Component
 *
 * Displays all groups the user is a member of with rich visual effects.
 * Features:
 * - Animated group cards with hover effects
 * - Online member count with live updates
 * - Quick group creation
 * - Search and filter
 * - Group discovery integration
 */

interface GroupListProps {
  variant?: 'sidebar' | 'grid' | 'list';
  showCreate?: boolean;
  className?: string;
}

export function GroupList({
  variant = 'sidebar',
  showCreate = true,
  className = '',
}: GroupListProps) {
  const navigate = useNavigate();
  const { groups, isLoadingGroups } = useGroupStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupClick = useCallback(
    (groupId: string) => {
      HapticFeedback.light();
      navigate(`/groups/${groupId}`);
    },
    [navigate]
  );

  if (variant === 'sidebar') {
    return (
      <div className={`flex w-[72px] flex-col items-center gap-2 py-3 ${className}`}>
        {/* Groups */}
        {filteredGroups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <GroupIcon group={group} onClick={() => handleGroupClick(group.id)} />
          </motion.div>
        ))}

        {/* Separator */}
        <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        {/* Create/Join */}
        {showCreate && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateModal(true)}
            className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-700 transition-all duration-200 hover:rounded-xl hover:bg-primary-600"
            style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
          >
            <PlusIcon className="h-6 w-6 text-primary-400 transition-colors group-hover:text-white" />
          </motion.button>
        )}

        <AnimatePresence>
          {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={className}>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-dark-800 py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoadingGroups && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-dark-800" />
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GroupCard group={group} onClick={() => handleGroupClick(group.id)} />
            </motion.div>
          ))}

          {/* Create Card */}
          {showCreate && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-700 transition-colors hover:border-primary-500"
            >
              <div className="rounded-full bg-dark-700 p-4">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
              <span className="font-medium text-gray-400">Create Group</span>
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  // List variant
  return (
    <div className={`space-y-3 ${className}`}>
      {filteredGroups.map((group, index) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <GroupListItem group={group} onClick={() => handleGroupClick(group.id)} />
        </motion.div>
      ))}
    </div>
  );
}

// Group Icon for sidebar
function GroupIcon({ group, onClick }: { group: Group; onClick: () => void }) {
  const isActive = false; // TODO: Connect to router state
  void isActive;

  return (
    <NavLink
      to={`/groups/${group.id}`}
      onClick={() => {
        HapticFeedback.medium();
        onClick();
      }}
      className="group relative"
    >
      {({ isActive: routeActive }) => (
        <>
          {/* Active indicator */}
          <motion.div
            initial={false}
            animate={{
              height: routeActive ? 40 : 8,
              opacity: routeActive ? 1 : 0.5,
            }}
            className="absolute -left-3 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-white"
          />

          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.05, borderRadius: '35%' }}
            whileTap={{ scale: 0.95 }}
            className="relative h-12 w-12 overflow-hidden rounded-full bg-dark-700 transition-all duration-200"
            style={{
              borderRadius: routeActive ? '35%' : '50%',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            }}
          >
            {group.iconUrl ? (
              <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="font-bold text-white">{group.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}

            {/* Online indicator */}
            {group.onlineMemberCount > 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-dark-900 bg-green-500">
                <span className="text-[8px] font-bold text-white">
                  {group.onlineMemberCount > 99 ? '99+' : group.onlineMemberCount}
                </span>
              </div>
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 whitespace-nowrap rounded-lg bg-dark-800 px-3 py-2 text-sm font-medium text-white shadow-xl"
          >
            {group.name}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-dark-800" />
          </motion.div>
        </>
      )}
    </NavLink>
  );
}

// Group Card for grid view
function GroupCard({ group, onClick }: { group: Group; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Banner */}
        <div className="relative h-24">
          {group.bannerUrl ? (
            <img src={group.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary-600/50 to-purple-600/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />

          {/* Icon */}
          <div className="absolute -bottom-8 left-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border-4 border-dark-900 bg-dark-800">
              {group.iconUrl ? (
                <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                  <span className="text-xl font-bold text-white">
                    {group.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Public/Private badge */}
          <div className="absolute right-2 top-2">
            {group.isPublic ? (
              <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                <GlobeAltIcon className="h-3 w-3" />
                Public
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                <LockClosedIcon className="h-3 w-3" />
                Private
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-10">
          <h3 className="truncate font-bold text-white">{group.name}</h3>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-400">{group.description}</p>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{group.memberCount} members</span>
            </div>
            {group.onlineMemberCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>{group.onlineMemberCount} online</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Group List Item for list view
function GroupListItem({ group, onClick }: { group: Group; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlassCard variant="frosted" className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
            {group.iconUrl ? (
              <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-lg font-bold text-white">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold text-white">{group.name}</h3>
              {!group.isPublic && (
                <LockClosedIcon className="h-4 w-4 flex-shrink-0 text-yellow-400" />
              )}
            </div>
            {group.description && (
              <p className="mt-0.5 truncate text-sm text-gray-400">{group.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span>{group.memberCount} members</span>
              {group.onlineMemberCount > 0 && (
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {group.onlineMemberCount} online
                </span>
              )}
            </div>
          </div>

          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Create Group Modal
function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { createGroup } = useGroupStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      HapticFeedback.success();
      onClose();
      navigate(`/groups/${group.id}`);
    } catch (error) {
      console.error('Failed to create group:', error);
      HapticFeedback.error();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="p-6">
          <div className="mb-6 text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 inline-block"
            >
              <SparklesIcon className="h-12 w-12 text-primary-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Create a Group</h2>
            <p className="mt-1 text-sm text-gray-400">
              Build your community with friends and like-minded people
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Group Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Group"
                className="w-full rounded-xl border border-gray-700 bg-dark-800 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's your group about?"
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-700 bg-dark-800 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-dark-800 p-4">
              <div>
                <span className="font-medium text-white">Public Group</span>
                <p className="text-xs text-gray-400">Anyone can discover and join</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsPublic(!isPublic)}
                className={`h-6 w-12 rounded-full transition-colors ${
                  isPublic ? 'bg-primary-600' : 'bg-dark-600'
                }`}
              >
                <motion.div
                  animate={{ x: isPublic ? 24 : 0 }}
                  className="h-6 w-6 rounded-full bg-white shadow-lg"
                />
              </motion.button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-dark-700 py-3 text-gray-300 transition-colors hover:bg-dark-600"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="flex-1 rounded-xl bg-primary-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default GroupList;
