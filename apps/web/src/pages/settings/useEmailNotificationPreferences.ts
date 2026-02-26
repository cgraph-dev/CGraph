/**
 * Hook encapsulating fetch/save logic for email notification preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/modules/auth/store';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import {
  DEFAULT_EMAIL_PREFERENCES,
  type EmailPreferences,
} from '@/pages/settings/emailNotificationSettings.constants';

const logger = createLogger('EmailNotificationSettings');

/**
 * unknown for the settings module.
 */
/**
 * Hook for managing email notification preferences.
 */
export function useEmailNotificationPreferences() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>(DEFAULT_EMAIL_PREFERENCES);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/users/${user.id}`);
      const d = response.data;

      setPreferences({
        emailNotificationsEnabled: d.email_notifications_enabled ?? true,
        emailDigestEnabled: d.email_digest_enabled ?? true,
        emailDigestFrequency: d.email_digest_frequency ?? 'weekly',
        emailOnNewMessage: d.email_on_new_message ?? true,
        emailOnFriendRequest: d.email_on_friend_request ?? true,
        emailOnMention: d.email_on_mention ?? true,
        emailOnReply: d.email_on_reply ?? true,
        emailOnAchievement: d.email_on_achievement ?? false,
      });
    } catch (error) {
      logger.error('Failed to fetch email preferences:', error);
      toast.error('Failed to load email preferences');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

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
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setDigestFrequency = (frequency: EmailPreferences['emailDigestFrequency']) => {
    setPreferences((prev) => ({ ...prev, emailDigestFrequency: frequency }));
  };

  return { loading, saving, preferences, savePreferences, togglePreference, setDigestFrequency };
}
