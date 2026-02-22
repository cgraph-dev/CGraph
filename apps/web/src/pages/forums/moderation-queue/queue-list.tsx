/**
 * QueueList component
 * @module pages/forums/moderation-queue
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ModerationQueueItem } from '@/modules/moderation/store';
import { QueueItemCard } from './queue-item-card';

interface QueueListProps {
  items: ModerationQueueItem[];
  selectedItems: Set<string>;
  isLoading: boolean;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => void;
}

export function QueueList({
  items,
  selectedItems,
  isLoading,
  onSelectAll,
  onToggleSelect,
  onApprove,
  onReject,
}: QueueListProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent"
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center p-12">
        <CheckCircleIcon className="mb-4 h-16 w-16 text-green-500" />
        <h3 className="mb-2 text-lg font-semibold text-white">Queue is Empty</h3>
        <p className="text-center text-gray-400">
          No items require moderation right now. Great job!
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select All */}
      <div className="flex items-center gap-4">
        <button onClick={onSelectAll} className="text-sm text-primary-400 hover:text-primary-300">
          Select All ({items.length})
        </button>
      </div>

      {/* Items */}
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <QueueItemCard
            key={item.id}
            item={item}
            isSelected={selectedItems.has(item.id)}
            onSelect={onToggleSelect}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
