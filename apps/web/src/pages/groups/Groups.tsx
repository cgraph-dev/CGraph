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
  const { groups, isLoadingGroups: _isLoadingGroups, fetchGroups, fetchGroup, setActiveGroup, setActiveChannel } = useGroupStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch full group data when selected
  useEffect(() => {
    if (groupId) {
      setActiveGroup(groupId);
      fetchGroup(groupId);
    }
    if (channelId) {
      setActiveChannel(channelId);
    }
  }, [groupId, channelId, setActiveGroup, setActiveChannel, fetchGroup]);

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
    <div className="flex flex-1 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Ambient particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none z-0"
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
      <div className="w-[72px] bg-dark-900/50 backdrop-blur-xl border-r border-primary-500/20 py-3 flex flex-col items-center gap-2 overflow-y-auto relative z-10">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {/* Home/DMs button */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <NavLink
            to="/messages"
            onClick={() => HapticFeedback.medium()}
            className="relative group"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 w-12 rounded-2xl bg-dark-700 group-hover:bg-primary-600 group-hover:rounded-xl flex items-center justify-center transition-all duration-200 relative z-10"
              style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary-600/20 opacity-0 group-hover:opacity-100 blur-lg pointer-events-none"
              transition={{ duration: 0.3 }}
            />
          </NavLink>
        </motion.div>

        <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-primary-500/30 to-transparent rounded-full mx-auto" />

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
          className="h-12 w-12 rounded-2xl bg-dark-700 hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:rounded-xl flex items-center justify-center transition-all duration-200 relative group"
          style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
        >
          <PlusIcon className="h-6 w-6 text-green-400 group-hover:text-white transition-colors" />
          <motion.div
            className="absolute inset-0 rounded-2xl bg-green-600/20 opacity-0 group-hover:opacity-100 blur-lg pointer-events-none"
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </div>

      {/* Channel List */}
      {activeGroup ? (
        <div className="w-60 bg-dark-800/50 backdrop-blur-xl border-r border-primary-500/20 flex flex-col relative z-10">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          {/* Server Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <motion.div
              whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
              className="h-12 px-4 flex items-center justify-between border-b border-primary-500/20 cursor-pointer transition-colors"
            >
              <h2 className="font-semibold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent truncate">
                {activeGroup.name}
              </h2>
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <ChevronDownIcon className="h-4 w-4 text-primary-400" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto py-3 space-y-0.5 relative z-10">
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
                  className="w-full px-2 py-1 flex items-center gap-0.5 text-xs font-semibold text-primary-400 uppercase tracking-wide transition-all rounded"
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
            className="h-14 px-2 bg-dark-900/80 backdrop-blur-sm border-t border-primary-500/20 flex items-center gap-2 relative z-10"
          >
            <motion.div
              whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center gap-2 p-1 rounded cursor-pointer transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center relative">
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent truncate">
                  User
                </p>
                <p className="text-xs text-primary-400 truncate">Online</p>
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => HapticFeedback.light()}
              className="p-1.5 rounded-lg bg-dark-700/50 hover:bg-dark-600 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <div className="w-60 bg-dark-800/50 backdrop-blur-xl border-r border-primary-500/20 flex flex-col relative z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-12 px-4 flex items-center border-b border-primary-500/20 relative z-10"
          >
            <h2 className="font-semibold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent">
              Select a server
            </h2>
          </motion.div>
          <div className="flex-1 flex items-center justify-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center p-4"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <UserGroupIcon className="h-12 w-12 mx-auto text-primary-400 mb-3" />
              </motion.div>
              <p className="text-gray-400">Select a server to view channels</p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Channel Content */}
      <div className="flex-1 flex flex-col bg-transparent relative z-10">
        {channelId ? (
          <Outlet />
        ) : groupId ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-12 text-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative inline-block mb-4"
                >
                  <HashtagIcon className="h-16 w-16 mx-auto text-primary-400" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-2">
                  Welcome to {activeGroup?.name}
                </h3>
                <p className="text-gray-400">Select a channel to start chatting</p>
              </GlassCard>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-16 text-center">
                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-primary-400"
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
                  className="relative inline-block mb-4"
                >
                  <UserGroupIcon className="h-20 w-20 mx-auto text-primary-400" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-2">
                  Welcome to Groups
                </h3>
                <p className="text-gray-400 max-w-md">
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
      className="relative group"
    >
      {/* Active indicator */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-600"
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
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <div
          className={`h-12 w-12 flex items-center justify-center transition-all overflow-hidden relative z-10 ${
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
            <span className="text-lg font-bold text-white">{group.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary-600/20 opacity-0 group-hover:opacity-100 blur-lg pointer-events-none"
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
      className="mx-2 relative"
    >
      <motion.div
        whileHover={{ scale: 1.02, x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={`px-2 py-1.5 rounded flex items-center gap-1.5 transition-all relative z-10 ${
          isActive
            ? 'bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700/50'
        }`}
        style={
          isActive
            ? { boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }
            : {}
        }
      >
        {isActive && (
          <motion.div
            layoutId={`activeChannel-${groupId}`}
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-600"
            style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`}
          style={
            isActive
              ? { filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }
              : {}
          }
        />
        <span className={`truncate ${isActive ? 'font-medium' : ''}`}>{channel.name}</span>
        <AnimatePresence>
          {channel.unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="ml-auto h-4 min-w-[16px] px-1 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-xs font-bold flex items-center justify-center text-white"
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
