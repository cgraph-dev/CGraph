/**
 * DND Schedule Screen — Configure quiet hours and timezone.
 * @module screens/settings/dnd-schedule-screen
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore, useThemeStore } from '@/stores';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'DndSchedule'>;
};

// Generate hour options for time picker
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}:00`,
  value: `${i.toString().padStart(2, '0')}:00`,
}));

/**
 * DND Schedule configuration screen.
 */
export default function DndScheduleScreen({ navigation: _navigation }: Props) {
  const { colors } = useThemeStore();
  const {
    settings,
    updateNotificationSettings,
    updateLocaleSettings,
    isLoading,
    isSaving,
    fetchSettings,
  } = useSettingsStore();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  useEffect(() => {
    fetchSettings().finally(() => setHasLoaded(true));
  }, [fetchSettings]);

  useEffect(() => {
    if (hasLoaded) {
      setQuietHoursEnabled(settings.notifications.quietHoursEnabled);
      setStartTime(settings.notifications.quietHoursStart || '22:00');
      setEndTime(settings.notifications.quietHoursEnd || '07:00');
      setTimezone(settings.locale.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [hasLoaded, settings.notifications, settings.locale]);

  const handleSave = useCallback(async () => {
    try {
      await updateNotificationSettings({
        quietHoursEnabled,
        quietHoursStart: quietHoursEnabled ? startTime : null,
        quietHoursEnd: quietHoursEnabled ? endTime : null,
      });
      await updateLocaleSettings({ timezone });
      Alert.alert('Saved', 'Quiet hours settings saved successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save quiet hours settings.');
    }
  }, [
    quietHoursEnabled,
    startTime,
    endTime,
    timezone,
    updateNotificationSettings,
    updateLocaleSettings,
  ]);

  if (!hasLoaded && isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Quiet Hours Toggle */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quiet Hours</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Scheduled Quiet Hours
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Suppress notifications during set times
              </Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={setQuietHoursEnabled}
              trackColor={{ false: colors.surfaceHover, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* Time Pickers */}
      {quietHoursEnabled && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Schedule</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Start Time</Text>
              <Picker
                selectedValue={startTime}
                onValueChange={(v) => setStartTime(v)}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={[styles.picker, { color: colors.text } as any]}
                dropdownIconColor={colors.text}
              >
                {HOURS.map((h) => (
                  <Picker.Item key={h.value} label={h.label} value={h.value} />
                ))}
              </Picker>
            </View>
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>End Time</Text>
              <Picker
                selectedValue={endTime}
                onValueChange={(v) => setEndTime(v)}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={[styles.picker, { color: colors.text } as any]}
                dropdownIconColor={colors.text}
              >
                {HOURS.map((h) => (
                  <Picker.Item key={h.value} label={h.label} value={h.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      )}

      {/* Timezone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Timezone</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{timezone}</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Quiet hours use your timezone
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Text
          onPress={handleSave}
          style={
             
            [
              styles.saveButton,
              { backgroundColor: colors.primary, opacity: isSaving ? 0.5 : 1 },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ] as any
          }
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Text>
      </View>

      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.savingText, { color: colors.textSecondary }]}>Saving...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  picker: {
    width: 120,
    height: Platform.OS === 'ios' ? 120 : 40,
  },
  buttonContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  saveButton: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
  },
});
