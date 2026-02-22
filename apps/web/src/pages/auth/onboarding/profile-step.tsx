/**
 * ProfileStep component - bio and theme selection
 */

import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from './animations';
import type { ProfileData } from './types';

interface ProfileStepProps {
  bio: string;
  theme: ProfileData['theme'];
  onBioChange: (bio: string) => void;
  onThemeChange: (theme: ProfileData['theme']) => void;
}

export function ProfileStep({ bio, theme, onBioChange, onThemeChange }: ProfileStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Bio */}
      <motion.div variants={itemVariants}>
        <label className="mb-2 block text-sm font-medium text-gray-300">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={4}
          maxLength={200}
          className="w-full resize-none rounded-lg border border-dark-600 bg-dark-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <p className="mt-1 text-right text-xs text-gray-500">{bio.length}/200</p>
      </motion.div>

      {/* Theme Selection */}
      <motion.div variants={itemVariants}>
        <label className="mb-3 block text-sm font-medium text-gray-300">Theme Preference</label>
        <div className="grid grid-cols-3 gap-3">
          {(['dark', 'light', 'system'] as const).map((themeOption) => (
            <button
              key={themeOption}
              type="button"
              onClick={() => onThemeChange(themeOption)}
              className={`rounded-xl border-2 p-4 transition-all duration-200 ${
                theme === themeOption
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 bg-dark-800/30 hover:border-dark-500'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {themeOption === 'dark' && (
                  <svg
                    className="h-6 w-6 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
                {themeOption === 'light' && (
                  <svg
                    className="h-6 w-6 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
                {themeOption === 'system' && (
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium capitalize text-gray-300">{themeOption}</span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
