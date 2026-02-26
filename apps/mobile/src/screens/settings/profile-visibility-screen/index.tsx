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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../../lib/api';
import { type VisibilitySettings, DEFAULT_SETTINGS, VISIBILITY_OPTIONS, MESSAGING_OPTIONS } from './types';
import { styles } from './styles';
import { VisibilityOption } from './visibility-option';
import { ToggleSetting } from './toggle-setting';
import { SelectSetting } from './select-setting';

/**
 * Profile visibility settings screen.
 */
export default function ProfileVisibilityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [settings, setSettings] = useState<VisibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = <K extends keyof VisibilitySettings>(
    key: K,
    value: VisibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { HapticFeedback.light(); handleBack(); }}
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <View style={styles.settingsCard}>
              <ToggleSetting label="Show Post Count" value={settings.showPostCount} onChange={(v) => updateSetting('showPostCount', v)} disabled={isPrivate} />
              <ToggleSetting label="Show Join Date" value={settings.showJoinDate} onChange={(v) => updateSetting('showJoinDate', v)} disabled={isPrivate} />
              <ToggleSetting label="Show Bio" value={settings.showBio} onChange={(v) => updateSetting('showBio', v)} disabled={isPrivate} />
              <ToggleSetting label="Show Social Links" value={settings.showSocialLinks} onChange={(v) => updateSetting('showSocialLinks', v)} disabled={isPrivate} />
              <ToggleSetting label="Show Recent Activity" value={settings.showActivity} onChange={(v) => updateSetting('showActivity', v)} disabled={isPrivate} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Messaging</Text>
            <View style={styles.settingsCard}>
              <SelectSetting
                label="Who can message you"
                value={settings.allowMessaging}
                options={MESSAGING_OPTIONS}
                onChange={(v) => updateSetting('allowMessaging', v as 'everyone' | 'friends' | 'nobody')}
              />
            </View>
          </View>

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
