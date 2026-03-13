/**
 * Paid DM Settings Screen
 *
 * Allows creators to configure paid DM pricing, accepted file types,
 * and auto-accept rules for friends.
 *
 * @module screens/paid-dm/paid-dm-settings-screen
 * @since v1.0.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';

interface PaidDmSettings {
  enabled: boolean;
  priceNodes: number;
  acceptedFileTypes: string[];
  autoAcceptFriends: boolean;
}

const FILE_TYPES = ['image', 'video', 'audio', 'document'] as const;

/** Paid Dm Settings Screen component. */
export default function PaidDmSettingsScreen(): React.ReactElement {
  const { colors } = useThemeStore();
  const [settings, setSettings] = useState<PaidDmSettings>({
    enabled: false,
    priceNodes: 10,
    acceptedFileTypes: [],
    autoAcceptFriends: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/paid-dm/settings');
      const data = response.data?.data;
      if (data) {
        setSettings({
          enabled: data.enabled ?? false,
          priceNodes: data.priceNodes ?? 10,
          acceptedFileTypes: data.acceptedFileTypes ?? [],
          autoAcceptFriends: data.autoAcceptFriends ?? false,
        });
      }
    } catch {
      // Use defaults if no settings exist yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (settings.enabled && settings.priceNodes < 10) {
      Alert.alert('Invalid Price', 'Minimum price is 10 nodes.');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/api/v1/paid-dm/settings', settings);
      Alert.alert('Saved', 'Paid DM settings updated.');
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFileType = (type: string) => {
    setSettings((prev) => {
      const types = prev.acceptedFileTypes.includes(type)
        ? prev.acceptedFileTypes.filter((t) => t !== type)
        : [...prev.acceptedFileTypes, type];
      return { ...prev, acceptedFileTypes: types };
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Enable / Disable */}
      <View style={[styles.row, { borderColor: colors.border }]}>
        <View style={styles.rowText}>
          <Text style={[styles.label, { color: colors.text }]}>Enable Paid DMs</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Charge nodes for incoming DMs from non-friends
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {/* Price */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Price (nodes)</Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
          ]}
          keyboardType="number-pad"
          value={String(settings.priceNodes)}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n)) setSettings((s) => ({ ...s, priceNodes: n }));
          }}
          placeholder="10"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Minimum 10 nodes</Text>
      </View>

      {/* File Types */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Accepted File Types</Text>
        <View style={styles.chipRow}>
          {FILE_TYPES.map((type) => {
            const active = settings.acceptedFileTypes.includes(type);
            return (
              <Pressable
                key={type}
                onPress={() => toggleFileType(type)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Auto-accept friends */}
      <View style={[styles.row, { borderColor: colors.border }]}>
        <View style={styles.rowText}>
          <Text style={[styles.label, { color: colors.text }]}>Auto-Accept Friends</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Friends can DM you for free without approval
          </Text>
        </View>
        <Switch
          value={settings.autoAcceptFriends}
          onValueChange={(v) => setSettings((s) => ({ ...s, autoAcceptFriends: v }))}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {/* Save */}
      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save Settings'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, marginRight: 12 },
  section: { paddingVertical: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  hint: { fontSize: 13, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  saveButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
