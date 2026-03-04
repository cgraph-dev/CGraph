/**
 * DND Schedule Panel — Configure quiet hours and timezone.
 * @module modules/settings/components/panels/dnd-schedule-panel
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useSettingsStore } from '@/modules/settings/store';
import { toast } from '@/shared/components/ui';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';

// Common timezones for the selector
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

/**
 * DND Schedule Panel — quiet hours configuration with timezone support.
 */
export function DndSchedulePanel() {
  const { settings, updateNotificationSettings, updateLocaleSettings, isSaving, fetchSettings } =
    useSettingsStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  useEffect(() => {
    fetchSettings().finally(() => setIsLoaded(true));
  }, [fetchSettings]);

  useEffect(() => {
    if (isLoaded) {
      setQuietHoursEnabled(settings.notifications.quietHoursEnabled);
      setStartTime(settings.notifications.quietHoursStart || '22:00');
      setEndTime(settings.notifications.quietHoursEnd || '07:00');
      setTimezone(settings.locale.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [isLoaded, settings.notifications, settings.locale.timezone]);

  const handleSave = useCallback(async () => {
    try {
      await updateNotificationSettings({
        quietHoursEnabled,
        quietHoursStart: quietHoursEnabled ? startTime : null,
        quietHoursEnd: quietHoursEnabled ? endTime : null,
      });
      // Also sync timezone
      await updateLocaleSettings({ timezone });
      toast.success('Quiet hours saved');
    } catch {
      toast.error('Failed to save quiet hours');
    }
  }, [
    quietHoursEnabled,
    startTime,
    endTime,
    timezone,
    updateNotificationSettings,
    updateLocaleSettings,
  ]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={tweens.standard}
      className="space-y-6"
    >
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        Do Not Disturb Schedule
      </h1>

      {/* Quiet Hours Toggle */}
      <GlassCard variant="default" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Scheduled Quiet Hours</h3>
            <p className="text-sm text-gray-400">
              Automatically suppress notifications during set times
            </p>
          </div>
          <button
            onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              quietHoursEnabled ? 'bg-primary-600' : 'bg-dark-600'
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                quietHoursEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </GlassCard>

      {/* Time Pickers */}
      {quietHoursEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <GlassCard variant="default" className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white" htmlFor="quiet-start">
                  Start Time
                </label>
                <input
                  id="quiet-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white" htmlFor="quiet-end">
                  End Time
                </label>
                <input
                  id="quiet-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
          </GlassCard>

          {/* Timezone */}
          <GlassCard variant="default" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Timezone</h3>
                <p className="text-xs text-gray-400">
                  Quiet hours use your timezone for scheduling
                </p>
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="max-w-[200px] rounded-lg border border-dark-500 bg-dark-700 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 ${
          isSaving ? 'cursor-wait opacity-50' : ''
        }`}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </motion.div>
  );
}
