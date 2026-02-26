/**
 * Profile form input fields component.
 * @module
 */
import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { User } from '@/modules/auth/store/authStore.types';

interface ProfileFormFieldsProps {
  user: User | null;
  email: string;
  setEmail: (value: string) => void;
  isSaving: boolean;
  saveError: string | null;
}

/**
 * unknown for the settings module.
 */
/**
 * Profile Form Fields component.
 */
export function ProfileFormFields({
  user,
  email,
  setEmail,
  isSaving,
  saveError,
}: ProfileFormFieldsProps) {
  return (
    <>
      {saveError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {saveError}
        </div>
      )}

      {/* Display Name */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Display Name</label>
        <input
          type="text"
          name="displayName"
          defaultValue={user?.displayName || ''}
          placeholder="How should we call you?"
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </GlassCard>

      {/* Bio */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">About Me</label>
        <textarea
          name="bio"
          defaultValue={user?.bio || ''}
          placeholder="Tell others about yourself..."
          maxLength={300}
          rows={3}
          className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </GlassCard>

      {/* Pronouns */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Pronouns</label>
        <select
          name="pronouns"
          defaultValue={user?.pronouns || ''}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Prefer not to say</option>
          <option value="he/him">he/him</option>
          <option value="she/her">she/her</option>
          <option value="they/them">they/them</option>
          <option value="he/they">he/they</option>
          <option value="she/they">she/they</option>
          <option value="any">Any pronouns</option>
          <option value="ask">Ask me</option>
        </select>
      </GlassCard>

      {/* Banner */}
      <GlassCard variant="crystal" glow className="mb-6 p-6">
        <label className="mb-3 block text-sm font-medium text-gray-300">Profile Banner</label>
        <div className="relative h-32 overflow-hidden rounded-lg bg-dark-700 ring-1 ring-dark-600">
          {user?.bannerUrl ? (
            <img src={user.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800">
              <span className="text-sm text-gray-500">No banner set</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => HapticFeedback.medium()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
            >
              Upload Banner
            </motion.button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Recommended: 1920x480px. Max 5MB.</p>
      </GlassCard>

      {/* Email */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </GlassCard>

      {/* Wallet */}
      <GlassCard variant="crystal" glow className="mb-8 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Connected Wallet</label>
        {user?.walletAddress ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={user.walletAddress}
              disabled
              className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 font-mono text-sm text-gray-400"
            />
            <button
              type="button"
              className="rounded-lg bg-red-600/20 px-4 py-3 text-sm font-medium text-red-400 transition-all hover:scale-105 hover:bg-red-600/30 active:scale-95"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-sm font-medium text-white transition-all hover:border-primary-500 hover:bg-dark-600"
          >
            Connect Wallet
          </button>
        )}
      </GlassCard>

      {/* Save Button */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isSaving}
        className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-800 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </>
  );
}
