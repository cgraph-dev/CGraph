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
    <GlassCard variant="crystal" glow className="relative mb-6 overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
      <label className="mb-4 block text-sm font-semibold text-white/70">Profile Picture</label>
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-white/[0.04]/60 shadow-lg shadow-black/20 ring-2 ring-white/[0.08] transition-all duration-200 hover:ring-primary-500/40">
          {user?.avatarUrl ? (
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user?.displayName || user?.username || 'User'}
              size="large"
              className="h-20 w-20 rounded-2xl"
              avatarBorderId={getAvatarBorderId(user)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500/10 to-purple-500/10 text-3xl font-bold text-white/40">
              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => HapticFeedback.medium()}
            className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:shadow-primary-500/30"
          >
            Upload Image
          </motion.button>
          <p className="mt-2 text-xs text-white/25">JPG, PNG, or GIF. Max 2MB.</p>
        </div>
      </div>
    </GlassCard>
  );
}
