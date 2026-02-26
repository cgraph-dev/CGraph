/**
 * Profile settings screen for editing user profile information.
 * @module screens/settings/profile-screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useThemeStore } from '@/stores';
import { getValidImageUrl } from '../../lib/imageUtils';
import api from '../../lib/api';
import { SettingsStackParamList } from '../../types';
import { AnimatedAvatar, GlassCard, TitleBadge } from '../../components';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Profile'>;
};

/**
 *
 */
export default function ProfileScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const { user, updateUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const canChangeUsername = user?.can_change_username ?? true;
  const nextChangeDate = user?.username_next_change_at
    ? new Date(user.username_next_change_at).toLocaleDateString()
    : null;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Upload image
      const formData = new FormData();
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop() || 'avatar.jpg';

       
      formData.append('avatar', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as unknown);

      try {
        const response = await api.post('/api/v1/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser(response.data.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload avatar');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/api/v1/me', {
        display_name: displayName.trim(),
        bio: bio.trim(),
      });
      updateUser(response.data.data);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!username.trim() || username === user?.username) return;

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      Alert.alert(
        'Invalid Username',
        'Username must be 3-30 characters and contain only letters, numbers, and underscores.'
      );
      return;
    }

    setIsChangingUsername(true);
    try {
      const response = await api.put('/api/v1/me/username', { username });
      updateUser({
        ...user!,
        username: response.data.data.username,
        can_change_username: false,
        username_next_change_at: response.data.data.username_next_change_at,
      });
      Alert.alert('Success', 'Username changed successfully');
    } catch (err: unknown) {
       
      const error = err as {
        response?: { data?: { error?: { message?: string }; message?: string } };
      };
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to change username';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsChangingUsername(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Avatar with Next-Gen Animation */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          <AnimatedAvatar
            source={
              getValidImageUrl(user?.avatar_url)
                ? { uri: getValidImageUrl(user?.avatar_url)! }
                : {
                    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=10b981&color=fff&size=256`,
                  }
            }
            size={120}
            borderAnimation={user?.is_premium ? 'cosmic' : 'gradient'}
            showStatus={true}
            isOnline={true}
            isPremium={user?.is_premium}
            glowIntensity={0.7}
          />
          <View style={[styles.editBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name="camera" size={16} color={colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change photo</Text>
        {/* User Title Badge */}
        {user?.title && (
          <View style={{ marginTop: 12 }}>
            <TitleBadge
              title={user.title}
               
              rarity={(user.title_rarity as unknown) || 'common'}
              animation="shimmer"
              showSparkles={true}
            />
          </View>
        )}
        {/* User ID Display */}
        <GlassCard
          variant="frosted"
          intensity="subtle"
          style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8 }}
        >
          <Text style={[styles.uidText, { color: colors.primary }]}>
            {user?.user_id_display || '#0000'}
          </Text>
        </GlassCard>
        <Text style={[styles.uidHint, { color: colors.textTertiary }]}>
          Your unique ID - Share this to add friends
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Display name"
            placeholderTextColor={colors.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={50}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            {!canChangeUsername && nextChangeDate && (
              <Text style={[styles.cooldownBadge, { color: colors.warning || '#F59E0B' }]}>
                Can change after {nextChangeDate}
              </Text>
            )}
          </View>
          <View style={styles.usernameRow}>
            <TextInput
              style={[
                styles.input,
                styles.usernameInput,
                {
                  backgroundColor: canChangeUsername ? colors.input : colors.surfaceHover,
                  borderColor: colors.border,
                  color: canChangeUsername ? colors.text : colors.textSecondary,
                },
              ]}
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              editable={canChangeUsername}
              placeholder="Username"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {canChangeUsername && username !== user?.username && username.length >= 3 && (
              <TouchableOpacity
                style={[styles.changeButton, { backgroundColor: colors.primary }]}
                onPress={handleChangeUsername}
                disabled={isChangingUsername}
              >
                {isChangingUsername ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.changeButtonText}>Change</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {canChangeUsername
              ? 'Username can be changed every 14 days. Letters, numbers, and underscores only.'
              : `You changed your username recently. Next change available on ${nextChangeDate}.`}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.textTertiary}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>{bio.length}/500</Text>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.footer}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  uidBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  uidText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  uidHint: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  form: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cooldownBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  usernameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  usernameInput: {
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  hint: {
    fontSize: 12,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  footer: {
    padding: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
