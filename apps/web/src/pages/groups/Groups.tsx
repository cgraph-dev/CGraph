import { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink } from 'react-router-dom';
import { useGroupStore, Group, Channel } from '@/stores/groupStore';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  PlusIcon,
  HashtagIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function Groups() {
  const { groupId, channelId } = useParams();
  const { groups, isLoadingGroups, fetchGroups, fetchGroup, setActiveGroup, setActiveChannel } =
    useGroupStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch full group data when selected
  useEffect(() => {
    if (groupId) {
      setActiveGroup(groupId);
      fetchGroup(groupId);
    }
    if (channelId) {
      setActiveChannel(channelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, channelId]);

  const activeGroup = groups.find((g) => g.id === groupId);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Initialize all categories as expanded
  useEffect(() => {
    if (activeGroup?.categories) {
      setExpandedCategories(new Set(activeGroup.categories.map((c) => c.id)));
    }
  }, [activeGroup?.id, activeGroup?.categories]);

  return (
    <div className="relative flex flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Loading state */}
      {isLoadingGroups && groups.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <span className="text-sm text-gray-400">Loading servers...</span>
          </div>
        </div>
      )}

      {/* Ambient particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute z-0 h-0.5 w-0.5 rounded-full bg-primary-400"
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

      {/* Server List */}
      <div className="relative z-10 flex w-[72px] flex-col items-center gap-2 overflow-y-auto border-r border-primary-500/20 bg-dark-900/50 py-3 backdrop-blur-xl">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        {/* Home/DMs button */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <NavLink
            to="/messages"
            onClick={() => HapticFeedback.medium()}
            className="group relative"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-700 transition-all duration-200 group-hover:rounded-xl group-hover:bg-primary-600"
              style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-primary-600/20 opacity-0 blur-lg group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
          </NavLink>
        </motion.div>

        <div className="mx-auto h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        {/* Server list */}
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: 0.1 + index * 0.05,
            }}
          >
            <ServerIcon group={group} isActive={group.id === groupId} />
          </motion.div>
        ))}

        {/* Add server button */}
        <motion.button
          onClick={() => HapticFeedback.medium()}
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Create new server"
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-700 transition-all duration-200 hover:rounded-xl hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700"
          style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
        >
          <PlusIcon className="h-6 w-6 text-green-400 transition-colors group-hover:text-white" />
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-green-600/20 opacity-0 blur-lg group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </div>

      {/* Channel List */}
      {activeGroup ? (
        <div className="relative z-10 flex w-60 flex-col border-r border-primary-500/20 bg-dark-800/50 backdrop-blur-xl">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

          {/* Server Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <motion.div
              whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
              className="flex h-12 cursor-pointer items-center justify-between border-b border-primary-500/20 px-4 transition-colors"
            >
              <h2 className="truncate bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text font-semibold text-transparent">
                {activeGroup.name}
              </h2>
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <ChevronDownIcon className="h-4 w-4 text-primary-400" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Channels */}
          <div className="relative z-10 flex-1 space-y-0.5 overflow-y-auto py-3">
            {activeGroup.categories?.map((category, catIndex) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: catIndex * 0.05,
                }}
              >
                {/* Category Header */}
                <motion.button
                  onClick={() => {
                    toggleCategory(category.id);
                    HapticFeedback.light();
                  }}
                  whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center gap-0.5 rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary-400 transition-all"
                >
                  <motion.div
                    animate={{ rotate: expandedCategories.has(category.id) ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDownIcon className="h-3 w-3" />
                  </motion.div>
                  {category.name}
                </motion.button>

                {/* Category Channels */}
                <AnimatePresence>
                  {expandedCategories.has(category.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-0.5 overflow-hidden"
                    >
                      {category.channels?.map((channel, chIndex) => (
                        <motion.div
                          key={channel.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                            delay: chIndex * 0.03,
                          }}
                        >
                          <ChannelItem
                            channel={channel}
                            groupId={activeGroup.id}
                            isActive={channel.id === channelId}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Uncategorized channels */}
            {activeGroup.channels
              ?.filter((c) => !c.categoryId)
              .map((channel, index) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: (activeGroup.categories?.length || 0) * 0.05 + index * 0.03,
                  }}
                >
                  <ChannelItem
                    channel={channel}
                    groupId={activeGroup.id}
                    isActive={channel.id === channelId}
                  />
                </motion.div>
              ))}
          </div>

          {/* User Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 flex h-14 items-center gap-2 border-t border-primary-500/20 bg-dark-900/80 px-2 backdrop-blur-sm"
          >
            <motion.div
              whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-1 cursor-pointer items-center gap-2 rounded p-1 transition-colors"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700">
                <span className="text-sm font-bold">U</span>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary-500/50"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(16, 185, 129, 0.4)',
                      '0 0 0 6px rgba(16, 185, 129, 0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate bg-gradient-to-r from-white to-primary-100 bg-clip-text text-sm font-medium text-transparent">
                  User
                </p>
                <p className="truncate text-xs text-primary-400">Online</p>
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => HapticFeedback.light()}
              className="rounded-lg bg-dark-700/50 p-1.5 text-gray-400 transition-colors hover:bg-dark-600 hover:text-primary-400"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <div className="relative z-10 flex w-60 flex-col border-r border-primary-500/20 bg-dark-800/50 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex h-12 items-center border-b border-primary-500/20 px-4"
          >
            <h2 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text font-semibold text-transparent">
              Select a server
            </h2>
          </motion.div>
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <UserGroupIcon className="mx-auto mb-3 h-12 w-12 text-primary-400" />
              </motion.div>
              <p className="text-gray-400">Select a server to view channels</p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Channel Content */}
      <div className="relative z-10 flex flex-1 flex-col bg-transparent">
        {channelId ? (
          <Outlet />
        ) : groupId ? (
          <div className="flex flex-1 items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <GlassCard
                variant="holographic"
                glow
                glowColor="rgba(16, 185, 129, 0.3)"
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mb-4 inline-block"
                >
                  <HashtagIcon className="mx-auto h-16 w-16 text-primary-400" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-xl font-semibold text-transparent">
                  Welcome to {activeGroup?.name}
                </h3>
                <p className="text-gray-400">Select a channel to start chatting</p>
              </GlassCard>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <GlassCard
                variant="holographic"
                glow
                glowColor="rgba(16, 185, 129, 0.3)"
                className="p-16 text-center"
              >
                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-primary-400"
                    style={{
                      left: `${50 + Math.cos((i * Math.PI * 2) / 6) * 20}%`,
                      top: `${40 + Math.sin((i * Math.PI * 2) / 6) * 20}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mb-4 inline-block"
                >
                  <UserGroupIcon className="mx-auto h-20 w-20 text-primary-400" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
                  Welcome to Groups
                </h3>
                <p className="max-w-md text-gray-400">
                  Select a server from the sidebar or create a new one to get started
                </p>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// Server icon component
function ServerIcon({ group, isActive }: { group: Group; isActive: boolean }) {
  return (
    <NavLink
      to={`/groups/${group.id}/channels/${group.channels?.[0]?.id || ''}`}
      onClick={() => HapticFeedback.medium()}
      className="group relative"
    >
      {/* Active indicator */}
      <motion.div
        className="absolute left-0 top-1/2 w-1 -translate-x-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-600"
        animate={{
          height: isActive ? 40 : 0,
        }}
        whileHover={{
          height: isActive ? 40 : 20,
        }}
        style={{
          boxShadow: isActive ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Icon */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
        <div
          className={`relative z-10 flex h-12 w-12 items-center justify-center overflow-hidden transition-all ${
            isActive
              ? 'rounded-xl bg-gradient-to-br from-primary-600 to-primary-700'
              : 'rounded-2xl bg-dark-700 group-hover:rounded-xl group-hover:bg-primary-600'
          }`}
          style={{
            boxShadow: isActive
              ? '0 4px 15px rgba(16, 185, 129, 0.4)'
              : '0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
        >
          {group.iconUrl ? (
            <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white">
              {group.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Hover glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-primary-600/20 opacity-0 blur-lg group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </NavLink>
  );
}

// Channel item component
function ChannelItem({
  channel,
  groupId,
  isActive,
}: {
  channel: Channel;
  groupId: string;
  isActive: boolean;
}) {
  const getIcon = () => {
    switch (channel.type) {
      case 'voice':
        return SpeakerWaveIcon;
      case 'video':
        return VideoCameraIcon;
      case 'announcement':
        return MegaphoneIcon;
      case 'forum':
        return ChatBubbleLeftRightIcon;
      default:
        return HashtagIcon;
    }
  };

  const Icon = getIcon();

  return (
    <NavLink
      to={`/groups/${groupId}/channels/${channel.id}`}
      onClick={() => HapticFeedback.light()}
      className="relative mx-2"
    >
      <motion.div
        whileHover={{ scale: 1.02, x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={`relative z-10 flex items-center gap-1.5 rounded px-2 py-1.5 transition-all ${
          isActive
            ? 'bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent text-white'
            : 'text-gray-400 hover:bg-dark-700/50 hover:text-gray-200'
        }`}
        style={isActive ? { boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' } : {}}
      >
        {isActive && (
          <motion.div
            layoutId={`activeChannel-${groupId}`}
            className="absolute -left-2 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-600"
            style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`}
          style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' } : {}}
        />
        <span className={`truncate ${isActive ? 'font-medium' : ''}`}>{channel.name}</span>
        <AnimatePresence>
          {channel.unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 px-1 text-xs font-bold text-white"
              style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
            >
              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </NavLink>
  );
}
