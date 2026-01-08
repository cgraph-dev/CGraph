/**
 * Report Screen for Mobile
 * 
 * Full-screen modal for reporting content/users.
 * Follows iOS/Android design patterns.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

// Report categories
const REPORT_CATEGORIES = [
  { value: 'harassment', label: 'Harassment', icon: 'person-remove' },
  { value: 'hate_speech', label: 'Hate Speech', icon: 'warning' },
  { value: 'violence_threat', label: 'Violence or Threats', icon: 'alert-circle' },
  { value: 'spam', label: 'Spam', icon: 'mail' },
  { value: 'scam', label: 'Scam or Fraud', icon: 'card' },
  { value: 'impersonation', label: 'Impersonation', icon: 'people' },
  { value: 'nsfw_unlabeled', label: 'Adult Content', icon: 'eye-off' },
  { value: 'doxxing', label: 'Doxxing', icon: 'lock-open' },
  { value: 'self_harm', label: 'Self-Harm', icon: 'heart-dislike' },
  { value: 'copyright', label: 'Copyright', icon: 'document-text' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
] as const;

type ReportCategory = typeof REPORT_CATEGORIES[number]['value'];
type TargetType = 'user' | 'message' | 'group' | 'forum' | 'post' | 'comment';

type ReportRouteParams = {
  Report: {
    targetType: TargetType;
    targetId: string;
    targetName?: string;
  };
};

export function ReportScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ReportRouteParams, 'Report'>>();
  const { theme, colors } = useTheme();
  
  const { targetType, targetId, targetName } = route.params;

  const [step, setStep] = useState<'category' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: async (payload: {
      report: {
        target_type: TargetType;
        target_id: string;
        category: ReportCategory;
        description?: string;
      };
    }) => {
      const response = await api.post('/v1/reports', payload);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep CGraph safe. Our moderation team will review this report.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to submit report. Please try again.';
      Alert.alert('Error', message);
    },
  });

  const handleSubmit = () => {
    if (!selectedCategory) return;

    reportMutation.mutate({
      report: {
        target_type: targetType,
        target_id: targetId,
        category: selectedCategory,
        description: description.trim() || undefined,
      },
    });
  };

  const styles = createStyles(colors);
  const targetLabel = targetName || `this ${targetType}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {step === 'category' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Why are you reporting {targetLabel}?
              </Text>
              <Text style={styles.sectionDescription}>
                Select the reason that best describes the issue
              </Text>
            </View>

            <View style={styles.categoryList}>
              {REPORT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.value && styles.categoryItemSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.value)}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={selectedCategory === category.value ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === category.value && styles.categoryLabelSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                  <Ionicons
                    name={selectedCategory === category.value ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color={selectedCategory === category.value ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, !selectedCategory && styles.buttonDisabled]}
              onPress={() => setStep('details')}
              disabled={!selectedCategory}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'details' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Provide Details</Text>
              <Text style={styles.sectionDescription}>
                Help our team understand what happened
              </Text>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={styles.warningText}>
                Do not include personal information about yourself.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.categoryValue}>
                {REPORT_CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Additional Details (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what happened..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={2000}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{description.length}/2000</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('category')}
                disabled={reportMutation.isPending}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={reportMutation.isPending}
              >
                {reportMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    headerSpacer: {
      width: 32,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    categoryList: {
      marginBottom: 24,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 8,
    },
    categoryItemSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    categoryLabel: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    categoryLabelSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warningLight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      gap: 8,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      color: colors.warning,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    categoryValue: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    textInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    backButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    backButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    submitButton: {
      flex: 2,
      backgroundColor: '#EF4444',
    },
  });
}

export default ReportScreen;
