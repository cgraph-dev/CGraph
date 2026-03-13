/**
 * MentionInput — TextInput that detects @ and shows user search modal.
 *
 * When user types `@`, opens a modal/bottom-sheet with a FlatList of
 * matching users. Selecting a user inserts @username at cursor position.
 *
 * @module components/forums/mention-input
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MentionUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface MentionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: object;
  /** Extra TextInput props */
  inputProps?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Mention Input component. */
export default function MentionInput({
  value,
  onChangeText,
  placeholder,
  multiline = true,
  style,
  inputProps,
}: MentionInputProps) {
  const { colors } = useThemeStore();
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search users when mention query changes
  useEffect(() => {
    if (!mentionQuery.trim()) {
      setMentionResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/api/v1/users/search', {
          params: { q: mentionQuery, limit: 10 },
        });
        setMentionResults(res.data?.data || res.data?.users || []);
      } catch {
        setMentionResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mentionQuery]);

  const handleTextChange = useCallback(
    (text: string) => {
      onChangeText(text);

      // Detect @ trigger — find last @ before cursor
      const beforeCursor = text.slice(0, cursorPos + (text.length - value.length));
      const atIndex = beforeCursor.lastIndexOf('@');

      if (atIndex >= 0) {
        const afterAt = beforeCursor.slice(atIndex + 1);
        // If the text after @ has no spaces, treat as mention query
        if (!afterAt.includes(' ') && afterAt.length <= 20) {
          setMentionQuery(afterAt);
          setShowMentions(true);
          return;
        }
      }

      setShowMentions(false);
      setMentionQuery('');
    },
    [value, cursorPos, onChangeText]
  );

  const handleSelectUser = useCallback(
    (user: MentionUser) => {
      // Find the @ position and replace with @username
      const beforeCursor = value.slice(0, cursorPos);
      const atIndex = beforeCursor.lastIndexOf('@');

      if (atIndex >= 0) {
        const before = value.slice(0, atIndex);
        const after = value.slice(cursorPos);
        const newText = `${before}@${user.username} ${after}`;
        onChangeText(newText);
      }

      setShowMentions(false);
      setMentionQuery('');
    },
    [value, cursorPos, onChangeText]
  );

  const renderUserItem = useCallback(
    ({ item }: { item: MentionUser }) => (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: colors.surface }]}
        onPress={() => handleSelectUser(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.userAvatarText}>
            {(item.username || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {item.display_name || item.username}
          </Text>
          <Text style={[styles.userHandle, { color: colors.textSecondary }]} numberOfLines={1}>
            @{item.username}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, handleSelectUser]
  );

  return (
    <View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            color: colors.text,
            borderColor: colors.border,
          },
          style,
        ]}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={(e) => setCursorPos(e.nativeEvent.selection.end)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {...(inputProps as object)}
      />

      {/* Mention suggestions modal */}
      <Modal visible={showMentions} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowMentions(false)}
          />
          <View style={[styles.mentionSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.mentionHeader}>
              <Text style={[styles.mentionTitle, { color: colors.text }]}>Mention a user</Text>
              <TouchableOpacity onPress={() => setShowMentions(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {isSearching ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.searchingIndicator}
              />
            ) : (
              <FlatList
                data={mentionResults}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                style={styles.userList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {mentionQuery ? 'No users found' : 'Type to search users'}
                  </Text>
                }
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mentionSheet: {
    maxHeight: 320,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  mentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#374151',
  },
  mentionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchingIndicator: {
    paddingVertical: 24,
  },
  userList: {
    maxHeight: 240,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
  },
  userHandle: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },
});
