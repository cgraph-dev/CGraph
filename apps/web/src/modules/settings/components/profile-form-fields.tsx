/**
 * Profile form input fields component.
 * @module
 */
import { motion } from 'motion/react';
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
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-400 shadow-lg shadow-red-500/5">
          {saveError}
        </div>
      )}

      {/* Display Name */}
      <GlassCard variant="default" className="relative mb-5 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label className="mb-3 block text-sm font-semibold text-white/70">Display Name</label>
        <input
          type="text"
          name="displayName"
          defaultValue={user?.displayName || ''}
          placeholder="How should we call you?"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04]/60 px-4 py-3 text-white placeholder-white/30 shadow-inner shadow-black/20 transition-all focus:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </GlassCard>

      {/* Bio */}
      <GlassCard variant="default" className="relative mb-5 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label className="mb-3 block text-sm font-semibold text-white/70">About Me</label>
        <textarea
          name="bio"
          defaultValue={user?.bio || ''}
          placeholder="Tell others about yourself..."
          maxLength={300}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04]/60 px-4 py-3 text-white placeholder-white/30 shadow-inner shadow-black/20 transition-all focus:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </GlassCard>

      {/* Pronouns */}
      <GlassCard variant="default" className="relative mb-5 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label className="mb-3 block text-sm font-semibold text-white/70">Pronouns</label>
        <select
          name="pronouns"
          defaultValue={user?.pronouns || ''}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04]/60 px-4 py-3 text-white transition-all focus:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
      <GlassCard variant="crystal" glow className="relative mb-5 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <label className="mb-3 block text-sm font-semibold text-white/70">Profile Banner</label>
        <div className="relative h-36 overflow-hidden rounded-xl bg-white/[0.04]/60 ring-1 ring-white/[0.06]">
          {user?.bannerUrl ? (
            <img src={user.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-800 via-dark-800/80 to-dark-900">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
                  <svg
                    className="h-5 w-5 text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-white/25">No banner set</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => HapticFeedback.medium()}
              className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-500/20"
            >
              Upload Banner
            </motion.button>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/25">Recommended: 1920x480px. Max 5MB.</p>
      </GlassCard>

      {/* Email */}
      <GlassCard variant="default" className="relative mb-5 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label className="mb-3 block text-sm font-semibold text-white/70">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04]/60 px-4 py-3 text-white placeholder-white/30 shadow-inner shadow-black/20 transition-all focus:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </GlassCard>

      {/* Wallet */}
      <GlassCard variant="crystal" glow className="relative mb-8 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <label className="mb-3 block text-sm font-semibold text-white/70">Connected Wallet</label>
        {user?.walletAddress ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={user.walletAddress}
              disabled
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04]/60 px-4 py-3 font-mono text-sm text-gray-400 shadow-inner shadow-black/20"
            />
            <button
              type="button"
              className="rounded-xl bg-red-500/[0.08] px-4 py-3 text-sm font-medium text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/[0.15] active:scale-95"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="rounded-xl border border-white/[0.08] bg-white/[0.04]/60 px-5 py-3 text-sm font-medium text-white shadow-inner shadow-black/20 transition-all hover:border-primary-500/30 hover:bg-white/[0.06] hover:shadow-primary-500/5"
          >
            Connect Wallet
          </button>
        )}
      </GlassCard>

      {/* Save Button */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isSaving}
        className="w-full rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3.5 font-semibold text-white shadow-xl shadow-primary-500/20 transition-all hover:shadow-primary-500/30 disabled:opacity-50 sm:w-auto"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </>
  );
}
