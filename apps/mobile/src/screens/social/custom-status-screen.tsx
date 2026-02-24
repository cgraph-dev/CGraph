/**
 * CustomStatusScreen - Set/edit custom status on mobile
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '@/stores';
import { api } from '../../services/api';

const STATUS_PRESETS = [
  { emoji: '🟢', text: 'Available' },
  { emoji: '🔴', text: 'Busy' },
  { emoji: '🌙', text: 'Away' },
  { emoji: '🎮', text: 'Gaming' },
  { emoji: '💻', text: 'Working' },
  { emoji: '📚', text: 'Studying' },
  { emoji: '🎵', text: 'Listening to music' },
  { emoji: '😴', text: 'Sleeping' },
];

const QUICK_EMOJIS = [
  '😊', '😎', '🤔', '😢', '🎉', '🔥', '💪', '🎮',
  '💻', '📚', '🎵', '☕', '🌙', '✨', '💜', '🚀',
];

export default function CustomStatusScreen({ navigation }: { navigation: any }) {
  const { colors } = useThemeStore();
  const [statusText, setStatusText] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const customStatus = emoji ? `${emoji} ${statusText}` : statusText;
      await api.put('/api/v1/me', {
        custom_status: customStatus,
        status_message: statusText,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await api.put('/api/v1/me', {
        custom_status: null,
        status_message: null,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to clear status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YOUR STATUS</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.emojiButton, { backgroundColor: colors.background }]}>
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="What's happening?"
            placeholderTextColor={colors.textSecondary}
            value={statusText}
            onChangeText={setStatusText}
            maxLength={128}
            autoFocus
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>EMOJI</Text>
        <View style={[styles.emojiGrid, { backgroundColor: colors.card }]}>
          {QUICK_EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => setEmoji(e)}
              style={[
                styles.emojiOption,
                emoji === e && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
              ]}
            >
              <Text style={styles.emojiOptionText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.springify().delay(150)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK PRESETS</Text>
        {STATUS_PRESETS.map((preset, index) => (
          <TouchableOpacity
            key={preset.text}
            onPress={() => {
              setEmoji(preset.emoji);
              setStatusText(preset.text);
            }}
            style={[
              styles.presetRow,
              { backgroundColor: colors.card, borderColor: colors.border },
              index === 0 && styles.presetFirst,
              index === STATUS_PRESETS.length - 1 && styles.presetLast,
              statusText === preset.text && emoji === preset.emoji && {
                backgroundColor: colors.primary + '15',
              },
            ]}
          >
            <Text style={styles.presetEmoji}>{preset.emoji}</Text>
            <Text style={[styles.presetText, { color: colors.text }]}>{preset.text}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.actions}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Status'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClear}
          style={[styles.clearButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.clearText, { color: colors.textSecondary }]}>Clear Status</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  emojiOption: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emojiOptionText: {
    fontSize: 20,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  presetFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  presetLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 1,
  },
  presetEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  presetText: {
    fontSize: 15,
  },
  actions: {
    gap: 12,
    marginBottom: 40,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  clearText: {
    fontSize: 15,
  },
});
