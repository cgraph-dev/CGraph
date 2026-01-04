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
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { deleteAsync } from 'expo-file-system/legacy';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { normalizeMessage, normalizeMessages } from '../../lib/normalizers';
import { MessagesStackParamList, Message, Conversation, ConversationParticipant } from '../../types';
import { VoiceMessageRecorder, VoiceMessagePlayer } from '../../components';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
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
  const cleanupRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    isMountedRef.current = true;
    const channelTopic = `conversation:${conversationId}`;
    
    const initializeConversation = async () => {
      await socketManager.connect();
      if (!isMountedRef.current) return;
      
      // joinChannel has built-in debouncing - safe to call on every mount
      socketManager.joinChannel(channelTopic);
      
      const unsubscribe = socketManager.onChannelMessage(channelTopic, (event, payload) => {
        if (!isMountedRef.current) return;
        
        const data = payload as { message: Record<string, unknown> };
        const normalized = normalizeMessage(data.message);
        
        if (event === 'new_message') {
          setMessages((prev) => {
            // Check for duplicates before adding
            const exists = prev.some(m => m.id === normalized.id);
            if (exists) {
              if (__DEV__) {
                console.log('[ConversationScreen] Skipping duplicate message:', normalized.id);
              }
              return prev;
            }
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
      
      cleanupRef.current = unsubscribe;
    };
    
    fetchMessages();
    initializeConversation();
    
    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // Don't leave channel - socket manager keeps channel alive for session
      // The join debouncing will prevent duplicate joins on remount
    };
  }, [conversationId]);
  
  // Fetch conversation when user is available - separate effect to handle auth loading
  useEffect(() => {
    if (user?.id) {
      fetchConversation();
    }
  }, [conversationId, user?.id]);
  
  const fetchConversation = async () => {
    // Get current user ID from auth context
    const currentUserId = user?.id;
    
    // Debug: log full user object to understand structure
    if (__DEV__) {
      console.log('[ConversationScreen] FULL USER OBJECT:', JSON.stringify(user, null, 2));
    }
    
    if (!currentUserId) {
      if (__DEV__) console.log('[ConversationScreen] Waiting for user to be loaded...');
      return; // Don't proceed without a valid user
    }
    
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}`);
      const conv = response.data.data || response.data;
      setConversation(conv);
      
      // Find other participant - API returns camelCase (userId, user.displayName)
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const participantUserId = p.userId || p.user_id || (p.user as any)?.id || p.id;
        return String(participantUserId) !== String(currentUserId);
      });
      
      // Debug logging
      if (__DEV__) {
        console.log('[ConversationScreen] Participants:', JSON.stringify(conv.participants?.map((p: any) => ({
          participantId: p.id,
          userId: p.userId || p.user_id,
          userObjId: p.user?.id,
          displayName: p.user?.displayName || p.user?.display_name,
          username: p.user?.username
        })), null, 2));
        console.log('[ConversationScreen] Current user ID:', currentUserId);
        console.log('[ConversationScreen] Other participant found:', !!otherParticipant);
      }
      
      // Store other participant's user ID for presence tracking
      // Extract from userId (API camelCase) or user.id (nested object)
      // Explicitly convert to string to ensure consistent comparison with presence data
      const rawOtherUserId = otherParticipant?.userId || otherParticipant?.user_id || (otherParticipant?.user as any)?.id;
      const otherUserId = rawOtherUserId ? String(rawOtherUserId) : null;
      
      if (otherUserId) {
        setOtherParticipantId(otherUserId);
        
        // Use ONLY Phoenix Presence for online status (single source of truth)
        // Database status field is never updated and shows stale data
        const presenceOnline = socketManager.isUserOnline(conversationId, otherUserId);
        
        if (__DEV__) {
          console.log(`[ConversationScreen] Other user ${otherUserId} presence status: ${presenceOnline}`);
        }
        setIsOtherUserOnline(presenceOnline);
      }
      
      // Debug: Check if user is actually in presence
      if (__DEV__) {
        const presenceList = socketManager.getOnlineUsers(conversationId);
        console.log(`[ConversationScreen] All online users in ${conversationId}:`, presenceList);
      }
      
      // Extract display name - API uses camelCase (displayName, not display_name)
      const displayName = 
        conv.name ||
        otherParticipant?.nickname ||
        (otherParticipant?.user as any)?.displayName ||
        (otherParticipant?.user as any)?.display_name ||
        otherParticipant?.displayName ||
        otherParticipant?.display_name ||
        (otherParticipant?.user as any)?.username ||
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
        const participantUserId = p.userId || p.user_id || (p.user as any)?.id || p.id;
        return String(participantUserId) !== String(user?.id);
      });
      
      // Extract display name with comprehensive fallbacks for nested/flat structures
      // API returns camelCase: user.displayName, user.avatarUrl
      const displayName = 
        conv.name ||
        otherParticipant?.nickname ||
        (otherParticipant?.user as any)?.displayName ||
        otherParticipant?.user?.display_name ||
        (otherParticipant as any)?.displayName ||
        otherParticipant?.display_name ||
        (otherParticipant?.user as any)?.username ||
        otherParticipant?.user?.username ||
        (otherParticipant as any)?.username ||
        'Conversation';
      
      updateHeader(displayName);
    }
  }, [isOtherUserOnline, _conversation, updateHeader, user?.id]);
  
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}/messages`);
      const rawMessages = response.data.data || response.data.messages || [];
      if (isMountedRef.current) {
        const normalized = normalizeMessages(rawMessages);
        // Deduplicate messages by ID before setting
        const uniqueMessages = normalized.reduce((acc: Message[], msg: Message) => {
          if (!acc.some(m => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, []);
        setMessages(uniqueMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMessages();
      await fetchConversation();
    } finally {
      setIsRefreshing(false);
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
  
  // Handle voice message completion - upload and send as a message
  const handleVoiceComplete = async (voiceData: { uri: string; duration: number; waveform: number[] }) => {
    setIsSending(true);
    setIsVoiceMode(false);
    
    try {
      // Note: FileSystem.getInfoAsync is deprecated in Expo SDK 54+
      // However, for file existence check, we can use try-catch on the formData
      // If the file doesn't exist, the upload will fail anyway
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('audio', {
        uri: voiceData.uri,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any);
      formData.append('duration', String(Math.round(voiceData.duration)));
      formData.append('waveform', JSON.stringify(voiceData.waveform));
      formData.append('conversation_id', conversationId);
      
      // Upload voice message
      const response = await api.post('/api/v1/voice-messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const rawMessage = response.data.data || response.data.message || response.data;
      const normalized = normalizeMessage(rawMessage);
      setMessages((prev) => [...prev, normalized]);
      
      // Clean up the temporary file using legacy API
      await deleteAsync(voiceData.uri, { idempotent: true });
    } catch (error) {
      console.error('Error sending voice message:', error);
      // Alert user of failure
      Alert.alert('Error', 'Failed to send voice message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  /**
   * Safely formats a date string to local time.
   * Handles invalid dates gracefully to prevent RangeError.
   */
  const formatTime = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('[ConversationScreen] Invalid date string:', dateString);
        return '';
      }
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('[ConversationScreen] Error formatting date:', error);
      return '';
    }
  };
  
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    // Extract current user ID, ensuring string format for comparison
    const currentUserId = user?.id ? String(user.id) : null;
    
    // Extract message sender ID with comprehensive fallback chain
    // The normalizer should have already set sender_id as a string
    const messageSenderId = item.sender_id 
      ? String(item.sender_id) 
      : (item as any).senderId 
        ? String((item as any).senderId) 
        : item.sender?.id 
          ? String(item.sender.id) 
          : null;
    
    // Determine message ownership - both IDs must exist and match
    const isOwnMessage = Boolean(
      currentUserId && 
      messageSenderId && 
      currentUserId === messageSenderId
    );
    
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
          {/* Voice messages */}
          {(item.type === 'voice' || item.type === 'audio') && item.metadata?.url && (
            <VoiceMessagePlayer
              audioUrl={item.metadata.url}
              duration={item.metadata.duration || 0}
              waveformData={item.metadata.waveform}
              isSender={isOwnMessage}
            />
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
      
      {/* Voice Recorder overlay */}
      {isVoiceMode && (
        <View style={[styles.voiceRecorderContainer, { backgroundColor: colors.surface }]}>
          <VoiceMessageRecorder
            onComplete={handleVoiceComplete}
            onCancel={() => setIsVoiceMode(false)}
            maxDuration={120}
          />
        </View>
      )}
      
      {/* Normal input area */}
      {!isVoiceMode && (
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
          
          {/* Toggle between mic and send based on input text */}
          {inputText.trim() ? (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={sendMessage}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.surfaceHover }]}
              onPress={() => setIsVoiceMode(true)}
              disabled={isSending}
            >
              <Ionicons name="mic" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}
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
  voiceRecorderContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});
