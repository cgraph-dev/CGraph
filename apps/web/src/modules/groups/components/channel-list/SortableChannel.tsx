/**
 * Sortable Channel Item
 *
 * Wraps ChannelItem with @dnd-kit/sortable for drag-and-drop reordering.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChannelItem } from './ChannelItem';
import type { Channel } from '@/modules/groups/store';

interface SortableChannelProps {
  channel: Channel;
  isActive: boolean;
}

export function SortableChannel({ channel, isActive }: SortableChannelProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ChannelItem channel={channel} isActive={isActive} />
    </div>
  );
}
