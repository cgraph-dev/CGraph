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

  const handleGroupClick = useCallback((groupId: string) => {
    HapticFeedback.light();
    navigate(`/groups/${groupId}`);
  }, [navigate]);

  if (variant === 'sidebar') {
    return (
      <div className={`w-[72px] flex flex-col items-center py-3 gap-2 ${className}`}>
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
        <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-primary-500/30 to-transparent rounded-full" />

        {/* Create/Join */}
        {showCreate && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateModal(true)}
            className="h-12 w-12 rounded-2xl bg-dark-700 hover:bg-primary-600 hover:rounded-xl flex items-center justify-center transition-all duration-200 group"
            style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
          >
            <PlusIcon className="h-6 w-6 text-primary-400 group-hover:text-white transition-colors" />
          </motion.button>
        )}

        <AnimatePresence>
          {showCreateModal && (
            <CreateGroupModal onClose={() => setShowCreateModal(false)} />
          )}
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
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800 border border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoadingGroups && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-dark-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-700 hover:border-primary-500 flex flex-col items-center justify-center gap-3 transition-colors"
            >
              <div className="p-4 rounded-full bg-dark-700">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
              <span className="text-gray-400 font-medium">Create Group</span>
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showCreateModal && (
            <CreateGroupModal onClose={() => setShowCreateModal(false)} />
          )}
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

  return (
    <NavLink
      to={`/groups/${group.id}`}
      onClick={() => {
        HapticFeedback.medium();
        onClick();
      }}
      className="relative group"
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
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full"
          />

          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.05, borderRadius: '35%' }}
            whileTap={{ scale: 0.95 }}
            className="relative h-12 w-12 rounded-full bg-dark-700 overflow-hidden transition-all duration-200"
            style={{
              borderRadius: routeActive ? '35%' : '50%',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            }}
          >
            {group.iconUrl ? (
              <img
                src={group.iconUrl}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-white font-bold">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Online indicator */}
            {group.onlineMemberCount > 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-dark-900 flex items-center justify-center">
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
            className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-dark-800 text-white text-sm font-medium shadow-xl pointer-events-none whitespace-nowrap z-50"
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
            <img
              src={group.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600/50 to-purple-600/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />

          {/* Icon */}
          <div className="absolute -bottom-8 left-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-dark-900 bg-dark-800">
              {group.iconUrl ? (
                <img
                  src={group.iconUrl}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                  <span className="text-xl font-bold text-white">
                    {group.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Public/Private badge */}
          <div className="absolute top-2 right-2">
            {group.isPublic ? (
              <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                <GlobeAltIcon className="h-3 w-3" />
                Public
              </div>
            ) : (
              <div className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium flex items-center gap-1">
                <LockClosedIcon className="h-3 w-3" />
                Private
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 p-4">
          <h3 className="font-bold text-white truncate">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{group.memberCount} members</span>
            </div>
            {group.onlineMemberCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
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
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            {group.iconUrl ? (
              <img
                src={group.iconUrl}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-lg font-bold text-white">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white truncate">{group.name}</h3>
              {!group.isPublic && (
                <LockClosedIcon className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              )}
            </div>
            {group.description && (
              <p className="text-sm text-gray-400 truncate mt-0.5">
                {group.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{group.memberCount} members</span>
              {group.onlineMemberCount > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <SparklesIcon className="h-12 w-12 text-primary-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Create a Group</h2>
            <p className="text-gray-400 text-sm mt-1">
              Build your community with friends and like-minded people
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Group"
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's your group about?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800">
              <div>
                <span className="font-medium text-white">Public Group</span>
                <p className="text-xs text-gray-400">Anyone can discover and join</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-primary-600' : 'bg-dark-600'
                }`}
              >
                <motion.div
                  animate={{ x: isPublic ? 24 : 0 }}
                  className="w-6 h-6 rounded-full bg-white shadow-lg"
                />
              </motion.button>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
