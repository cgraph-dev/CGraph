/**
 * ProfileCustomizationScreen — profile cosmetics settings.
 *
 * Allows users to customize Avatar Decoration (border), Nameplate,
 * Profile Effect, Banner, Display Name, and Pronouns.
 * Live preview on tablets, floating preview button on phones.
 *
 * @module screens/profile/ProfileCustomizationScreen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, useAuthStore } from '@/stores';
import api from '@/lib/api';
import { ProfileCard } from '../../modules/profile/components/ProfileCard';
import { BorderPickerModal } from './BorderPickerModal';
import { NameplatePicker } from './NameplatePicker';

/**
 * Profile customization settings screen.
 */
export default function ProfileCustomizationScreen() {
  const { colors } = useThemeStore();
  const { user, updateUser } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  // Local staged state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [pronouns, setPronouns] = useState('');
  const [equippedBorderId, setEquippedBorderId] = useState<string | undefined>(undefined);
  const [equippedNameplateId, setEquippedNameplateId] = useState<string | undefined>('default');
  const [equippedProfileEffectId] = useState<string | undefined>(undefined);
  const [equippedBannerUrl] = useState<string | undefined>(undefined);

  // Modal states
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/api/v1/me', {
        display_name: displayName.trim(),
        // Additional fields as API supports them:
        // equipped_border_id: equippedBorderId,
        // equipped_nameplate_id: equippedNameplateId,
        // equipped_profile_effect_id: equippedProfileEffectId,
        // equipped_banner_url: equippedBannerUrl,
      });
      updateUser(response.data.data);
      Alert.alert('Saved', 'Profile customization updated.');
    } catch {
      Alert.alert('Error', 'Failed to save customization.');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, updateUser]);

  const profilePreview = (
    <ProfileCard
      user={{
        id: user?.id ?? '',
        username: user?.username ?? null,
        display_name: displayName || user?.display_name || '',
        avatar_url: user?.avatar_url || undefined,
        bio: user?.bio || undefined,
        status: user?.status ?? 'online',
      }}
      equippedBorderId={equippedBorderId}
      equippedNameplateId={equippedNameplateId}
      equippedProfileEffectId={equippedProfileEffectId}
      equippedBannerUrl={equippedBannerUrl}
      isPreview={false}
    />
  );

  const formContent = (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Display Name */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Display Name</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          ]}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          placeholderTextColor={colors.textTertiary}
          maxLength={50}
        />
      </View>

      {/* Pronouns */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Pronouns</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          ]}
          value={pronouns}
          onChangeText={setPronouns}
          placeholder="e.g. they/them"
          placeholderTextColor={colors.textTertiary}
          maxLength={30}
        />
      </View>

      {/* Avatar Decoration (Border) */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Avatar Decoration</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowBorderPicker(true)}
        >
          <Ionicons name="color-palette" size={20} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            {equippedBorderId ? 'Change Border' : 'Choose Border'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Nameplate */}
      <NameplatePicker
        currentNameplateId={equippedNameplateId}
        onSelect={setEquippedNameplateId}
      />

      {/* Profile Effect */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Profile Effect</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          disabled
        >
          <Ionicons name="sparkles" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
            Coming Soon
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Profile Banner</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          disabled
        >
          <Ionicons name="image" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
            Coming Soon
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isTablet ? (
          /* Tablet: side-by-side layout */
          <View style={styles.tabletLayout}>
            <View style={styles.tabletForm}>{formContent}</View>
            <View style={styles.tabletPreview}>{profilePreview}</View>
          </View>
        ) : (
          /* Phone: form only, floating preview button */
          <View style={styles.flex}>
            {formContent}
            <TouchableOpacity
              style={[styles.previewFab, { backgroundColor: colors.primary }]}
              onPress={() => setShowPreview(true)}
            >
              <Ionicons name="eye" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Border Picker Modal */}
      <BorderPickerModal
        visible={showBorderPicker}
        currentBorderId={equippedBorderId}
        onSelect={(id) => {
          setEquippedBorderId(id);
          setShowBorderPicker(false);
        }}
        onClose={() => setShowBorderPicker(false)}
      />

      {/* Phone preview modal */}
      {!isTablet && (
        <Modal visible={showPreview} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.previewModal, { backgroundColor: colors.background }]}>
            <View style={[styles.previewHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Text style={[styles.previewClose, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewContainer}>{profilePreview}</View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 100,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tablet layout
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletForm: {
    flex: 1,
  },
  tabletPreview: {
    width: 360,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Phone preview FAB
  previewFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Preview modal (phone)
  previewModal: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  previewClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
