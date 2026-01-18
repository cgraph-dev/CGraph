import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useParams } from 'react-router-dom';
import {
  HashtagIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore, type Channel, type ChannelCategory } from '@/stores/groupStore';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

/**
 * ChannelList Component
 * 
 * Displays channels organized by categories with animations.
 * Features:
 * - Collapsible categories
 * - Channel type icons
 * - Unread indicators
 * - NSFW warnings
 * - Quick channel creation
 * - Drag and drop reordering (TODO)
 */

interface ChannelListProps {
  className?: string;
}

const channelTypeIcons = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  video: VideoCameraIcon,
  announcement: MegaphoneIcon,
  forum: ChatBubbleLeftRightIcon,
};

const channelTypeColors = {
  text: 'text-gray-400',
  voice: 'text-green-400',
  video: 'text-purple-400',
  announcement: 'text-yellow-400',
  forum: 'text-blue-400',
};

export function ChannelList({ className = '' }: ChannelListProps) {
  const { groupId, channelId } = useParams();
  const { groups, setActiveChannel } = useGroupStore();
  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState<string | null>(null); // categoryId or 'uncategorized'

  const activeGroup = groups.find((g) => g.id === groupId);

  // Initialize all categories as expanded
  useMemo(() => {
    if (activeGroup?.categories) {
      setExpandedCategories(new Set(activeGroup.categories.map((c) => c.id)));
    }
  }, [activeGroup?.id]);

  if (!activeGroup) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-gray-500 text-sm">Select a group</p>
      </div>
    );
  }

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
    HapticFeedback.light();
  };

  // Get uncategorized channels
  const uncategorizedChannels = activeGroup.channels?.filter((c) => !c.categoryId) || [];

  return (
    <div className={`py-2 space-y-1 ${className}`}>
      {/* Uncategorized channels */}
      {uncategorizedChannels.length > 0 && (
        <div className="px-2 mb-2">
          {uncategorizedChannels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === channelId}
            />
          ))}
        </div>
      )}

      {/* Categories with channels */}
      {activeGroup.categories?.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          isExpanded={expandedCategories.has(category.id)}
          activeChannelId={channelId}
          onToggle={() => toggleCategory(category.id)}
          onCreateChannel={() => setShowCreateModal(category.id)}
        />
      ))}

      {/* Create channel modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateChannelModal
            groupId={groupId!}
            categoryId={showCreateModal === 'uncategorized' ? null : showCreateModal}
            onClose={() => setShowCreateModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Category Section Component
function CategorySection({
  category,
  isExpanded,
  activeChannelId,
  onToggle,
  onCreateChannel,
}: {
  category: ChannelCategory;
  isExpanded: boolean;
  activeChannelId?: string;
  onToggle: () => void;
  onCreateChannel: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="px-2">
      {/* Category Header */}
      <motion.button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex items-center justify-between px-1 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors group"
      >
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="h-3 w-3" />
          </motion.div>
          <span>{category.name}</span>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onCreateChannel();
              }}
              className="p-0.5 rounded hover:bg-dark-700"
            >
              <PlusIcon className="h-4 w-4 text-gray-400 hover:text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Channels */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {category.channels?.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === activeChannelId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Channel Item Component
function ChannelItem({
  channel,
  isActive,
}: {
  channel: Channel;
  isActive: boolean;
}) {
  const { groupId } = useParams();
  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  const Icon = channelTypeIcons[channel.type] || HashtagIcon;
  const iconColor = channelTypeColors[channel.type] || 'text-gray-400';

  return (
    <NavLink
      to={`/groups/${groupId}/channels/${channel.id}`}
      onClick={() => HapticFeedback.light()}
    >
      {({ isActive: routeActive }) => (
        <motion.div
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
            routeActive || isActive
              ? 'bg-primary-600/20 text-white'
              : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
          }`}
        >
          {/* Channel icon */}
          <Icon className={`h-5 w-5 flex-shrink-0 ${routeActive ? 'text-white' : iconColor}`} />

          {/* Channel name */}
          <span className="flex-1 truncate text-sm font-medium">
            {channel.name}
          </span>

          {/* NSFW badge */}
          {channel.isNsfw && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
              NSFW
            </span>
          )}

          {/* Private indicator */}
          {channel.type === 'text' && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Add lock icon for private channels if needed */}
            </span>
          )}

          {/* Unread indicator */}
          {channel.unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white">
                {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </NavLink>
  );
}

// Create Channel Modal
function CreateChannelModal({
  groupId,
  categoryId,
  onClose,
}: {
  groupId: string;
  categoryId: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Channel['type']>('text');
  const [isNsfw, setIsNsfw] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const channelTypes: { value: Channel['type']; label: string; icon: typeof HashtagIcon }[] = [
    { value: 'text', label: 'Text', icon: HashtagIcon },
    { value: 'voice', label: 'Voice', icon: SpeakerWaveIcon },
    { value: 'video', label: 'Video', icon: VideoCameraIcon },
    { value: 'announcement', label: 'Announcement', icon: MegaphoneIcon },
    { value: 'forum', label: 'Forum', icon: ChatBubbleLeftRightIcon },
  ];

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      // TODO: Implement create channel API call
      console.log('Creating channel:', { groupId, categoryId, name, type, isNsfw });
      HapticFeedback.success();
      onClose();
    } catch (error) {
      console.error('Failed to create channel:', error);
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
        className="w-full max-w-md bg-dark-900 rounded-2xl p-6 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <SparklesIcon className="h-10 w-10 text-primary-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
          <p className="text-gray-400 text-sm mt-1">
            Add a new channel to your group
          </p>
        </div>

        <div className="space-y-4">
          {/* Channel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Channel Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {channelTypes.map(({ value, label, icon: Icon }) => (
                <motion.button
                  key={value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setType(value)}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    type === value
                      ? 'bg-primary-600/20 border border-primary-500'
                      : 'bg-dark-800 border border-transparent hover:border-gray-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${type === value ? 'text-primary-400' : 'text-gray-400'}`} />
                  <span className="text-xs text-gray-300">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Channel Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {React.createElement(channelTypeIcons[type], {
                  className: 'h-5 w-5 text-gray-500',
                })}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="general"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800 border border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          {/* NSFW Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800">
            <div>
              <span className="font-medium text-white">Age-Restricted</span>
              <p className="text-xs text-gray-400">
                Only members 18+ can view this channel
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsNsfw(!isNsfw)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isNsfw ? 'bg-red-600' : 'bg-dark-600'
              }`}
            >
              <motion.div
                animate={{ x: isNsfw ? 24 : 0 }}
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
            {isCreating ? 'Creating...' : 'Create Channel'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ChannelList;
