/**
 * Email Notifications Settings Screen
 *
 * Allows users to configure which email notifications they receive.
 * Categories: Account, Social, Content, Marketing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { SettingsStackParamList } from '../../types';
import api from '../../lib/api';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'EmailNotifications'>;

interface NotificationPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface NotificationCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  prefs: NotificationPref[];
}

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    id: 'account',
    title: 'Account',
    icon: 'person-outline',
    color: '#6366f1',
    prefs: [
      {
        id: 'security_alerts',
        label: 'Security Alerts',
        description: 'Login attempts and password changes',
        enabled: true,
      },
      {
        id: 'account_updates',
        label: 'Account Updates',
        description: 'Important account changes',
        enabled: true,
      },
    ],
  },
  {
    id: 'social',
    title: 'Social',
    icon: 'people-outline',
    color: '#10b981',
    prefs: [
      {
        id: 'friend_requests',
        label: 'Friend Requests',
        description: 'New friend requests and acceptances',
        enabled: true,
      },
      {
        id: 'mentions',
        label: 'Mentions',
        description: 'When someone mentions you',
        enabled: true,
      },
      {
        id: 'direct_messages',
        label: 'Direct Messages',
        description: "New DMs when you're offline",
        enabled: false,
      },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    icon: 'newspaper-outline',
    color: '#f59e0b',
    prefs: [
      {
        id: 'post_replies',
        label: 'Post Replies',
        description: 'Replies to your posts',
        enabled: true,
      },
      {
        id: 'thread_updates',
        label: 'Thread Updates',
        description: 'Updates to threads you follow',
        enabled: false,
      },
      {
        id: 'forum_announcements',
        label: 'Forum Announcements',
        description: 'Important forum announcements',
        enabled: true,
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing',
    icon: 'megaphone-outline',
    color: '#ec4899',
    prefs: [
      {
        id: 'product_updates',
        label: 'Product Updates',
        description: 'New features and improvements',
        enabled: false,
      },
      {
        id: 'newsletters',
        label: 'Newsletters',
        description: 'Monthly community newsletter',
        enabled: false,
      },
      {
        id: 'promotions',
        label: 'Promotions',
        description: 'Special offers and promotions',
        enabled: false,
      },
    ],
  },
];

export default function EmailNotificationsScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<NotificationCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/users/me/notification-preferences');
      const prefs = res.data?.data ?? res.data;
      if (prefs && typeof prefs === 'object') {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            prefs: cat.prefs.map((p) => ({
              ...p,
              enabled: prefs[p.id] !== undefined ? prefs[p.id] : p.enabled,
            })),
          }))
        );
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const togglePref = async (categoryId: string, prefId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          prefs: cat.prefs.map((p) => (p.id === prefId ? { ...p, enabled: !p.enabled } : p)),
        };
      })
    );

    try {
      const pref = categories.find((c) => c.id === categoryId)?.prefs.find((p) => p.id === prefId);
      await api.patch('/api/v1/users/me/notification-preferences', {
        [prefId]: !pref?.enabled,
      });
    } catch {
      // Revert on error
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            prefs: cat.prefs.map((p) => (p.id === prefId ? { ...p, enabled: !p.enabled } : p)),
          };
        })
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Email Notifications</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Choose what emails you receive
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={categories.map((cat) => ({
            ...cat,
            data: cat.prefs,
          }))}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          renderSectionHeader={({ section }) => (
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: section.color + '20' }]}>
                  <Ionicons name={section.icon} size={18} color={section.color} />
                </View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{section.title}</Text>
              </View>
            </View>
          )}
          renderItem={({ item: pref, index, section }) => (
            <View
              style={[
                styles.prefRow,
                index === 0 && { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
                index === section.prefs.length - 1 && { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
                { backgroundColor: colors.surface },
                index < section.prefs.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.prefContent}>
                <Text style={[styles.prefLabel, { color: colors.text }]}>{pref.label}</Text>
                <Text style={[styles.prefDescription, { color: colors.textSecondary }]}>
                  {pref.description}
                </Text>
              </View>
              <Switch
                value={pref.enabled}
                onValueChange={() => togglePref(section.id, pref.id)}
                trackColor={{ false: colors.border, true: section.color + '60' }}
                thumbColor={pref.enabled ? section.color : '#f4f3f4'}
              />
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.unsubscribeButton]}
              onPress={() => {
                setCategories((prev) =>
                  prev.map((cat) => ({
                    ...cat,
                    prefs: cat.prefs.map((p) => ({ ...p, enabled: false })),
                  }))
                );
                api
                  .patch('/api/v1/users/me/notification-preferences', {
                    unsubscribe_all: true,
                  })
                  .catch(() => {});
              }}
            >
              <Text style={styles.unsubscribeText}>Unsubscribe from all emails</Text>
            </TouchableOpacity>
          }
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  categorySection: { marginBottom: 20 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  prefsCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prefContent: { flex: 1 },
  prefLabel: { fontSize: 14, fontWeight: '500' },
  prefDescription: { fontSize: 12, marginTop: 2 },
  unsubscribeButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  unsubscribeText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
});
