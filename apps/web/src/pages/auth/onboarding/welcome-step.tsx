/**
 * WelcomeStep component - avatar upload and display name
 */

import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from './animations';

interface WelcomeStepProps {
  avatarPreview: string | null;
  displayName: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDisplayNameChange: (name: string) => void;
}

/**
 * unknown for the auth module.
 */
/**
 * Welcome Step component.
 */
export function WelcomeStep({
  avatarPreview,
  displayName,
  onAvatarChange,
  onDisplayNameChange,
}: WelcomeStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Avatar Upload */}
      <motion.div variants={itemVariants} className="flex flex-col items-center">
        <label className="group relative cursor-pointer">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-primary-500/30 shadow-glow-sm transition-all duration-300 group-hover:border-primary-500 group-hover:shadow-glow-md">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-4xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 shadow-lg transition-transform group-hover:scale-110">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
        </label>
        <p className="mt-4 text-sm text-gray-400">Click to upload your avatar</p>
      </motion.div>

      {/* Display Name */}
      <motion.div variants={itemVariants}>
        <label className="mb-2 block text-sm font-medium text-gray-300">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="How should we call you?"
          className="w-full rounded-lg border border-dark-600 bg-dark-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </motion.div>
    </motion.div>
  );
}
