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
  Modal,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { deleteAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { normalizeMessage, normalizeMessages } from '../../lib/normalizers';
import { MessagesStackParamList, Message, Conversation, ConversationParticipant, UserBasic } from '../../types';
import { VoiceMessageRecorder, VoiceMessagePlayer } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fun waving emojis for empty conversation
const WAVE_EMOJIS = ['👋', '✨', '💬', '🎉', '🌟'];

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'Conversation'>;
  route: RouteProp<MessagesStackParamList, 'Conversation'>;
};

export default function ConversationScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  const [_conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  const [otherParticipantLastSeen, setOtherParticipantLastSeen] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [otherUser, setOtherUser] = useState<UserBasic | null>(null);
  
  // Animation refs
  const attachMenuAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Format last seen timestamp for display
  const formatLastSeen = (lastSeenAt: string | null | undefined): string => {
    if (!lastSeenAt) return 'Offline';
    
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays} days ago`;
    
    return `Last seen ${lastSeen.toLocaleDateString()}`;
  };
  
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
  
  // Subscribe to typing indicator changes
  useEffect(() => {
    if (!conversationId || !otherParticipantId) return;
    
    // Initial check for any typing users
    const typingUsers = socketManager.getTypingUsers(conversationId);
    const otherTyping = typingUsers.some(t => String(t.userId) === String(otherParticipantId));
    setIsOtherUserTyping(otherTyping);
    
    // Subscribe to typing changes
    const unsubscribe = socketManager.onTypingChange((convId, userId, isTyping) => {
      if (convId === conversationId && String(userId) === String(otherParticipantId)) {
        setIsOtherUserTyping(isTyping);
      }
    });
    
    return () => unsubscribe();
  }, [conversationId, otherParticipantId]);
  
  // Handle input text changes with typing indicator
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    
    const channelTopic = `conversation:${conversationId}`;
    
    // Send typing indicator when user starts typing
    if (text.length > 0) {
      socketManager.sendTyping(channelTopic, true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after pause (aligned with backend)
      typingTimeoutRef.current = setTimeout(() => {
        socketManager.sendTyping(channelTopic, false);
      }, 5000);
    }
  }, [conversationId]);
  
  // Stop typing indicator when sending message or unmounting
  const stopTypingIndicator = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketManager.sendTyping(`conversation:${conversationId}`, false);
  }, [conversationId]);
  
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
        
        // Validate message data before normalizing
        if (!data.message || !data.message.id) {
          if (__DEV__) {
            console.log('[ConversationScreen] Skipping invalid message payload:', data);
          }
          return;
        }
        
        const normalized = normalizeMessage(data.message);
        
        // Additional validation - skip messages without sender info
        if (!normalized.sender_id && !normalized.sender?.id) {
          if (__DEV__) {
            console.log('[ConversationScreen] Skipping message without sender:', normalized.id);
          }
          return;
        }
        
        // Validate message has actual content or media
        const hasRealContent = normalized.content && normalized.content.trim().length > 0 && normalized.content !== '[Voice Message]';
        const hasMediaUrl = normalized.metadata?.url || normalized.file_url;
        if (!hasRealContent && !hasMediaUrl) {
          if (__DEV__) {
            console.log('[ConversationScreen] Skipping empty WebSocket message:', normalized.id);
          }
          return;
        }
        
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
      // Stop typing indicator on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);
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
    const currentUserId = user?.id;
    if (!currentUserId) return;
    
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}`);
      const conv = response.data.data || response.data;
      setConversation(conv);
      
      // Find other participant - API returns camelCase (userId, user.displayName)
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const participantUserId = p.userId || p.user_id || (p.user as any)?.id || p.id;
        return String(participantUserId) !== String(currentUserId);
      });
      
      // Store other participant's user ID for presence tracking
      const rawOtherUserId = otherParticipant?.userId || otherParticipant?.user_id || (otherParticipant?.user as any)?.id;
      const otherUserId = rawOtherUserId ? String(rawOtherUserId) : null;
      
      if (otherUserId) {
        setOtherParticipantId(otherUserId);
        
        // Store full other user info for profile access
        const otherUserInfo: UserBasic = {
          id: otherUserId,
          username: (otherParticipant?.user as any)?.username || otherParticipant?.username || null,
          display_name: (otherParticipant?.user as any)?.displayName || (otherParticipant?.user as any)?.display_name || null,
          avatar_url: (otherParticipant?.user as any)?.avatarUrl || (otherParticipant?.user as any)?.avatar_url || null,
          status: 'offline',
        };
        setOtherUser(otherUserInfo);
        
        // Extract last seen from participant's user data
        const lastSeen = (otherParticipant?.user as any)?.lastSeenAt || null;
        setOtherParticipantLastSeen(lastSeen);
        
        // Use Phoenix Presence for online status (single source of truth)
        const presenceOnline = socketManager.isUserOnline(conversationId, otherUserId);
        setIsOtherUserOnline(presenceOnline);
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
  
  // Update header with current online and typing status
  const updateHeader = useCallback((displayName: string) => {
    // Determine status text with priority: typing > online > last seen > offline
    let statusText = formatLastSeen(otherParticipantLastSeen);
    let statusColor = '#6b7280';
    
    if (isOtherUserTyping) {
      statusText = 'Typing...';
      statusColor = '#3b82f6';
    } else if (isOtherUserOnline) {
      statusText = 'Online';
      statusColor = '#22c55e';
    }
    
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity 
          style={styles.headerTitleContainer}
          onPress={() => otherParticipantId && navigation.navigate('UserProfile' as any, { userId: otherParticipantId })}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>{displayName}</Text>
          <View style={styles.headerStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {statusText}
            </Text>
          </View>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionBtn}
            onPress={() => handleStartCall('audio')}
          >
            <Ionicons name="call-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionBtn}
            onPress={() => handleStartCall('video')}
          >
            <Ionicons name="videocam-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.e2eeIndicator}>
            <Ionicons name="lock-closed" size={14} color="#22c55e" />
            <Text style={styles.e2eeText}>E2EE</Text>
          </View>
        </View>
      ),
    });
  }, [colors, isOtherUserOnline, isOtherUserTyping, otherParticipantLastSeen, otherParticipantId, navigation]);
  
  // Update header when online or typing status changes
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
  }, [isOtherUserOnline, isOtherUserTyping, otherParticipantLastSeen, _conversation, updateHeader, user?.id]);
  
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
    
    // Stop typing indicator when sending
    stopTypingIndicator();
    
    try {
      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
        content,
      });
      const rawMessage = response.data.data || response.data.message || response.data;
      const normalized = normalizeMessage(rawMessage);
      // Add with deduplication - socket may also deliver this message
      setMessages((prev) => {
        const exists = prev.some(m => m.id === normalized.id);
        if (exists) return prev;
        return [...prev, normalized];
      });
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
      
      // Validate message has required fields before adding
      if (!rawMessage || !rawMessage.id) {
        console.warn('[handleVoiceComplete] Invalid message response:', rawMessage);
        return;
      }
      
      const normalized = normalizeMessage(rawMessage);
      
      // Add with deduplication - socket may also deliver this message
      setMessages((prev) => {
        const exists = prev.some(m => m.id === normalized.id);
        if (exists) return prev;
        return [...prev, normalized];
      });
      
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
  
  // Handle starting a call (audio or video)
  const handleStartCall = (type: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // For now, show coming soon alert - calls can be implemented with WebRTC
    Alert.alert(
      `${type === 'video' ? 'Video' : 'Voice'} Call`,
      `${type === 'video' ? 'Video' : 'Voice'} calls are coming soon! Stay tuned for real-time encrypted calls.`,
      [{ text: 'Got it', style: 'default' }]
    );
  };
  
  // Toggle attachment menu with animation
  const toggleAttachMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showAttachMenu ? 0 : 1;
    setShowAttachMenu(!showAttachMenu);
    Animated.spring(attachMenuAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };
  
  // Handle image picker
  const handlePickImage = async () => {
    setShowAttachMenu(false);
    
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos to send images.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    
    if (!result.canceled && result.assets[0]) {
      await uploadAndSendFile(result.assets[0].uri, 'image');
    }
  };
  
  // Handle camera capture
  const handleTakePhoto = async () => {
    setShowAttachMenu(false);
    
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take photos.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      await uploadAndSendFile(result.assets[0].uri, 'image');
    }
  };
  
  // Handle document picker
  const handlePickDocument = async () => {
    setShowAttachMenu(false);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets?.[0]) {
        await uploadAndSendFile(result.assets[0].uri, 'file', result.assets[0].name);
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };
  
  // Upload and send file as message
  const uploadAndSendFile = async (uri: string, type: 'image' | 'file', filename?: string) => {
    setIsSending(true);
    
    try {
      const formData = new FormData();
      const name = filename || `${type}_${Date.now()}.${type === 'image' ? 'jpg' : 'bin'}`;
      
      formData.append('file', {
        uri,
        name,
        type: type === 'image' ? 'image/jpeg' : 'application/octet-stream',
      } as any);
      formData.append('conversation_id', conversationId);
      formData.append('type', type);
      
      const response = await api.post('/api/v1/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const fileUrl = response.data.url || response.data.data?.url;
      
      if (fileUrl) {
        // Send message with file attachment
        const msgResponse = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
          content: type === 'image' ? '📷 Photo' : `📎 ${name}`,
          type,
          file_url: fileUrl,
        });
        
        const rawMessage = msgResponse.data.data || msgResponse.data.message || msgResponse.data;
        if (rawMessage?.id) {
          const normalized = normalizeMessage(rawMessage);
          setMessages((prev) => {
            const exists = prev.some(m => m.id === normalized.id);
            if (exists) return prev;
            return [...prev, normalized];
          });
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to send file. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Send a wave greeting
  const handleSendWave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const emoji = WAVE_EMOJIS[Math.floor(Math.random() * WAVE_EMOJIS.length)];
    
    // Trigger wave animation
    Animated.sequence([
      Animated.timing(waveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    
    // Send the wave message directly
    try {
      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
        content: emoji,
        type: 'text',
      });
      
      const rawMessage = response.data.data || response.data.message || response.data;
      if (rawMessage?.id) {
        const normalized = normalizeMessage(rawMessage);
        setMessages((prev) => {
          const exists = prev.some(m => m.id === normalized.id);
          if (exists) return prev;
          return [...prev, normalized];
        });
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error sending wave:', error);
    }
  };
  
  // Get message status icon and color
  const getMessageStatus = (message: Message, isOwn: boolean) => {
    if (!isOwn) return null;
    
    const status = message.status || (message.read_at ? 'read' : message.delivered_at ? 'delivered' : 'sent');
    
    switch (status) {
      case 'sending':
        return { icon: 'time-outline' as const, color: colors.textTertiary };
      case 'sent':
        return { icon: 'checkmark-outline' as const, color: colors.textTertiary };
      case 'delivered':
        return { icon: 'checkmark-done-outline' as const, color: colors.textTertiary };
      case 'read':
        return { icon: 'checkmark-done-outline' as const, color: '#3b82f6' };
      case 'failed':
        return { icon: 'alert-circle-outline' as const, color: '#ef4444' };
      default:
        return { icon: 'checkmark-outline' as const, color: colors.textTertiary };
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
    // Skip rendering messages without proper ID or that appear empty/invalid
    if (!item.id) {
      if (__DEV__) {
        console.log('[renderMessage] Skipping message without ID');
      }
      return null;
    }
    
    // Skip messages without valid sender info (ghost messages)
    const hasSender = item.sender_id || item.sender?.id;
    if (!hasSender) {
      if (__DEV__) {
        console.log('[renderMessage] Skipping message without sender:', item.id);
      }
      return null;
    }
    
    // Skip messages that have no actual content
    const hasTextContent = item.content && item.content.trim().length > 0 && item.content !== '[Voice Message]';
    const hasMediaUrl = item.metadata?.url || item.file_url;
    const isVoiceWithUrl = item.type === 'voice' && hasMediaUrl;
    const isFileWithUrl = (item.type === 'file' || item.type === 'image') && hasMediaUrl;
    
    if (!hasTextContent && !isVoiceWithUrl && !isFileWithUrl) {
      if (__DEV__) {
        console.log('[renderMessage] Skipping empty/invalid message:', item.id, { 
          type: item.type, 
          content: item.content?.substring(0, 20),
          hasUrl: !!hasMediaUrl 
        });
      }
      return null;
    }
    
    // Get current user ID - ensure string comparison
    const currentUserId = user?.id ? String(user.id) : '';
    
    // Get message sender ID - normalizer sets sender_id (snake_case)
    // Fallback to sender.id for backwards compatibility
    const messageSenderId = item.sender_id 
      ? String(item.sender_id) 
      : (item.sender?.id ? String(item.sender.id) : '');
    
    // Message is from current user if IDs match
    const isOwnMessage = currentUserId !== '' && currentUserId === messageSenderId;
    
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
          {/* Text content - hide for voice messages */}
          {item.content && item.type !== 'voice' && item.type !== 'audio' && (
            <Text
              style={[
                styles.messageText,
                { color: isOwnMessage ? '#fff' : colors.text },
              ]}
            >
              {item.content}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
              ]}
            >
              {formatTime(item.inserted_at)}
              {item.is_edited && ' • edited'}
            </Text>
            {/* Message status indicator for own messages */}
            {isOwnMessage && (() => {
              const statusInfo = getMessageStatus(item, isOwnMessage);
              if (!statusInfo) return null;
              return (
                <Ionicons
                  name={statusInfo.icon}
                  size={14}
                  color={statusInfo.color}
                  style={styles.messageStatusIcon}
                />
              );
            })()}
          </View>
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
  
  // Beautiful animated empty conversation state - inspired by Discord/Telegram
  const EmptyConversation = () => {
    const otherName = otherUser?.display_name || otherUser?.username || 'this person';
    const otherAvatar = otherUser?.avatar_url;
    const otherInitial = otherName.charAt(0).toUpperCase();
    
    // Animated wave hand for the greeting
    const waveRotate = waveAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '20deg', '0deg'],
    });
    
    return (
      <View style={styles.emptyStateWrapper}>
        {/* Large profile avatar */}
        <View style={styles.emptyProfileSection}>
          {otherAvatar ? (
            <Image source={{ uri: otherAvatar }} style={styles.emptyAvatar} />
          ) : (
            <View style={[styles.emptyAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.emptyAvatarText}>{otherInitial}</Text>
            </View>
          )}
          <View style={styles.emptyOnlineIndicator} />
        </View>
        
        {/* User name and info */}
        <Text style={[styles.emptyUserName, { color: colors.text }]}>{otherName}</Text>
        
        {/* Cute message with animated emoji */}
        <View style={styles.emptyMessageRow}>
          <Animated.Text style={[
            styles.emptyWaveEmoji,
            { transform: [{ rotate: waveRotate }] }
          ]}>
            👋
          </Animated.Text>
          <Text style={[styles.emptyMessageText, { color: colors.textSecondary }]}>
            This is the very beginning of your{'\n'}conversation with {otherName}
          </Text>
        </View>
        
        {/* Action buttons */}
        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={[styles.waveButton, { backgroundColor: colors.primary }]}
            onPress={handleSendWave}
            activeOpacity={0.8}
          >
            <Text style={styles.waveButtonText}>👋  Wave to {otherName}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sayHiButton, { borderColor: colors.border }]}
            onPress={() => setInputText('Hey! How are you? 😊')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sayHiButtonText, { color: colors.text }]}>💬  Say Hi</Text>
          </TouchableOpacity>
        </View>
        
        {/* Fun conversation starters */}
        <View style={styles.conversationStarters}>
          <Text style={[styles.startersTitle, { color: colors.textTertiary }]}>Quick starters</Text>
          <View style={styles.startersRow}>
            {['Hello! 👋', 'What\'s up? 🤔', 'Nice to meet you! ✨'].map((starter, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.starterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setInputText(starter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.starterText, { color: colors.text }]}>{starter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };
  
  // Attachment menu modal
  const AttachmentMenu = () => {
    const slideUp = attachMenuAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [300, 0],
    });
    
    const attachOptions = [
      { icon: 'image-outline', label: 'Photo', color: '#10b981', onPress: handlePickImage },
      { icon: 'camera-outline', label: 'Camera', color: '#3b82f6', onPress: handleTakePhoto },
      { icon: 'document-outline', label: 'File', color: '#8b5cf6', onPress: handlePickDocument },
      { icon: 'location-outline', label: 'Location', color: '#f59e0b', onPress: () => {
        setShowAttachMenu(false);
        Alert.alert('Location Sharing', 'Location sharing is coming soon!');
      }},
    ];
    
    if (!showAttachMenu) return null;
    
    return (
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <TouchableOpacity 
          style={styles.attachMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}
        >
          <Animated.View style={[
            styles.attachMenuContainer,
            { backgroundColor: colors.surface, transform: [{ translateY: slideUp }] }
          ]}>
            <View style={[styles.attachMenuHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.attachMenuTitle, { color: colors.text }]}>Share</Text>
            
            <View style={styles.attachMenuGrid}>
              {attachOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.attachMenuItem}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.attachMenuIcon, { backgroundColor: option.color + '20' }]}>
                    <Ionicons name={option.icon as any} size={28} color={option.color} />
                  </View>
                  <Text style={[styles.attachMenuLabel, { color: colors.text }]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <AttachmentMenu />
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
          <TouchableOpacity style={styles.attachButton} onPress={toggleAttachMenu}>
            <Animated.View style={{
              transform: [{ 
                rotate: attachMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                })
              }]
            }}>
              <Ionicons name="add-circle" size={28} color={showAttachMenu ? colors.primary : colors.textSecondary} />
            </Animated.View>
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="Message..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={handleTextChange}
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
  // Header action buttons
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionBtn: {
    padding: 8,
    borderRadius: 20,
  },
  // Message footer with status
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageStatusIcon: {
    marginLeft: 4,
  },
  // Beautiful empty state styles
  emptyStateWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyProfileSection: {
    position: 'relative',
    marginBottom: 16,
  },
  emptyAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  emptyAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAvatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  emptyOnlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1a2e',
  },
  emptyUserName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyWaveEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  emptyMessageText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyActions: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
    marginBottom: 24,
  },
  waveButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  waveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sayHiButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
  },
  sayHiButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  conversationStarters: {
    alignItems: 'center',
    marginTop: 8,
  },
  startersTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  starterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  starterText: {
    fontSize: 13,
  },
  // Attachment menu styles
  attachMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachMenuContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  attachMenuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  attachMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  attachMenuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  attachMenuItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 16,
  },
  attachMenuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachMenuLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Legacy empty state (kept for compatibility)
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
