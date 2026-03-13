/**
 * Channel thread bottom sheet for viewing and replying to message threads.
 * @module screens/groups/channel-thread-sheet
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { safeFormatTime } from '../../lib/dateUtils';
import type { Message } from '../../types';

interface ChannelThreadSheetProps {
  visible: boolean;
  parentMessage: Message | null;
  groupId: string;
  channelId: string;
  onClose: () => void;
}

/**
 * Thread sheet component that displays threaded replies to a channel message.
 */
export default function ChannelThreadSheet({
  visible,
  parentMessage,
  _groupId,
  channelId,
  onClose,
}: ChannelThreadSheetProps) {
  const { colors } = useThemeStore();
  const [replies, setReplies] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && parentMessage) {
      fetchReplies();
    }
    return () => {
      setReplies([]);
      setInputText('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, parentMessage?.id]);

  const fetchReplies = async () => {
    if (!parentMessage) return;
    setIsLoading(true);
    try {
      const response = await api.get(
        `/api/v1/channels/${channelId}/messages/${parentMessage.id}/thread`
      );
      setReplies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching thread replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendReply = async () => {
    const content = inputText.trim();
    if (!content || isSending || !parentMessage) return;

    setIsSending(true);
    setInputText('');

    try {
      const response = await api.post(
        `/api/v1/channels/${channelId}/messages/${parentMessage.id}/thread`,
        { content }
      );
      setReplies((prev) => [...prev, response.data.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      console.error('Error sending thread reply:', error);
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  const renderReply = useCallback(
    ({ item }: { item: Message }) => (
      <View style={styles.replyContainer}>
        <View style={styles.replyHeader}>
          <View style={styles.avatarSmall}>
            {item.sender?.avatar_url ? (
              <Image source={{ uri: item.sender.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {(item.sender?.username || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.senderName, { color: colors.text }]}>
            {item.sender?.display_name || item.sender?.username || 'Unknown'}
          </Text>
          <Text style={[styles.replyTime, { color: colors.textTertiary }]}>
            {safeFormatTime(item.inserted_at)}
          </Text>
        </View>
        <Text style={[styles.replyText, { color: colors.text }]}>{item.content}</Text>
      </View>
    ),
    [colors]
  );

  if (!parentMessage) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Thread</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={44}
        >
          {/* Parent message */}
          <View style={[styles.parentMessage, { borderBottomColor: colors.border }]}>
            <View style={styles.replyHeader}>
              <View style={styles.avatarSmall}>
                {parentMessage.sender?.avatar_url ? (
                  <Image
                    source={{ uri: parentMessage.sender.avatar_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {(parentMessage.sender?.username || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.senderName, { color: colors.text }]}>
                {parentMessage.sender?.display_name || parentMessage.sender?.username || 'Unknown'}
              </Text>
              <Text style={[styles.replyTime, { color: colors.textTertiary }]}>
                {safeFormatTime(parentMessage.inserted_at)}
              </Text>
            </View>
            <Text style={[styles.parentText, { color: colors.text }]}>{parentMessage.content}</Text>
            <Text style={[styles.replyCount, { color: colors.textSecondary }]}>
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </View>

          {/* Replies list */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={replies}
              renderItem={renderReply}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.repliesList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    No replies yet. Start the conversation!
                  </Text>
                </View>
              }
            />
          )}

          {/* Input */}
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderTopColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Reply in thread..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceHover },
              ]}
              onPress={sendReply}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={inputText.trim() ? '#fff' : colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  parentMessage: {
    padding: 16,
    borderBottomWidth: 1,
  },
  parentText: {
    fontSize: 15,
    lineHeight: 20,
    paddingLeft: 44,
    marginTop: 4,
  },
  replyCount: {
    fontSize: 13,
    marginTop: 8,
    paddingLeft: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repliesList: {
    padding: 16,
    paddingBottom: 8,
  },
  replyContainer: {
    marginBottom: 16,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  replyTime: {
    fontSize: 11,
  },
  replyText: {
    fontSize: 15,
    lineHeight: 20,
    paddingLeft: 36,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
