/**
 * Screen for creating a new forum.
 * @module screens/forums/create-forum-screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { ForumsStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'CreateForum'>;
};

const FORUM_THEMES = [
  { id: 'default', name: 'Default', color: '#6366F1' },
  { id: 'neon_cyber', name: 'Neon Cyber', color: '#00FFFF' },
  { id: 'royal_gold', name: 'Royal Gold', color: '#FFD700' },
  { id: 'midnight_ocean', name: 'Midnight Ocean', color: '#1E3A5F' },
  { id: 'sakura_blossom', name: 'Sakura Blossom', color: '#FFB7C5' },
  { id: 'lava_flow', name: 'Lava Flow', color: '#FF4500' },
  { id: 'forest_mist', name: 'Forest Mist', color: '#2D6A4F' },
  { id: 'retro_arcade', name: 'Retro Arcade', color: '#FF00FF' },
  { id: 'arctic_frost', name: 'Arctic Frost', color: '#E0F7FA' },
  { id: 'sunset_blaze', name: 'Sunset Blaze', color: '#FF6B35' },
];

/**
 * CreateForumScreen - Mobile version of forum creation
 *
 * Matches the web version's functionality with mobile-native UI.
 *
 * Validation Rules:
 * - Name: 3-21 characters, letters/numbers/underscores only
 * - Description: Optional, max 500 chars
 */
export default function CreateForumScreen({ navigation }: Props) {
  const { colors } = useThemeStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [requireIdentityCard, setRequireIdentityCard] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(false);

  // Name validation - only allow valid characters
  const handleNameChange = (text: string) => {
    const sanitized = text.replace(/[^a-zA-Z0-9_]/g, '');
    setName(sanitized.slice(0, 21));
  };

  // Validation
  const isValidName = name.length >= 3 && name.length <= 21 && /^[a-zA-Z0-9_]+$/.test(name);
  const canSubmit = isValidName && !isSubmitting;

  const handleSubmit = async () => {
    if (!isValidName) {
      Alert.alert(
        'Invalid Name',
        'Forum name must be 3-21 characters, containing only letters, numbers, and underscores.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/v1/forums', {
        name,
        description: description.trim() || undefined,
        is_nsfw: isNsfw,
        is_private: !isPublic,
        theme: selectedTheme,
        settings: {
          require_identity_card: requireIdentityCard,
          allow_anonymous: allowAnonymous,
        },
      });

      const forum = response.data?.forum || response.data;

      Alert.alert('Forum Created!', `Your forum "${name}" has been created successfully.`, [
        {
          text: 'View Forum',
          onPress: () => {
            if (forum?.id) {
              navigation.replace('Forum', { forumId: forum.id });
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (err: unknown) {
      console.error('[CreateForumScreen] Error:', err);

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const error = err as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      let message = 'Failed to create forum. Please try again.';

      const errorData = error.response?.data?.error;

      if (typeof errorData === 'string') {
        message = errorData;
        if (error.response?.data?.message) {
          message += `: ${error.response.data.message}`;
        }
      } else if (errorData?.message) {
        message = errorData.message;

        if (errorData.details && typeof errorData.details === 'object') {
          const detailMessages = Object.entries(errorData.details)
            .map(([field, msgs]) => {
              const fieldName = field.replace(/_/g, ' ');
              const msgArray = Array.isArray(msgs) ? msgs : [String(msgs)];
              return `${fieldName}: ${msgArray.join(', ')}`;
            })
            .join('\n');

          if (detailMessages) {
            message = detailMessages;
          }
        }
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Ionicons name="sparkles" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Create Your Forum</Text>
        <Text style={styles.headerSubtitle}>Build your own MyBB-style community</Text>
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          {/* Forum Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Forum Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: name && !isValidName ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="MyAwesomeForum"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={21}
            />
            <View style={styles.inputHint}>
              <Text style={[styles.hintText, { color: colors.textTertiary }]}>
                3-21 chars. Letters, numbers, underscores only.
              </Text>
              <Text
                style={[
                  styles.charCount,
                  { color: !isValidName && name.length > 0 ? colors.error : colors.textTertiary },
                ]}
              >
                {name.length}/21
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Tell people what your forum is about..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {description.length}/500
            </Text>
          </View>

          {/* Theme Picker */}
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeGrid}>
              {FORUM_THEMES.map((theme) => {
                const isActive = selectedTheme === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeOption,
                      {
                        borderColor: isActive ? theme.color : colors.border,
                        backgroundColor: isActive ? theme.color + '15' : colors.input,
                      },
                    ]}
                    onPress={() => setSelectedTheme(theme.id)}
                  >
                    <View style={[styles.themeSwatch, { backgroundColor: theme.color }]} />
                    <Text
                      style={[
                        styles.themeLabel,
                        { color: isActive ? theme.color : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Identity Card Defaults */}
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity Cards</Text>

            <View style={[styles.settingRow, { borderColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Require Identity Card
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                    Members must set up their identity card
                  </Text>
                </View>
              </View>
              <Switch
                value={requireIdentityCard}
                onValueChange={setRequireIdentityCard}
                trackColor={{ false: colors.surfaceHover, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.settingRow, { borderColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="eye-off-outline" size={24} color={colors.textTertiary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Allow Anonymous Posts
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                    Members can post without showing identity
                  </Text>
                </View>
              </View>
              <Switch
                value={allowAnonymous}
                onValueChange={setAllowAnonymous}
                trackColor={{ false: colors.surfaceHover, true: colors.warning }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy</Text>

            {/* Public Toggle */}
            <View style={[styles.settingRow, { borderColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                  size={24}
                  color={isPublic ? colors.success : colors.warning}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isPublic ? 'Public Forum' : 'Private Forum'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                    {isPublic ? 'Anyone can view and join' : 'Invite-only access'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.surfaceHover, true: colors.success }}
                thumbColor="#fff"
              />
            </View>

            {/* NSFW Toggle */}
            <View style={[styles.settingRow, { borderColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="warning-outline"
                  size={24}
                  color={isNsfw ? colors.error : colors.textTertiary}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>NSFW Content</Text>
                  <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                    Contains adult content
                  </Text>
                </View>
              </View>
              <Switch
                value={isNsfw}
                onValueChange={setIsNsfw}
                trackColor={{ false: colors.surfaceHover, true: colors.error }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: canSubmit ? colors.primary : colors.surfaceHover },
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={[styles.submitButtonText, { color: canSubmit ? '#fff' : colors.textTertiary }]}
            >
              Create Forum
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
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
  inputHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  settingsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeOption: {
    width: '30%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  themeSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
