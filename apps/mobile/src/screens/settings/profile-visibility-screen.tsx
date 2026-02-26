/**
 * Profile visibility settings screen for controlling what others can see.
 * @module screens/settings/profile-visibility-screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../lib/api';

// ============================================================================
// Types
// ============================================================================

type VisibilityLevel = 'public' | 'friends' | 'private';

interface VisibilitySettings {
  profileVisibility: VisibilityLevel;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showPostCount: boolean;
  showJoinDate: boolean;
  showBio: boolean;
  showSocialLinks: boolean;
  showActivity: boolean;
  allowMessaging: 'everyone' | 'friends' | 'nobody';
  showInMemberList: boolean;
  showInSearch: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SETTINGS: VisibilitySettings = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  showLastActive: true,
  showPostCount: true,
  showJoinDate: true,
  showBio: true,
  showSocialLinks: true,
  showActivity: true,
  allowMessaging: 'everyone',
  showInMemberList: true,
  showInSearch: true,
};

const VISIBILITY_OPTIONS: {
  value: VisibilityLevel;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view your profile',
    icon: 'globe',
  },
  {
    value: 'friends',
    label: 'Friends Only',
    description: 'Only friends can view your full profile',
    icon: 'people',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see your profile details',
    icon: 'lock-closed',
  },
];

const MESSAGING_OPTIONS: { value: string; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'friends', label: 'Friends Only' },
  { value: 'nobody', label: 'Nobody' },
];

// ============================================================================
// VISIBILITY OPTION COMPONENT
// ============================================================================

interface VisibilityOptionProps {
  option: (typeof VISIBILITY_OPTIONS)[0];
  isSelected: boolean;
  onSelect: () => void;
}

function VisibilityOption({ option, isSelected, onSelect }: VisibilityOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.visibilityOption, isSelected && styles.visibilityOptionSelected]}
      onPress={() => {
        HapticFeedback.light();
        onSelect();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.visibilityIcon, isSelected && styles.visibilityIconSelected]}>
        <Ionicons name={option.icon} size={24} color={isSelected ? '#10b981' : '#6b7280'} />
      </View>
      <View style={styles.visibilityInfo}>
        <Text style={[styles.visibilityLabel, isSelected && styles.visibilityLabelSelected]}>
          {option.label}
        </Text>
        <Text style={styles.visibilityDescription}>{option.description}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
    </TouchableOpacity>
  );
}

// ============================================================================
// TOGGLE SETTING COMPONENT
// ============================================================================

interface ToggleSettingProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleSetting({ label, description, value, onChange, disabled }: ToggleSettingProps) {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          HapticFeedback.light();
          onChange(v);
        }}
        trackColor={{ false: '#374151', true: '#10b98150' }}
        thumbColor={value ? '#10b981' : '#9ca3af'}
        disabled={disabled}
      />
    </View>
  );
}

// ============================================================================
// SELECT SETTING COMPONENT
// ============================================================================

interface SelectSettingProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectSetting({ label, value, options, onChange }: SelectSettingProps) {
  return (
    <View style={styles.selectSetting}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.selectOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.selectOption, value === option.value && styles.selectOptionSelected]}
            onPress={() => {
              HapticFeedback.light();
              onChange(option.value);
            }}
          >
            <Text
              style={[
                styles.selectOptionText,
                value === option.value && styles.selectOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 *
 */
export default function ProfileVisibilityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [settings, setSettings] = useState<VisibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/v1/settings/privacy');
      const data = response.data;

      setSettings({
        profileVisibility: data.profile_visibility || 'public',
        showOnlineStatus: data.show_online_status ?? true,
        showLastActive: data.show_last_active ?? true,
        showPostCount: data.show_post_count ?? true,
        showJoinDate: data.show_join_date ?? true,
        showBio: data.show_bio ?? true,
        showSocialLinks: data.show_social_links ?? true,
        showActivity: data.show_activity ?? true,
        allowMessaging: data.allow_messaging || 'everyone',
        showInMemberList: data.show_in_member_list ?? true,
        showInSearch: data.show_in_search ?? true,
      });
    } catch (error) {
      console.error('[ProfileVisibility] Error fetching settings:', error);
      // Keep defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update a setting
  const updateSetting = <K extends keyof VisibilitySettings>(
    key: K,
    value: VisibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      HapticFeedback.medium();

      await api.put('/api/v1/settings/privacy', {
        profile_visibility: settings.profileVisibility,
        show_online_status: settings.showOnlineStatus,
        show_last_active: settings.showLastActive,
        show_post_count: settings.showPostCount,
        show_join_date: settings.showJoinDate,
        show_bio: settings.showBio,
        show_social_links: settings.showSocialLinks,
        show_activity: settings.showActivity,
        allow_messaging: settings.allowMessaging,
        show_in_member_list: settings.showInMemberList,
        show_in_search: settings.showInSearch,
      });

      HapticFeedback.success();
      setHasChanges(false);
      Alert.alert('Saved', 'Your privacy settings have been updated');
    } catch (error) {
      console.error('[ProfileVisibility] Error saving settings:', error);
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back with unsaved changes
  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Unsaved Changes', 'You have unsaved changes. Do you want to save them?', [
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => handleSave().then(() => navigation.goBack()) },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const isPrivate = settings.profileVisibility === 'private';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            handleBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile Visibility</Text>
          <Text style={styles.headerSubtitle}>Control who sees your profile</Text>
        </View>
        {hasChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Visibility Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
            <Text style={styles.sectionDescription}>
              Choose who can see your profile information
            </Text>
            <View style={styles.visibilityOptions}>
              {VISIBILITY_OPTIONS.map((option) => (
                <VisibilityOption
                  key={option.value}
                  option={option}
                  isSelected={settings.profileVisibility === option.value}
                  onSelect={() => updateSetting('profileVisibility', option.value)}
                />
              ))}
            </View>
          </View>

          {/* Online Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Online Status</Text>
            <View style={styles.settingsCard}>
              <ToggleSetting
                label="Show Online Status"
                description="Let others see when you're online"
                value={settings.showOnlineStatus}
                onChange={(v) => updateSetting('showOnlineStatus', v)}
                disabled={isPrivate}
              />
              <ToggleSetting
                label="Show Last Active"
                description="Display when you were last online"
                value={settings.showLastActive}
                onChange={(v) => updateSetting('showLastActive', v)}
                disabled={isPrivate}
              />
            </View>
          </View>

          {/* Profile Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <View style={styles.settingsCard}>
              <ToggleSetting
                label="Show Post Count"
                value={settings.showPostCount}
                onChange={(v) => updateSetting('showPostCount', v)}
                disabled={isPrivate}
              />
              <ToggleSetting
                label="Show Join Date"
                value={settings.showJoinDate}
                onChange={(v) => updateSetting('showJoinDate', v)}
                disabled={isPrivate}
              />
              <ToggleSetting
                label="Show Bio"
                value={settings.showBio}
                onChange={(v) => updateSetting('showBio', v)}
                disabled={isPrivate}
              />
              <ToggleSetting
                label="Show Social Links"
                value={settings.showSocialLinks}
                onChange={(v) => updateSetting('showSocialLinks', v)}
                disabled={isPrivate}
              />
              <ToggleSetting
                label="Show Recent Activity"
                value={settings.showActivity}
                onChange={(v) => updateSetting('showActivity', v)}
                disabled={isPrivate}
              />
            </View>
          </View>

          {/* Messaging */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Messaging</Text>
            <View style={styles.settingsCard}>
              <SelectSetting
                label="Who can message you"
                value={settings.allowMessaging}
                options={MESSAGING_OPTIONS}
                 
                onChange={(v) => updateSetting('allowMessaging', v as unknown)}
              />
            </View>
          </View>

          {/* Discoverability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discoverability</Text>
            <View style={styles.settingsCard}>
              <ToggleSetting
                label="Show in Member List"
                description="Appear in the public member directory"
                value={settings.showInMemberList}
                onChange={(v) => updateSetting('showInMemberList', v)}
              />
              <ToggleSetting
                label="Show in Search Results"
                description="Allow your profile to appear in searches"
                value={settings.showInSearch}
                onChange={(v) => updateSetting('showInSearch', v)}
              />
            </View>
          </View>

          {/* Info Card */}
          {isPrivate && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text style={styles.infoText}>
                Private mode hides most profile details from others. Some visibility options are
                disabled.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#10b981',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  visibilityOptions: {
    gap: 10,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  visibilityOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  visibilityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityIconSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  visibilityInfo: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  visibilityLabelSelected: {
    color: '#10b981',
  },
  visibilityDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#fff',
  },
  settingLabelDisabled: {
    color: '#6b7280',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  selectSetting: {
    padding: 14,
  },
  selectOptions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  selectOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  selectOptionText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  selectOptionTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
    lineHeight: 19,
  },
});
