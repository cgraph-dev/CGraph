/**
 * ProfileEditScreen — Edit display name, bio, signature, and avatar.
 *
 * Uses expo-image-picker with built-in square crop for avatar selection.
 * Persists via PUT /api/v1/me (fields) and POST /api/v1/me/avatar (image).
 *
 * @module
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useThemeStore } from '@/stores';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Profile edit screen for mobile.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProfileEditScreen({ navigation }: { navigation: any }) {
  const { colors } = useThemeStore();
  const { user, updateUser } = useAuthStore();

  // Form state — pre-populated from current user
  const [displayName, setDisplayName] = useState(user?.display_name ?? user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [signature, setSignature] = useState(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ((user as Record<string, unknown>)?.signature as string) ?? ''
  );
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatar_url ?? user?.avatarUrl ?? null
  );

  // Loading states
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const pendingAvatarUri = React.useRef<string | null>(null);

  // -----------------------------------------------------------------------
  // Avatar picker (with built-in crop via expo-image-picker)
  // -----------------------------------------------------------------------

  const pickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow photo library access to change your avatar.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      pendingAvatarUri.current = uri;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Save handler
  // -----------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Display name is required.');
      return;
    }

    setSaving(true);
    try {
      // Upload avatar if changed
      if (pendingAvatarUri.current) {
        setUploadingAvatar(true);
        const formData = new FormData();
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        formData.append('file', {
          uri: pendingAvatarUri.current,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as unknown as Blob);

        await api.post('/api/v1/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        pendingAvatarUri.current = null;
        setUploadingAvatar(false);
      }

      // Update profile fields
      const payload: Record<string, string> = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        signature: signature.trim(),
      };

      const response = await api.put('/api/v1/me', payload);
      const updatedUser = response.data?.data ?? response.data;

      // Sync local auth store
      if (user && updatedUser) {
        updateUser({ ...user, ...updatedUser });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      setUploadingAvatar(false);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [displayName, bio, signature, user, updateUser, navigation]);

  const busy = saving || uploadingAvatar;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---- Avatar ---- */}
        <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.avatarSection}>
          <TouchableOpacity
            onPress={pickAvatar}
            disabled={busy}
            activeOpacity={0.7}
            style={styles.avatarTouchable}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
                <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>
                  {displayName?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickAvatar} disabled={busy}>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ---- Display Name ---- */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            DISPLAY NAME <Text style={{ color: '#ef4444' }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={displayName}
            onChangeText={(t) => setDisplayName(t.slice(0, 50))}
            maxLength={50}
            placeholder="Your display name"
            placeholderTextColor={colors.textSecondary}
            editable={!busy}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {displayName.length}/50
          </Text>
        </Animated.View>

        {/* ---- Bio ---- */}
        <Animated.View entering={FadeInDown.springify().delay(150)} style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>BIO</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 500))}
            maxLength={500}
            placeholder="Tell us about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!busy}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{bio.length}/500</Text>
        </Animated.View>

        {/* ---- Signature ---- */}
        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>SIGNATURE</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={signature}
            onChangeText={(t) => setSignature(t.slice(0, 100))}
            maxLength={100}
            placeholder="A short tagline (optional)"
            placeholderTextColor={colors.textSecondary}
            editable={!busy}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {signature.length}/100
          </Text>
        </Animated.View>

        {/* ---- Actions ---- */}
        <Animated.View entering={FadeInDown.springify().delay(250)} style={styles.actions}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={busy || !displayName.trim()}
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.primary,
                opacity: busy || !displayName.trim() ? 0.5 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={busy}
            style={[styles.cancelButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    marginTop: 4,
    marginRight: 4,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 15,
  },
});
