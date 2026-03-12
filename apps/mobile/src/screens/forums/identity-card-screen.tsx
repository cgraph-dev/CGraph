/**
 * IdentityCardScreen — full editor for identity card settings.
 *
 * Allows users to pick frame, badges, title, and bio for their
 * forum identity card (nameplate snapshot).
 *
 * @module screens/forums/identity-card-screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useThemeStore, useAuthStore } from '@/stores';
import api from '../../lib/api';
import IdentityCard from '../../components/forums/identity-card';
import type { NameplateSnapshot } from '../../components/forums/identity-card';
import { ForumsStackParamList } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'IdentityCard'>;
};

interface Frame {
  id: string;
  name: string;
  color: string;
  border_width?: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  equipped?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FRAMES: Frame[] = [
  { id: 'none', name: 'None', color: 'transparent' },
  { id: 'gold', name: 'Gold', color: '#F59E0B', border_width: 3 },
  { id: 'silver', name: 'Silver', color: '#9CA3AF', border_width: 2 },
  { id: 'ruby', name: 'Ruby', color: '#EF4444', border_width: 3 },
  { id: 'emerald', name: 'Emerald', color: '#10B981', border_width: 3 },
  { id: 'sapphire', name: 'Sapphire', color: '#3B82F6', border_width: 3 },
  { id: 'amethyst', name: 'Amethyst', color: '#8B5CF6', border_width: 3 },
  { id: 'rainbow', name: 'Rainbow', color: '#EC4899', border_width: 4 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IdentityCardScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [equippedBadgeIds, setEquippedBadgeIds] = useState<string[]>([]);

  useEffect(() => {
    navigation.setOptions({ title: 'Identity Card' });
    loadIdentityData();
  }, []);

  const loadIdentityData = async () => {
    try {
      const [cardRes, badgesRes] = await Promise.all([
        api.get('/api/v1/users/me/identity-card').catch(() => ({ data: { data: null } })),
        api.get('/api/v1/users/me/badges').catch(() => ({ data: { data: [] } })),
      ]);

      const card = cardRes.data?.data;
      if (card) {
        setSelectedFrame(card.frame || null);
        setTitle(card.title || '');
        setBio(card.bio || '');
        setEquippedBadgeIds(
          (card.badges || []).map((b: Badge) => b.id),
        );
      }

      setAvailableBadges(badgesRes.data?.data || []);
    } catch (err) {
      console.error('[IdentityCardScreen] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/api/v1/users/me/identity-card', {
        frame_id: selectedFrame?.id === 'none' ? null : selectedFrame?.id,
        title: title.trim() || null,
        bio: bio.trim() || null,
        badge_ids: equippedBadgeIds,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your identity card has been updated.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save identity card.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBadge = (badgeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEquippedBadgeIds((prev) => {
      if (prev.includes(badgeId)) {
        return prev.filter((id) => id !== badgeId);
      }
      if (prev.length >= 3) {
        Alert.alert('Max Badges', 'You can only equip up to 3 badges.');
        return prev;
      }
      return [...prev, badgeId];
    });
  };

  // Build preview snapshot
  const previewSnapshot: NameplateSnapshot = {
    user_id: user?.id || '',
    username: user?.username || 'You',
    display_name: user?.display_name || user?.username || 'You',
    avatar_url: user?.avatar_url || undefined,
    frame: selectedFrame?.id !== 'none' ? selectedFrame : null,
    badges: availableBadges.filter((b) => equippedBadgeIds.includes(b.id)),
    title: title || null,
    reputation: (user as Record<string, unknown>)?.karma as number | undefined,
    bio: bio || undefined,
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
          <View style={styles.previewCard}>
            <IdentityCard snapshot={previewSnapshot} compact={false} />
          </View>
        </View>

        {/* Frame Picker */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Avatar Frame</Text>
          <View style={styles.frameGrid}>
            {DEFAULT_FRAMES.map((frame) => {
              const isActive = selectedFrame?.id === frame.id;
              return (
                <TouchableOpacity
                  key={frame.id}
                  style={[
                    styles.frameOption,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary + '15' : colors.background,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFrame(frame);
                  }}
                >
                  <View
                    style={[
                      styles.frameSwatch,
                      {
                        borderColor: frame.color,
                        borderWidth: frame.id === 'none' ? 1 : frame.border_width || 2,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.frameLabel,
                      { color: isActive ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {frame.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Badges */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Badges ({equippedBadgeIds.length}/3)
          </Text>
          {availableBadges.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No badges earned yet. Participate in forums to earn badges!
            </Text>
          ) : (
            <View style={styles.badgeGrid}>
              {availableBadges.map((badge) => {
                const isEquipped = equippedBadgeIds.includes(badge.id);
                return (
                  <TouchableOpacity
                    key={badge.id}
                    style={[
                      styles.badgeOption,
                      {
                        borderColor: isEquipped ? badge.color : colors.border,
                        backgroundColor: isEquipped ? badge.color + '15' : colors.background,
                      },
                    ]}
                    onPress={() => toggleBadge(badge.id)}
                  >
                    <Ionicons name="medal" size={20} color={badge.color} />
                    <Text style={[styles.badgeLabel, { color: colors.text }]}>{badge.name}</Text>
                    {isEquipped && (
                      <Ionicons name="checkmark-circle" size={16} color={badge.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, 32))}
            placeholder="e.g. Forum Veteran"
            placeholderTextColor={colors.textTertiary}
            maxLength={32}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {title.length}/32
          </Text>
        </View>

        {/* Bio */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[
              styles.textArea,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 160))}
            placeholder="Tell the community about yourself..."
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            maxLength={160}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {bio.length}/160
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Save button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Identity Card</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  section: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  frameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  frameOption: {
    width: '22%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  frameSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  frameLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeGrid: {
    gap: 8,
  },
  badgeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  badgeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
