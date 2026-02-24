/**
 * Security settings panel.
 * @module
 */
import { motion } from 'framer-motion';
import { useAuthStore } from '@/modules/auth/store';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';

export function SecuritySettingsPanel() {
  const { user } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={tweens.standard}
    >
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        Security
      </h1>

      {/* Password */}
      <GlassCard variant="default" className="mb-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Password</h3>
            <p className="mt-1 text-sm text-gray-400">Change your password</p>
          </div>
          <button className="rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-dark-600">
            Change
          </button>
        </div>
      </GlassCard>

      {/* 2FA */}
      <GlassCard variant="default" className="mb-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Two-Factor Authentication</h3>
            <p className="mt-1 text-sm text-gray-400">
              {user?.twoFactorEnabled
                ? 'Two-factor authentication is enabled'
                : 'Add an extra layer of security'}
            </p>
          </div>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              user?.twoFactorEnabled
                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
            }`}
          >
            {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </GlassCard>

      {/* Email Verification */}
      <GlassCard variant="default" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Email Verification</h3>
            <p className="mt-1 text-sm text-gray-400">
              {user?.emailVerifiedAt ? 'Your email is verified' : 'Verify your email address'}
            </p>
          </div>
          {!user?.emailVerifiedAt && (
            <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
              Verify
            </button>
          )}
          {user?.emailVerifiedAt && <span className="text-sm text-green-400">✓ Verified</span>}
        </div>
      </GlassCard>

      {/* Active Sessions */}
      <GlassCard variant="default" className="mt-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Active Sessions</h3>
            <p className="mt-1 text-sm text-gray-400">Manage your logged-in devices and sessions</p>
          </div>
          <a
            href="/settings/sessions"
            className="rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-dark-600"
          >
            View Sessions
          </a>
        </div>
      </GlassCard>
    </motion.div>
  );
}
