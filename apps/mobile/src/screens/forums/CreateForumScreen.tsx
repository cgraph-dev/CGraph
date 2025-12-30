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
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { ForumsStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'CreateForum'>;
};

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
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      Alert.alert('Invalid Name', 'Forum name must be 3-21 characters, containing only letters, numbers, and underscores.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/v1/forums', {
        name,
        description: description.trim() || undefined,
        is_nsfw: isNsfw,
        is_private: !isPublic,
      });
      
      const forum = response.data?.forum || response.data;
      
      Alert.alert(
        'Forum Created!',
        `Your forum "${name}" has been created successfully.`,
        [
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
        ]
      );
    } catch (error: any) {
      console.error('[CreateForumScreen] Error:', error);
      
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
        <Text style={styles.headerSubtitle}>
          Build your own MyBB-style community
        </Text>
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
              <Text style={[
                styles.charCount, 
                { color: !isValidName && name.length > 0 ? colors.error : colors.textTertiary }
              ]}>
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
          
          {/* Settings */}
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
            
            {/* Public Toggle */}
            <View style={[styles.settingRow, { borderColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons 
                  name={isPublic ? "globe-outline" : "lock-closed-outline"} 
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
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    NSFW Content
                  </Text>
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
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
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
              style={[
                styles.submitButtonText,
                { color: canSubmit ? '#fff' : colors.textTertiary },
              ]}
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
});
