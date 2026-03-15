/**
 * Appeal Screen for Mobile
 *
 * Allows users to view their active restrictions and submit appeals
 * against moderation decisions. Shows appeal status for pending appeals.
 *
 * @module screens/moderation/appeal-screen
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
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '@/lib/api';
import { useThemeStore } from '@/stores';
import type { ThemeColors } from '@/stores/themeStore';

// ── Types ────────────────────────────────────────────────────────────

interface Restriction {
  id: string;
  type: string;
  reason: string;
  expires_at: string | null;
  active: boolean;
  review_action_id: string;
}

interface Appeal {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// ── Constants ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Appeal['status'], { color: string; icon: string; label: string }> = {
  pending: { color: '#f59e0b', icon: 'time', label: 'Under Review' },
  approved: { color: '#10b981', icon: 'checkmark-circle', label: 'Approved' },
  denied: { color: '#ef4444', icon: 'close-circle', label: 'Denied' },
};

const MIN_APPEAL_REASON_LENGTH = 20;

// ── Main Component ───────────────────────────────────────────────────

/**
 * Appeal screen — shows active restrictions and allows submitting appeals.
 */
export function AppealScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  const styles = createStyles(colors);

  const [selectedRestriction, setSelectedRestriction] = useState<Restriction | null>(null);
  const [appealReason, setAppealReason] = useState('');

  // Fetch active restrictions
  const {
    data: restrictions,
    isLoading: loadingRestrictions,
    refetch: refetchRestrictions,
  } = useQuery({
    queryKey: ['my-restrictions'],
    queryFn: async () => {
      const response = await api.get<{ data: Restriction[] }>('/v1/me/restrictions');
      return response.data.data;
    },
  });

  // Fetch user appeals
  const {
    data: appeals,
    isLoading: loadingAppeals,
    refetch: refetchAppeals,
  } = useQuery({
    queryKey: ['my-appeals'],
    queryFn: async () => {
      const response = await api.get<{ data: Appeal[] }>('/v1/me/appeals');
      return response.data.data;
    },
  });

  // Submit appeal mutation
  const submitAppealMutation = useMutation({
    mutationFn: async ({ actionId, reason }: { actionId: string; reason: string }) => {
      const response = await api.post(`/v1/reports/${actionId}/appeal`, {
        appeal: { reason },
      });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert(
        'Appeal Submitted',
        'Your appeal has been submitted and will be reviewed by a moderator.',
        [{ text: 'OK' }]
      );
      setSelectedRestriction(null);
      setAppealReason('');
      void queryClient.invalidateQueries({ queryKey: ['my-appeals'] });
      void queryClient.invalidateQueries({ queryKey: ['my-restrictions'] });
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message = error.response?.data?.error ?? 'Failed to submit appeal. Please try again.';
      Alert.alert('Error', message);
    },
  });

  const handleSubmitAppeal = () => {
    if (!selectedRestriction) return;
    if (appealReason.length < MIN_APPEAL_REASON_LENGTH) {
      Alert.alert('Too Short', `Please provide at least ${MIN_APPEAL_REASON_LENGTH} characters.`);
      return;
    }
    submitAppealMutation.mutate({
      actionId: selectedRestriction.review_action_id,
      reason: appealReason,
    });
  };

  const isRefreshing = loadingRestrictions || loadingAppeals;

  const handleRefresh = () => {
    void refetchRestrictions();
    void refetchAppeals();
  };

  // Check if a restriction already has a pending appeal
  const hasAppeal = (_restrictionId: string) =>
    appeals?.some((a) => a.status === 'pending') ?? false;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Appeals</Text>
        </View>

        {/* Active Restrictions */}
        <Text style={styles.sectionTitle}>Active Restrictions</Text>

        {loadingRestrictions && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        )}

        {!loadingRestrictions && (!restrictions || restrictions.length === 0) && (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            <Text style={styles.emptyText}>No active restrictions on your account</Text>
          </View>
        )}

        {restrictions?.map((restriction) => (
          <View key={restriction.id} style={styles.restrictionCard}>
            <View style={styles.restrictionHeader}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text style={styles.restrictionType}>
                {restriction.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.restrictionReason}>{restriction.reason}</Text>
            {restriction.expires_at && (
              <Text style={styles.restrictionExpiry}>
                Expires: {new Date(restriction.expires_at).toLocaleDateString()}
              </Text>
            )}
            {!hasAppeal(restriction.id) && (
              <TouchableOpacity
                style={styles.appealButton}
                onPress={() => {
                  setSelectedRestriction(restriction);
                  setAppealReason('');
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                <Text style={styles.appealButtonText}>Appeal This Decision</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Appeal Form */}
        {selectedRestriction && (
          <View style={styles.appealForm}>
            <Text style={styles.sectionTitle}>Submit Appeal</Text>
            <Text style={styles.formLabel}>
              Explain why you believe this restriction should be lifted (minimum{' '}
              {MIN_APPEAL_REASON_LENGTH} characters):
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={5}
              value={appealReason}
              onChangeText={setAppealReason}
              placeholder="Describe why you feel this action was unjust…"
              placeholderTextColor={colors.textSecondary}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>
              {appealReason.length} / 2000
              {appealReason.length < MIN_APPEAL_REASON_LENGTH &&
                ` (${MIN_APPEAL_REASON_LENGTH - appealReason.length} more needed)`}
            </Text>
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSelectedRestriction(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (appealReason.length < MIN_APPEAL_REASON_LENGTH ||
                    submitAppealMutation.isPending) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitAppeal}
                disabled={
                  appealReason.length < MIN_APPEAL_REASON_LENGTH || submitAppealMutation.isPending
                }
              >
                {submitAppealMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Appeal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Previous Appeals */}
        <Text style={styles.sectionTitle}>Your Appeals</Text>

        {loadingAppeals && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        )}

        {!loadingAppeals && (!appeals || appeals.length === 0) && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No appeals submitted</Text>
          </View>
        )}

        {appeals?.map((appeal) => {
          const config = STATUS_CONFIG[appeal.status];
          return (
            <View key={appeal.id} style={styles.appealCard}>
              <View style={styles.appealHeader}>
                { }
                <Ionicons name={config.icon as 'time'} size={18} color={config.color} />
                <Text style={[styles.appealStatus, { color: config.color }]}>{config.label}</Text>
                <Text style={styles.appealDate}>
                  {new Date(appeal.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.appealReason} numberOfLines={3}>
                {appeal.reason}
              </Text>
              {appeal.reviewer_notes && (
                <View style={styles.reviewerNotes}>
                  <Text style={styles.reviewerNotesLabel}>Moderator Response:</Text>
                  <Text style={styles.reviewerNotesText}>{appeal.reviewer_notes}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backButton: { marginRight: 12 },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 20,
      marginBottom: 12,
    },
    loader: { marginVertical: 20 },
    emptyCard: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 12,
      backgroundColor: colors.card,
      gap: 8,
    },
    emptyText: { fontSize: 14, color: colors.textSecondary },
    restrictionCard: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
    },
    restrictionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    restrictionType: { fontSize: 14, fontWeight: '600', color: colors.text },
    restrictionReason: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    restrictionExpiry: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
    appealButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#3b82f6',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    appealButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    appealForm: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginTop: 16,
      borderWidth: 1,
      borderColor: '#3b82f6',
    },
    formLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
    textArea: {
      minHeight: 120,
      borderRadius: 8,
      backgroundColor: colors.background,
      padding: 12,
      color: colors.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    charCount: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
    cancelButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    cancelButtonText: { fontSize: 14, color: colors.textSecondary },
    submitButton: {
      backgroundColor: '#3b82f6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    appealCard: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginBottom: 10,
    },
    appealHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    appealStatus: { fontSize: 13, fontWeight: '600', flex: 1 },
    appealDate: { fontSize: 11, color: colors.textSecondary },
    appealReason: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
    reviewerNotes: {
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.background,
      marginTop: 4,
    },
    reviewerNotesLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
    reviewerNotesText: { fontSize: 13, color: colors.text, marginTop: 2 },
  });
}
