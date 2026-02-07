import { motion } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ForumModerator } from '@/modules/forums/store';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

interface ModeratorsPanelProps {
  moderators: ForumModerator[];
  newModUsername: string;
  ownerDisplayName: string;
  forumId: string;
  onNewModUsernameChange: (username: string) => void;
  onAddModerator: (moderator: ForumModerator) => void;
  onRemoveModerator: (modId: string) => void;
}

export function ModeratorsPanel({
  moderators,
  newModUsername,
  ownerDisplayName,
  forumId,
  onNewModUsernameChange,
  onAddModerator,
  onRemoveModerator,
}: ModeratorsPanelProps) {
  const handleAddModerator = () => {
    if (newModUsername.trim()) {
      const newMod: ForumModerator = {
        id: `mod_${Date.now()}`,
        forumId: forumId,
        userId: `user_${Date.now()}`,
        username: newModUsername.trim(),
        permissions: ['all'],
        addedAt: new Date().toISOString(),
      };
      onAddModerator(newMod);
      onNewModUsernameChange('');
      HapticFeedback.success();
    }
  };

  const handleRemoveModerator = (modId: string) => {
    onRemoveModerator(modId);
    HapticFeedback.medium();
  };

  return (
    <motion.div
      key="moderators"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Moderators</h2>
        <p className="text-gray-400">Manage your moderation team.</p>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={newModUsername}
              onChange={(e) => onNewModUsernameChange(e.target.value)}
              placeholder="Search username to add..."
              className="w-full rounded-lg border border-dark-600 bg-dark-700 py-2.5 pl-10 pr-4 text-white"
            />
          </div>
          <motion.button
            onClick={handleAddModerator}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Add
          </motion.button>
        </div>

        {/* Owner */}
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-gray-400">Owner</h4>
          <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
              <span className="font-bold text-white">{ownerDisplayName?.[0] || 'O'}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{ownerDisplayName}</span>
                <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                  Owner
                </span>
              </div>
              <span className="text-sm text-gray-400">Full access to all settings</span>
            </div>
          </div>
        </div>

        {/* Moderators List */}
        <h4 className="mb-2 text-sm font-medium text-gray-400">Moderators</h4>
        {moderators.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <ShieldCheckIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No moderators yet. Add team members to help manage your forum.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {moderators.map((mod) => (
              <motion.div
                key={mod.id}
                className="group flex items-center gap-3 rounded-lg bg-dark-700/50 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="font-bold text-white">
                    {mod.username?.[0]?.toUpperCase() || 'M'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{mod.username}</span>
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                      Moderator
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    Added {new Date(mod.addedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveModerator(mod.id)}
                  className="p-2 text-gray-400 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
