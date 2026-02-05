/**
 * ProfileAvatar - Avatar section with edit mode overlay and level badge
 */

import { motion } from 'framer-motion';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { AnimatedAvatar } from '@/shared/components/ui';
import type { UserProfileData } from '@/types/profile.types';

interface ProfileAvatarProps {
  profile: UserProfileData;
  isOwnProfile: boolean;
  editMode: boolean;
  isUploading: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
}

export function ProfileAvatar({
  profile,
  isOwnProfile,
  editMode,
  isUploading,
  avatarInputRef,
  onAvatarChange,
  onAvatarClick,
}: ProfileAvatarProps) {
  return (
    <motion.div
      className="group relative"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <AnimatedAvatar
        src={profile.avatarUrl || undefined}
        alt={profile.displayName || profile.username || 'User'}
        size="2xl"
        showStatus={true}
        statusType={profile.status}
      />

      {/* Avatar Edit Overlay */}
      {isOwnProfile && editMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-dark-900/70 backdrop-blur-sm transition-colors hover:bg-dark-900/80"
          onClick={onAvatarClick}
        >
          <div className="text-center">
            {isUploading ? (
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            ) : (
              <PhotoIcon className="mx-auto h-8 w-8 text-white" />
            )}
          </div>
        </motion.div>
      )}

      {/* Hidden file input for avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onAvatarChange}
      />

      {/* Level badge overlay */}
      {profile.level && profile.level > 1 && (
        <motion.div
          className="absolute -bottom-1 -right-1 rounded-full border-2 border-dark-900 bg-gradient-to-r from-primary-600 to-purple-600 px-2 py-0.5 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <span className="text-xs font-bold text-white">Lvl {profile.level}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
