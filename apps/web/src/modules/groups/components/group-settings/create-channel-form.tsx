/**
 * Create Channel Form component
 * @module modules/groups/components/group-settings
 */

import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon, HashtagIcon, SpeakerWaveIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

const channelIcons = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  announcement: MegaphoneIcon,
} as const;

interface CreateChannelFormProps {
  show: boolean;
  newName: string;
  newType: 'text' | 'voice' | 'announcement';
  newTopic: string;
  onNameChange: (name: string) => void;
  onTypeChange: (type: 'text' | 'voice' | 'announcement') => void;
  onTopicChange: (topic: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Create Channel Form component.
 */
export function CreateChannelForm({
  show,
  newName,
  newType,
  newTopic,
  onNameChange,
  onTypeChange,
  onTopicChange,
  onClose,
  onCreate,
}: CreateChannelFormProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <GlassCard variant="frosted" className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">New Channel</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-3">
              {(['text', 'voice', 'announcement'] as const).map((type) => {
                const Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> = channelIcons[type];
                return (
                  <button
                    key={type}
                    onClick={() => onTypeChange(type)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                      newType === type
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-white/[0.08] text-gray-400 hover:border-white/[0.08]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {type}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="channel-name"
              value={newName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Channel topic (optional)"
              value={newTopic}
              onChange={(e) => onTopicChange(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreate}
                disabled={!newName.trim()}
                className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Create
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
