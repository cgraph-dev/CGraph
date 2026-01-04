import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { normalizeMessage, normalizeMessages } from '../../lib/normalizers';
import { MessagesStackParamList, Message, Conversation, ConversationParticipant } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'Conversation'>;
  route: RouteProp<MessagesStackParamList, 'Conversation'>;
};

export default function ConversationScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [_conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Subscribe to presence changes
  useEffect(() => {
    if (!conversationId || !otherParticipantId) return;
    
    // Initial check
    setIsOtherUserOnline(socketManager.isUserOnline(conversationId, otherParticipantId));
    
    // Subscribe to status changes
    const unsubscribe = socketManager.onStatusChange((convId, participantId, isOnline) => {
      if (convId === conversationId && participantId === otherParticipantId) {
        setIsOtherUserOnline(isOnline);
      }
    });
    
    return () => unsubscribe();
  }, [conversationId, otherParticipantId]);
  
  // Track if component is still mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track cleanup function to prevent memory leaks
  const cleanupRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    isMountedRef.current = true;
    const channelTopic = `conversation:${conversationId}`;
    
    // Async initialization function
    const initializeConversation = async () => {
      // Ensure socket is connected before joining channel
      await socketManager.connect();
      
      // Only proceed if still mounted
      if (!isMountedRef.current) return;
      
      // Join channel (socket manager handles deduplication internally)
      // Channel stays alive even when component unmounts - this prevents join/leave churn
      socketManager.joinChannel(channelTopic);
      
      // Subscribe to message events via listener pattern
      // This is safe to call multiple times - each call returns a unique unsubscribe function
      const unsubscribe = socketManager.onChannelMessage(channelTopic, (event, payload) => {
        if (!isMountedRef.current) return;
        
        const data = payload as { message: Record<string, unknown> };
        const normalized = normalizeMessage(data.message);
        
        if (event === 'new_message') {
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some(m => m.id === normalized.id)) return prev;
            return [...prev, normalized];
          });
        } else if (event === 'message_updated') {
          setMessages((prev) =>
            prev.map((m) => (m.id === normalized.id ? normalized : m))
          );
        } else if (event === 'message_deleted') {
          setMessages((prev) => prev.filter((m) => m.id !== normalized.id));
        }
      });
      
      // Store cleanup function
      cleanupRef.current = unsubscribe;
    };
    
    fetchConversation();
    fetchMessages();
    initializeConversation();
    
    return () => {
      // Mark as unmounted immediately
      isMountedRef.current = false;
      
      // Unsubscribe from message events - but DO NOT leave the channel
      // The channel stays alive to prevent join/leave churn
      // It will be cleaned up on logout or app termination
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      // NOTE: We intentionally do NOT call leaveChannel here
      // The channel remains active to maintain presence and avoid server churn
    };
  }, [conversationId]);
  
  const fetchConversation = async () => {
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}`);
      const conv = response.data.data || response.data;
      setConversation(conv);
      
      // Find other participant - handle both camelCase and snake_case formats
      // Participants can be nested (with user object) or flat (direct user data)
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const participantUserId = p.userId || p.user_id || p.user?.id || p.id;
        return participantUserId !== user?.id;
      });
      
      // Store other participant's user ID for presence tracking
      const otherUserId = otherParticipant?.userId || otherParticipant?.user_id || otherParticipant?.user?.id || otherParticipant?.id;
      if (otherUserId) {
        setOtherParticipantId(otherUserId);
      }
      
      // Extract display name with fallbacks for both nested and flat formats
      const displayName = 
        conv.name ||
        otherParticipant?.nickname ||
        otherParticipant?.user?.display_name ||
        otherParticipant?.display_name ||
        otherParticipant?.displayName ||
        otherParticipant?.user?.username ||
        otherParticipant?.username ||
        'Conversation';
      
      updateHeader(displayName);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };
  
  // Update header with current online status
  const updateHeader = useCallback((displayName: string) => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{displayName}</Text>
          <View style={styles.headerStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOtherUserOnline ? '#22c55e' : '#6b7280' }]} />
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {isOtherUserOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.e2eeIndicator}>
          <Ionicons name="lock-closed" size={14} color="#22c55e" />
          <Text style={styles.e2eeText}>E2EE</Text>
        </View>
      ),
    });
  }, [colors, isOtherUserOnline, navigation]);
  
  // Update header when online status changes
  useEffect(() => {
    if (_conversation) {
      const conv = _conversation;
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const participantUserId = p.userId || p.user_id || p.user?.id || p.id;
        return participantUserId !== user?.id;
      });
      
      // Extract display name with comprehensive fallbacks for nested/flat structures
      const displayName = 
        conv.name ||
        otherParticipant?.nickname ||
        otherParticipant?.user?.display_name ||
        otherParticipant?.display_name ||
        otherParticipant?.displayName ||
        otherParticipant?.user?.username ||
        otherParticipant?.username ||
        'Conversation';
      
      updateHeader(displayName);
    }
  }, [isOtherUserOnline, _conversation, updateHeader, user?.id]);
  
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}/messages`);
      const rawMessages = response.data.data || response.data.messages || [];
      if (isMountedRef.current) {
        setMessages(normalizeMessages(rawMessages));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;
    
    setIsSending(true);
    setInputText('');
    
    try {
      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
        content,
      });
      const rawMessage = response.data.data || response.data.message || response.data;
      const normalized = normalizeMessage(rawMessage);
      setMessages((prev) => [...prev, normalized]);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    // Handle both snake_case and camelCase sender_id formats
    // Also check sender.id as fallback
    const messageSenderId = item.sender_id || (item as any).senderId || item.sender?.id;
    const isOwnMessage = String(messageSenderId) === String(user?.id);
    
    // Debug logging (remove after confirming fix)
    if (__DEV__ && messages.length > 0 && item.id === messages[messages.length - 1]?.id) {
      console.log('[ConversationScreen] Message sender check:', {
        messageSenderId,
        userId: user?.id,
        isOwnMessage,
        senderIdType: typeof messageSenderId,
        userIdType: typeof user?.id,
        rawSenderId: item.sender_id,
        rawCamelSenderId: (item as any).senderId,
        senderObjectId: item.sender?.id
      });
    }
    
    // Get sender display name with fallbacks
    const senderDisplayName = item.sender?.display_name || (item.sender as any)?.displayName || item.sender?.username || 'User';
    const senderAvatarUrl = item.sender?.avatar_url || (item.sender as any)?.avatarUrl;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <View style={styles.avatarSmall}>
            {senderAvatarUrl ? (
              <Image source={{ uri: senderAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {senderDisplayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface },
          ]}
        >
          {/* Image messages */}
          {item.type === 'image' && item.metadata?.url && (
            <TouchableOpacity activeOpacity={0.9}>
              <Image
                source={{ uri: item.metadata.url }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          {/* File messages */}
          {item.type === 'file' && item.metadata?.url && (
            <View style={[styles.fileAttachment, { backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.1)' : colors.input }]}>
              <Ionicons name="document-outline" size={20} color={isOwnMessage ? '#fff' : colors.textSecondary} />
              <Text style={{ color: isOwnMessage ? '#fff' : colors.text, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                {item.metadata.filename || 'File'}
              </Text>
            </View>
          )}
          {/* Text content */}
          {item.content && (
            <Text
              style={[
                styles.messageText,
                { color: isOwnMessage ? '#fff' : colors.text },
              ]}
            >
              {item.content}
            </Text>
          )}
          <Text
            style={[
              styles.messageTime,
              { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
            ]}
          >
            {formatTime(item.inserted_at)}
            {item.is_edited && ' • edited'}
          </Text>
        </View>
      </View>
    );
  }, [user?.id, colors]);
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  const EmptyConversation = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start the conversation by sending a message below
      </Text>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        inverted={false}
        ListEmptyComponent={EmptyConversation}
      />
      
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
          placeholder="Message..."
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={4000}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceHover }]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : colors.textTertiary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 16,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  e2eeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  e2eeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
