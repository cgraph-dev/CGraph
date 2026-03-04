/**
 * Group channel list component.
 * @module
 */
import { useCallback } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableChannel } from './sortable-channel';
import { CategorySection } from './channel-category';
import { CreateChannelModal } from './create-channel-modal';
import { useChannelListState } from './hooks';
import { useGroupStore } from '@/modules/groups/store';
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
 * - Drag and drop channel reordering
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

  const { updateChannelOrder } = useGroupStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !groupId) return;

      // Collect all channel IDs in current display order
      const allChannels = [
        ...uncategorizedChannels,
        ...(activeGroup?.categories?.flatMap((c) => c.channels) ?? []),
      ];

      const oldIndex = allChannels.findIndex((c) => c.id === active.id);
      const newIndex = allChannels.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(allChannels, oldIndex, newIndex);
      updateChannelOrder(
        groupId,
        reordered.map((c) => c.id)
      );
    },
    [groupId, uncategorizedChannels, activeGroup, updateChannelOrder]
  );

  if (!activeGroup) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <p className="text-sm text-gray-500">Select a group</p>
      </div>
    );
  }

  // Collect all channel IDs for sortable context
  const allChannelIds = [
    ...uncategorizedChannels.map((c) => c.id),
    ...(activeGroup.categories?.flatMap((cat) => cat.channels.map((c) => c.id)) ?? []),
  ];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={allChannelIds} strategy={verticalListSortingStrategy}>
        <LayoutGroup>
          <div className={`space-y-1 py-2 ${className}`}>
            {/* Uncategorized channels */}
            {uncategorizedChannels.length > 0 && (
              <div className="mb-2 px-2">
                {uncategorizedChannels.map((channel) => (
                  <SortableChannel
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
        </LayoutGroup>
      </SortableContext>
    </DndContext>
  );
}

export default ChannelList;
