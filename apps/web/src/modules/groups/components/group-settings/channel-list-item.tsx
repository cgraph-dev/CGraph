/**
 * Channel list item component — view and edit modes
 * @module modules/groups/components/group-settings
 */

import { motion } from 'framer-motion';
import {
  HashtagIcon,
  SpeakerWaveIcon,
  MegaphoneIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { entranceVariants } from '@/lib/animation-presets';

const channelIcons = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  announcement: MegaphoneIcon,
} as const;

interface ChannelItem {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  topic: string | null;
  position: number;
  categoryId: string | null;
  nsfw: boolean;
  slowmodeSeconds: number;
}

interface ChannelListItemProps {
  channel: ChannelItem;
  index: number;
  editingId: string | null;
  editName: string;
  editTopic: string;
  onEditNameChange: (name: string) => void;
  onEditTopicChange: (topic: string) => void;
  onSave: (channelId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (channel: ChannelItem) => void;
  onDelete: (channelId: string) => void;
  onPermissions: (channelId: string) => void;
}

export type { ChannelItem };

/**
 * unknown for the groups module.
 */
/**
 * Channel List Item component.
 */
export function ChannelListItem({
  channel,
  index,
  editingId,
  editName,
  editTopic,
  onEditNameChange,
  onEditTopicChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onPermissions,
}: ChannelListItemProps) {
  // type assertion: channel.type is a valid key of channelIcons map
   
  const Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> = channelIcons[channel.type as keyof typeof channelIcons] ?? HashtagIcon;

  return (
    <motion.div
      variants={entranceVariants.fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between px-4 py-3"
    >
      {editingId === channel.id ? (
        // Edit mode
        <div className="flex flex-1 items-center gap-3">
          <Icon className="h-5 w-5 shrink-0 text-gray-400" />
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="rounded border border-gray-700 bg-dark-800 px-2 py-1 text-sm text-white focus:border-primary-500 focus:outline-none"
            />
            <input
              type="text"
              value={editTopic}
              onChange={(e) => onEditTopicChange(e.target.value)}
              placeholder="Topic"
              className="flex-1 rounded border border-gray-700 bg-dark-800 px-2 py-1 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onSave(channel.id)}
              className="rounded px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-dark-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // View mode
        <>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-gray-400" />
            <div>
              <span className="font-medium text-white">{channel.name}</span>
              {channel.topic && (
                <p className="text-xs text-gray-500">{channel.topic}</p>
              )}
            </div>
            {channel.nsfw && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                NSFW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onPermissions(channel.id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-primary-400"
              title="Permissions"
            >
              <ShieldCheckIcon className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onStartEdit(channel)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white"
            >
              <PencilIcon className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(channel.id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-red-400"
            >
              <TrashIcon className="h-4 w-4" />
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}
