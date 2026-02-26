/**
 * ProfileAbout - Bio section with edit mode
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';

interface ProfileAboutProps {
  bio?: string;
  isOwnProfile: boolean;
  editMode: boolean;
  editedBio: string;
  onBioChange: (value: string) => void;
}

/**
 * unknown for the profile module.
 */
/**
 * Profile About component.
 */
export function ProfileAbout({
  bio,
  isOwnProfile,
  editMode,
  editedBio,
  onBioChange,
}: ProfileAboutProps) {
  // Only show if there's a bio or we're editing our own profile
  if (!bio && !(isOwnProfile && editMode)) {
    return null;
  }

  return (
    <GlassCard variant="default" className="p-6">
      <h2 className="mb-3 flex items-center gap-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
        About
        {isOwnProfile && editMode && (
          <span className="text-xs font-normal text-gray-500">(Click to edit)</span>
        )}
      </h2>

      {isOwnProfile && editMode ? (
        <motion.textarea
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          value={editedBio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell us about yourself..."
          className="w-full resize-none rounded-lg border border-primary-500/30 bg-dark-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none"
          rows={4}
          maxLength={500}
        />
      ) : (
        <p className="whitespace-pre-wrap text-gray-300">{bio}</p>
      )}

      {isOwnProfile && editMode && (
        <p className="mt-2 text-right text-xs text-gray-500">{editedBio.length} / 500 characters</p>
      )}
    </GlassCard>
  );
}
