/**
 * ReportContentScreen - Submit a report for a group message or user
 * @module screens/groups
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'ReportContent'>;
  route: RouteProp<GroupsStackParamList, 'ReportContent'>;
};

const REPORT_CATEGORIES = [
  { key: 'harassment', label: 'Harassment', icon: 'hand-left-outline' },
  { key: 'spam', label: 'Spam', icon: 'megaphone-outline' },
  { key: 'inappropriate_content', label: 'Inappropriate Content', icon: 'alert-circle-outline' },
  { key: 'misinformation', label: 'Misinformation', icon: 'information-circle-outline' },
  { key: 'threats', label: 'Threats', icon: 'warning-outline' },
  { key: 'hate_speech', label: 'Hate Speech', icon: 'flame-outline' },
  { key: 'violence', label: 'Violence', icon: 'skull-outline' },
  { key: 'self_harm', label: 'Self-harm', icon: 'heart-dislike-outline' },
  { key: 'illegal_activity', label: 'Illegal Activity', icon: 'ban-outline' },
  { key: 'impersonation', label: 'Impersonation', icon: 'people-outline' },
  { key: 'copyright', label: 'Copyright Violation', icon: 'document-lock-outline' },
  { key: 'underage', label: 'Underage User', icon: 'person-remove-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

/**
 * Report content screen with category selection and optional description.
 */
export default function ReportContentScreen({ navigation, route }: Props) {
  const { targetType, targetId, groupId, targetPreview } = route.params;
  const { colors } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a report category');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/v1/reports', {
        target_type: targetType,
        target_id: targetId,
        category: selectedCategory,
        description: description.trim() || undefined,
      });
      Alert.alert('Report Submitted', 'Thank you for reporting. Our moderators will review this.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Target Preview */}
        {targetPreview && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.previewText, { color: colors.textSecondary }]} numberOfLines={3}>
                {targetPreview}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Category Selection */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>What is the issue?</Text>

        <View style={styles.categoriesGrid}>
          {REPORT_CATEGORIES.map((cat, index) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Animated.View key={cat.key} entering={FadeInDown.springify().delay(index * 30)}>
                <TouchableOpacity
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Ionicons
                     
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Description */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Additional details (optional)
        </Text>
        <TextInput
          style={[
            styles.descriptionInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Provide more context about this report..."
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={[styles.charCount, { color: colors.textTertiary }]}>
          {description.length}/1000
        </Text>
      </ScrollView>

      {/* Submit Button */}
      <View
        style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: selectedCategory ? colors.error : colors.textTertiary,
              opacity: submitting ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitting || !selectedCategory}
        >
          {submitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="flag-outline" size={18} color="white" />
              <Text style={styles.submitText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewText: { flex: 1, fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryLabel: { fontSize: 13, fontWeight: '500' },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
