/**
 * Email Notification Settings Page
 *
 * Allows users to configure their email notification preferences including:
 * - Enable/disable email notifications globally
 * - Configure digest email frequency (daily/weekly/monthly)
 * - Toggle notifications for specific events
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { ToggleSwitch } from '@/pages/settings/toggle-switch';
import { useEmailNotificationPreferences } from '@/pages/settings/useEmailNotificationPreferences';
import {
  DIGEST_FREQUENCIES,
  NOTIFICATION_TRIGGERS,
} from '@/pages/settings/emailNotificationSettings.constants';

/**
 * Email Notification Settings component.
 */
export default function EmailNotificationSettings() {
  const { loading, saving, preferences, savePreferences, togglePreference, setDigestFrequency } =
    useEmailNotificationPreferences();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm text-white/60">Loading preferences...</span>
        </div>
      </div>
    );
  }

  const notificationsEnabled = preferences.emailNotificationsEnabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white">Email Notifications</h1>
        <p className="text-white/60">
          Manage your email notification preferences and digest settings
        </p>
      </div>

      {/* Global Email Toggle */}
      <GlassCard variant="crystal" className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-white">Email Notifications</h3>
            <p className="text-sm text-white/60">
              Receive email notifications for important events and updates
            </p>
          </div>
          <ToggleSwitch
            enabled={notificationsEnabled}
            onToggle={() => togglePreference('emailNotificationsEnabled')}
          />
        </div>
      </GlassCard>

      {/* Digest Settings */}
      <GlassCard variant="crystal" className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-white">Email Digest</h3>
            <p className="text-sm text-white/60">
              Receive a summary of your activity and highlights
            </p>
          </div>
          <ToggleSwitch
            enabled={preferences.emailDigestEnabled}
            onToggle={() => togglePreference('emailDigestEnabled')}
            disabled={!notificationsEnabled}
          />
        </div>

        {preferences.emailDigestEnabled && notificationsEnabled && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <label className="mb-3 block text-sm font-medium text-white/80">Digest Frequency</label>
            <div className="grid grid-cols-3 gap-3">
              {DIGEST_FREQUENCIES.map((frequency) => (
                <motion.button
                  key={frequency}
                  onClick={() => setDigestFrequency(frequency)}
                  className={`rounded-lg p-4 text-center capitalize transition-all ${
                    preferences.emailDigestFrequency === frequency
                      ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {frequency}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </GlassCard>

      {/* Individual Notification Settings */}
      <GlassCard variant="crystal" className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-white">Notification Triggers</h3>

        <div className="space-y-4">
          {NOTIFICATION_TRIGGERS.map((item) => (
            <motion.div
              key={item.key}
              className="flex items-center justify-between rounded-lg bg-white/5 p-4"
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={!!preferences[item.key]}
                onToggle={() => togglePreference(item.key)}
                disabled={!notificationsEnabled}
              />
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Save Button */}
      <motion.button
        onClick={savePreferences}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {saving ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </>
        ) : (
          'Save Preferences'
        )}
      </motion.button>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-500/10 p-4 text-sm text-blue-300">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <span>ℹ️</span>
          <span>Email Delivery</span>
        </div>
        <p className="text-blue-300/80">
          Emails are sent from noreply@cgraph.app. Please add this address to your contacts to
          ensure delivery.
        </p>
      </div>
    </div>
  );
}
