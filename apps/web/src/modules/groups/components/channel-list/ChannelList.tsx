import { AnimatePresence } from 'framer-motion';
import { ChannelItem } from './ChannelItem';
import { CategorySection } from './ChannelCategory';
import { CreateChannelModal } from './CreateChannelModal';
import { useChannelListState } from './hooks';
import type { ChannelListProps } from './types';

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
 * - Drag and drop reordering (@todo(ui) planned)
 */
export function ChannelList({ className = '' }: ChannelListProps) {
  const {
    groupId,
    channelId,
    activeGroup,
    expandedCategories,
    showCreateModal,
    setShowCreateModal,
    toggleCategory,
    uncategorizedChannels,
  } = useChannelListState();

  if (!activeGroup) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <p className="text-sm text-gray-500">Select a group</p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 py-2 ${className}`}>
      {/* Uncategorized channels */}
      {uncategorizedChannels.length > 0 && (
        <div className="mb-2 px-2">
          {uncategorizedChannels.map((channel) => (
            <ChannelItem key={channel.id} channel={channel} isActive={channel.id === channelId} />
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

export default ChannelList;
