/**
 * Email Notification Settings Page
 *
 * Allows users to configure their email notification preferences including:
 * - Enable/disable email notifications globally
 * - Configure digest email frequency (daily/weekly/monthly)
 * - Toggle notifications for specific events
 * - Preview email templates
 *
 * @version 1.0.0
 * @since 2026-01-20
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GlassCard } from '@/shared/components/ui';
import { useAuthStore } from '@/modules/auth/store';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EmailNotificationSettings');

interface EmailPreferences {
  emailNotificationsEnabled: boolean;
  emailDigestEnabled: boolean;
  emailDigestFrequency: 'daily' | 'weekly' | 'monthly';
  emailOnNewMessage: boolean;
  emailOnFriendRequest: boolean;
  emailOnMention: boolean;
  emailOnReply: boolean;
  emailOnAchievement: boolean;
}

export default function EmailNotificationSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    emailNotificationsEnabled: true,
    emailDigestEnabled: true,
    emailDigestFrequency: 'weekly',
    emailOnNewMessage: true,
    emailOnFriendRequest: true,
    emailOnMention: true,
    emailOnReply: true,
    emailOnAchievement: false,
  });

  useEffect(() => {
    fetchPreferences();
  }, [user?.id]);

  const fetchPreferences = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/users/${user.id}`);
      const userData = response.data;

      setPreferences({
        emailNotificationsEnabled: userData.email_notifications_enabled ?? true,
        emailDigestEnabled: userData.email_digest_enabled ?? true,
        emailDigestFrequency: userData.email_digest_frequency ?? 'weekly',
        emailOnNewMessage: userData.email_on_new_message ?? true,
        emailOnFriendRequest: userData.email_on_friend_request ?? true,
        emailOnMention: userData.email_on_mention ?? true,
        emailOnReply: userData.email_on_reply ?? true,
        emailOnAchievement: userData.email_on_achievement ?? false,
      });
    } catch (error) {
      logger.error('Failed to fetch email preferences:', error);
      toast.error('Failed to load email preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      await api.patch(`/users/${user.id}`, {
        email_notifications_enabled: preferences.emailNotificationsEnabled,
        email_digest_enabled: preferences.emailDigestEnabled,
        email_digest_frequency: preferences.emailDigestFrequency,
        email_on_new_message: preferences.emailOnNewMessage,
        email_on_friend_request: preferences.emailOnFriendRequest,
        email_on_mention: preferences.emailOnMention,
        email_on_reply: preferences.emailOnReply,
        email_on_achievement: preferences.emailOnAchievement,
      });

      toast.success('Email preferences saved successfully!');
    } catch (error) {
      logger.error('Failed to save email preferences:', error);
      toast.error('Failed to save email preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof EmailPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setDigestFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    setPreferences((prev) => ({
      ...prev,
      emailDigestFrequency: frequency,
    }));
  };

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

          <motion.button
            onClick={() => togglePreference('emailNotificationsEnabled')}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              preferences.emailNotificationsEnabled ? 'bg-primary-600' : 'bg-white/10'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg"
              animate={{ x: preferences.emailNotificationsEnabled ? 30 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
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

          <motion.button
            onClick={() => togglePreference('emailDigestEnabled')}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              preferences.emailDigestEnabled ? 'bg-primary-600' : 'bg-white/10'
            }`}
            whileTap={{ scale: 0.95 }}
            disabled={!preferences.emailNotificationsEnabled}
          >
            <motion.div
              className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg"
              animate={{ x: preferences.emailDigestEnabled ? 30 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>

        {preferences.emailDigestEnabled && preferences.emailNotificationsEnabled && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <label className="mb-3 block text-sm font-medium text-white/80">Digest Frequency</label>
            <div className="grid grid-cols-3 gap-3">
              {(['daily', 'weekly', 'monthly'] as const).map((frequency) => (
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
          {[
            {
              key: 'emailOnNewMessage' as const,
              icon: '💬',
              title: 'New Messages',
              description: 'When you receive a new direct message',
            },
            {
              key: 'emailOnFriendRequest' as const,
              icon: '👥',
              title: 'Friend Requests',
              description: 'When someone sends you a friend request',
            },
            {
              key: 'emailOnMention' as const,
              icon: '@',
              title: 'Mentions',
              description: 'When someone mentions you in a post or comment',
            },
            {
              key: 'emailOnReply' as const,
              icon: '💬',
              title: 'Replies',
              description: 'When someone replies to your post or comment',
            },
            {
              key: 'emailOnAchievement' as const,
              icon: '🏆',
              title: 'Achievements',
              description: 'When you unlock a new achievement',
            },
          ].map((item) => (
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

              <motion.button
                onClick={() => togglePreference(item.key)}
                className={`relative h-8 w-14 rounded-full transition-colors ${
                  preferences[item.key] ? 'bg-primary-600' : 'bg-white/10'
                }`}
                whileTap={{ scale: 0.95 }}
                disabled={!preferences.emailNotificationsEnabled}
              >
                <motion.div
                  className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg"
                  animate={{ x: preferences[item.key] ? 30 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
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
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
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
