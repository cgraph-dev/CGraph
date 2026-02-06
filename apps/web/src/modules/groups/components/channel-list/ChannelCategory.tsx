import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ChannelItem } from './ChannelItem';
import type { CategorySectionProps } from './types';

export function CategorySection({
  category,
  isExpanded,
  activeChannelId,
  onToggle,
  onCreateChannel,
}: CategorySectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="px-2">
      {/* Category Header */}
      <motion.button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex w-full items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-300"
      >
        <div className="flex items-center gap-1">
          <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
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
              className="rounded p-0.5 hover:bg-dark-700"
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
