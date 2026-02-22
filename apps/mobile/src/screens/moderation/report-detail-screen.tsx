/**
 * ReportDetailScreen - Detailed view of a single moderation report
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/theme-context';
import api from '../../lib/api';

interface ReportDetailParams {
  reportId: string;
  reporterUsername: string;
  targetUsername: string;
  reason: string;
  description: string;
  contentPreview: string;
  createdAt: string;
}

export default function ReportDetailScreen({ route, navigation }: any) {
  const params: ReportDetailParams = route?.params ?? {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleAction = (action: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} @${params.targetUsername}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'ban' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.post(`/api/admin/reports/${params.reportId}/review`, {
                action,
                resolution: action,
              });
            } catch {
              Alert.alert('Error', `Failed to ${action} the report.`);
            }
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Report Details
        </Text>
      </View>

      {/* Reporter & Target */}
      <Animated.View
        style={[styles.section, { backgroundColor: colors.surface }]}
        entering={FadeIn.duration(250)}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Involved Users
        </Text>
        <View style={styles.userRow}>
          <View style={styles.userInfo}>
            <Ionicons name="person" size={18} color="#3b82f6" />
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Reporter</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                @{params.reporterUsername || 'unknown'}
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
          <View style={styles.userInfo}>
            <Ionicons name="person" size={18} color="#ef4444" />
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Reported</Text>
              <Text style={[styles.value, { color: '#ef4444' }]}>
                @{params.targetUsername || 'unknown'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Reason & Description */}
      <Animated.View
        style={[styles.section, { backgroundColor: colors.surface }]}
        entering={FadeIn.delay(100).duration(250)}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reason</Text>
        <View style={[styles.reasonBadge, { backgroundColor: '#ef444420' }]}>
          <Text style={styles.reasonText}>{params.reason || 'N/A'}</Text>
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {params.description || 'No description provided.'}
        </Text>
      </Animated.View>

      {/* Content Preview */}
      <Animated.View
        style={[styles.section, { backgroundColor: colors.surface }]}
        entering={FadeIn.delay(200).duration(250)}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Reported Content
        </Text>
        <View style={[styles.previewBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.previewText, { color: colors.textSecondary }]}>
            "{params.contentPreview || 'Content unavailable'}"
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View
        style={styles.actionsSection}
        entering={FadeIn.delay(300).duration(250)}
      >
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#374151' }]}
          onPress={() => handleAction('dismiss')}
        >
          <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.dismissBtnText}>Dismiss Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction('warn')}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="warning" size={18} color="#fff" />
            <Text style={styles.gradientBtnText}>Warn User</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction('mute')}
        >
          <LinearGradient
            colors={['#f97316', '#ea580c']}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="volume-mute" size={18} color="#fff" />
            <Text style={styles.gradientBtnText}>Mute User</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction('ban')}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="ban" size={18} color="#fff" />
            <Text style={styles.gradientBtnText}>Ban User</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 11,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewBox: {
    borderRadius: 10,
    padding: 12,
  },
  previewText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  actionsSection: {
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dismissBtnText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  gradientBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
