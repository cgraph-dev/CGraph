/**
 * Profile avatar upload and display section.
 * @module
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import type { User } from '@/modules/auth/store/authStore.types';

interface AvatarSectionProps {
  user: User | null;
}

/**
 * unknown for the settings module.
 */
/**
 * Avatar Section component.
 */
export function AvatarSection({ user }: AvatarSectionProps) {
  return (
    <GlassCard variant="crystal" glow className="mb-8 p-6">
      <label className="mb-3 block text-sm font-medium text-gray-300">Profile Picture</label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-dark-700 ring-2 ring-dark-600 transition-all hover:ring-primary-500">
          {user?.avatarUrl ? (
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user?.displayName || user?.username || 'User'}
              size="large"
              className="h-20 w-20"
              avatarBorderId={getAvatarBorderId(user)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => HapticFeedback.medium()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20"
          >
            Upload Image
          </motion.button>
          <p className="mt-1 text-xs text-gray-500">JPG, PNG, or GIF. Max 2MB.</p>
        </div>
      </div>
    </GlassCard>
  );
}
