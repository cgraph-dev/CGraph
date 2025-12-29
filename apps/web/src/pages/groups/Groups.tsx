import { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink } from 'react-router-dom';
import { useGroupStore, Group, Channel } from '@/stores/groupStore';
import {
  PlusIcon,
  HashtagIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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
  }, [activeGroup?.id]);

  return (
    <div className="flex flex-1">
      {/* Server List */}
      <div className="w-[72px] bg-dark-900 py-3 flex flex-col items-center gap-2 overflow-y-auto">
        {/* Home/DMs button */}
        <NavLink
          to="/messages"
          className="h-12 w-12 rounded-2xl bg-dark-700 hover:bg-primary-600 hover:rounded-xl flex items-center justify-center transition-all"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        </NavLink>

        <div className="w-8 h-0.5 bg-dark-700 rounded-full mx-auto" />

        {/* Server list */}
        {groups.map((group) => (
          <ServerIcon key={group.id} group={group} isActive={group.id === groupId} />
        ))}

        {/* Add server button */}
        <button className="h-12 w-12 rounded-2xl bg-dark-700 hover:bg-green-600 hover:rounded-xl flex items-center justify-center transition-all group">
          <PlusIcon className="h-6 w-6 text-green-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Channel List */}
      {activeGroup ? (
        <div className="w-60 bg-dark-800 flex flex-col">
          {/* Server Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-dark-700 hover:bg-dark-700 cursor-pointer">
            <h2 className="font-semibold text-white truncate">{activeGroup.name}</h2>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto py-3 space-y-0.5">
            {activeGroup.categories?.map((category) => (
              <div key={category.id}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-2 py-1 flex items-center gap-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-200 transition-colors"
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDownIcon className="h-3 w-3" />
                  ) : (
                    <ChevronRightIcon className="h-3 w-3" />
                  )}
                  {category.name}
                </button>

                {/* Category Channels */}
                {expandedCategories.has(category.id) && (
                  <div className="mt-0.5">
                    {category.channels?.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        groupId={activeGroup.id}
                        isActive={channel.id === channelId}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Uncategorized channels */}
            {activeGroup.channels
              ?.filter((c) => !c.categoryId)
              .map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  groupId={activeGroup.id}
                  isActive={channel.id === channelId}
                />
              ))}
          </div>

          {/* User Panel */}
          <div className="h-14 px-2 bg-dark-900/50 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 p-1 rounded hover:bg-dark-700 cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-bold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">User</p>
                <p className="text-xs text-gray-400 truncate">Online</p>
              </div>
            </div>
            <button className="p-1.5 rounded hover:bg-dark-700 text-gray-400 hover:text-white">
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-60 bg-dark-800 flex flex-col">
          <div className="h-12 px-4 flex items-center border-b border-dark-700">
            <h2 className="font-semibold text-white">Select a server</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-4">
              <UserGroupIcon className="h-12 w-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">Select a server to view channels</p>
            </div>
          </div>
        </div>
      )}

      {/* Channel Content */}
      <div className="flex-1 flex flex-col bg-dark-900">
        {channelId ? (
          <Outlet />
        ) : groupId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <HashtagIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Welcome to {activeGroup?.name}</h3>
              <p className="text-gray-400">Select a channel to start chatting</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <UserGroupIcon className="h-20 w-20 mx-auto text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Welcome to Groups</h3>
              <p className="text-gray-400 max-w-md">
                Select a server from the sidebar or create a new one to get started
              </p>
            </div>
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
      className="relative group"
    >
      {/* Active indicator */}
      <div
        className={`absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all ${
          isActive ? 'h-10' : 'h-0 group-hover:h-5'
        }`}
      />

      {/* Icon */}
      <div
        className={`h-12 w-12 flex items-center justify-center transition-all overflow-hidden ${
          isActive
            ? 'rounded-xl bg-primary-600'
            : 'rounded-2xl bg-dark-700 hover:rounded-xl hover:bg-primary-600'
        }`}
      >
        {group.iconUrl ? (
          <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-white">
            {group.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
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
      className={`mx-2 px-2 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
        isActive
          ? 'bg-dark-600 text-white'
          : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700/50'
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="truncate">{channel.name}</span>
      {channel.unreadCount > 0 && (
        <span className="ml-auto h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center">
          {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
        </span>
      )}
    </NavLink>
  );
}
