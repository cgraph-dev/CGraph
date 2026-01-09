import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
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
  Pressable,
  ScrollView,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useE2EE } from '../../lib/crypto/E2EEContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { normalizeMessage, normalizeMessages } from '../../lib/normalizers';
import { MessagesStackParamList, Message, Conversation, ConversationParticipant, UserBasic } from '../../types';
import { VoiceMessageRecorder, VoiceMessagePlayer, TelegramAttachmentPicker } from '../../components';
import { createLogger } from '../../lib/logger';

const logger = createLogger('ConversationScreen');

// Helper to get correct MIME type from file extension or asset
const getMimeType = (filename: string | undefined, defaultType: string): string => {
  if (!filename) return defaultType;
  
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif',
    // Videos
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'm4v': 'video/x-m4v',
    'webm': 'video/webm',
    '3gp': 'video/3gpp',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'csv': 'text/csv',
  };
  
  return ext ? (mimeMap[ext] || defaultType) : defaultType;
};

// Helper to process reactions and set hasReacted based on current user
const processMessagesWithReactions = (messages: Message[], currentUserId: string | undefined): Message[] => {
  if (!currentUserId) return messages;
  
  return messages.map(msg => {
    if (!msg.reactions || msg.reactions.length === 0) return msg;
    
    const processedReactions = msg.reactions.map(reaction => {
      // Check if current user is in the users array for this reaction
      // Handle multiple formats:
      // 1. Array of user objects: [{ id: "...", username: "..." }, ...]
      // 2. Array of user IDs: ["user-id-1", "user-id-2", ...]
      // 3. Mixed formats from different backend responses
      const hasReacted = reaction.users?.some(u => {
        // If u is a string (just user ID), compare directly
        if (typeof u === 'string') {
          return String(u) === String(currentUserId);
        }
        // If u is an object, check various ID fields
        const uAny = u as any;
        return String(u.id) === String(currentUserId) || 
               String(uAny.user_id) === String(currentUserId);
      }) || false;
      
      // Normalize users array to always be objects with id field
      const normalizedUsers = reaction.users?.map(u => {
        if (typeof u === 'string') {
          return { id: u, username: null, display_name: null, avatar_url: null, status: 'offline' as const };
        }
        return u;
      }) || [];
      
      return {
        ...reaction,
        users: normalizedUsers,
        hasReacted,
      };
    });
    
    return { ...msg, reactions: processedReactions };
  });
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fun waving emojis for empty conversation
const WAVE_EMOJIS = ['👋', '✨', '💬', '🎉', '🌟'];

// Quick reaction emojis - most commonly used
const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

// Full emoji picker categories
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  'Gestures': ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  'Symbols': ['✨', '⭐', '🌟', '💫', '🔥', '💯', '💢', '💥', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🎵', '🎶'],
};

// Animated Message Wrapper Component for smooth entrance animations
interface AnimatedMessageProps {
  children: React.ReactNode;
  isOwnMessage: boolean;
  index: number;
  isNew?: boolean;
}

const AnimatedMessageWrapper = memo(({ children, isOwnMessage, index, isNew }: AnimatedMessageProps) => {
  const slideAnim = useRef(new Animated.Value(isNew ? 30 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(isNew ? 0.9 : 1)).current;
  
  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
      ]).start();
    }
  }, [isNew, slideAnim, fadeAnim, scaleAnim]);
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateX: isOwnMessage ? slideAnim : Animated.multiply(slideAnim, -1) },
          { scale: scaleAnim },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
});

// Animated Reaction Bubble Component
const AnimatedReactionBubble = memo(({ 
  reaction, 
  isOwnMessage, 
  onPress, 
  colors 
}: { 
  reaction: { emoji: string; count: number; hasReacted: boolean };
  isOwnMessage: boolean;
  onPress: () => void;
  colors: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  const handlePress = () => {
    // Bounce animation on tap
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
    
    // Also trigger the emoji bounce
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -8,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
    ]).start();
    
    onPress();
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.reactionBubble,
        { 
          backgroundColor: reaction.hasReacted 
            ? (isOwnMessage ? 'rgba(255,255,255,0.25)' : colors.primary + '25')
            : (isOwnMessage ? 'rgba(255,255,255,0.12)' : colors.surface),
          borderColor: reaction.hasReacted ? colors.primary : 'transparent',
          borderWidth: reaction.hasReacted ? 1.5 : 0,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.Text 
        style={[
          styles.reactionEmoji,
          { 
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim },
            ] 
          }
        ]}
      >
        {reaction.emoji}
      </Animated.Text>
      {reaction.count > 1 && (
        <Text style={[
          styles.reactionCount,
          { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : colors.text }
        ]}>
          {reaction.count}
        </Text>
      )}
    </TouchableOpacity>
  );
});

// Video Player Component using expo-video
interface VideoPlayerComponentProps {
  videoUrl: string;
  duration?: number;
  onClose: () => void;
}

const VideoPlayerComponent = memo(({ videoUrl, duration, onClose }: VideoPlayerComponentProps) => {
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
    player.play();
  });
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  useEffect(() => {
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    
    return () => {
      subscription.remove();
    };
  }, [player]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (player.currentTime !== undefined) {
        setCurrentTime(player.currentTime);
      }
    }, 250);
    
    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleTap = () => {
    setShowControls(!showControls);
  };
  
  return (
    <Pressable 
      style={styles.videoPlayerWrapper} 
      onPress={handleTap}
    >
      <VideoView
        style={styles.videoPlayer}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />
      
      {/* Custom Controls Overlay */}
      {showControls && (
        <View style={styles.videoControlsOverlay}>
          {/* Center play/pause button */}
          <TouchableOpacity 
            style={styles.videoPlayPauseBtn}
            onPress={togglePlayPause}
          >
            <View style={styles.videoPlayPauseBtnInner}>
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={40} 
                color="#fff" 
              />
            </View>
          </TouchableOpacity>
          
          {/* Bottom progress bar */}
          <View style={styles.videoProgressContainer}>
            <Text style={styles.videoTimeText}>{formatTime(currentTime)}</Text>
            <View style={styles.videoProgressBar}>
              <View 
                style={[
                  styles.videoProgressFill,
                  { 
                    width: duration ? `${(currentTime / duration) * 100}%` : '0%' 
                  }
                ]} 
              />
            </View>
            <Text style={styles.videoTimeText}>
              {duration ? formatTime(duration) : '--:--'}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
});

// Attachment Video Preview Component for pending attachments
interface AttachmentVideoPreviewProps {
  uri: string;
  duration?: number;
}

const AttachmentVideoPreview = memo(({ uri, duration }: AttachmentVideoPreviewProps) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.pause();
  });
  
  return (
    <View style={styles.attachmentPreviewVideoContainer}>
      <VideoView
        style={styles.attachmentPreviewImage}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.videoPlayOverlay}>
        <View style={styles.videoPlayButton}>
          <Ionicons name="play" size={40} color="#fff" />
        </View>
      </View>
      {duration !== undefined && duration > 0 && (
        <View style={styles.videoDurationBadge}>
          <Text style={styles.videoDurationText}>
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </Text>
        </View>
      )}
    </View>
  );
});

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'Conversation'>;
  route: RouteProp<MessagesStackParamList, 'Conversation'>;
};


export default function ConversationScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { isInitialized: isE2EEInitialized, encryptMessage } = useE2EE();
  
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
  
  // Image viewer state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const imageGalleryRef = useRef<FlatList>(null);
  
  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoDuration, setSelectedVideoDuration] = useState<number>(0);
  
  // Message action menu state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Reaction picker state
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerMessage, setReactionPickerMessage] = useState<Message | null>(null);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');
  
  // Attachment preview state
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    uri: string;
    type: 'image' | 'file' | 'video';
    name?: string;
    mimeType?: string;
    duration?: number;
  }>>([]);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [attachmentCaption, setAttachmentCaption] = useState('');
  const attachmentPreviewAnim = useRef(new Animated.Value(0)).current;
  
  // Track newly added messages for entrance animations
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  
  // Picker lock to prevent concurrent picker operations
  const isPickerActiveRef = useRef(false);
  
  // Track deleted message IDs to prevent re-adding them
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());
  
  // Track if we should scroll to bottom on next content size change
  const shouldScrollToBottomRef = useRef(true);
  const contentHeightRef = useRef(0);
  
  // Animation refs
  const attachMenuAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const imageViewerAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;
  const messageActionsAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const menuScaleAnim = useRef(new Animated.Value(0.9)).current;
  const sendButtonAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const actionItemAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Pinned messages - get all pinned, sorted by pin date (most recent first)
  const pinnedMessages = useMemo(() => {
    return messages
      .filter(m => m.is_pinned)
      .sort((a, b) => {
        const aDate = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
        const bDate = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
        return bDate - aDate;
      });
  }, [messages]);
  
  // Current pinned message index for navigation
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  
  // Reset pinned index when pinned messages change (e.g., when unpinning)
  useEffect(() => {
    if (pinnedMessages.length === 0) {
      setCurrentPinnedIndex(0);
    } else if (currentPinnedIndex >= pinnedMessages.length) {
      // If current index is out of bounds, reset to last valid index
      setCurrentPinnedIndex(pinnedMessages.length - 1);
    }
  }, [pinnedMessages.length, currentPinnedIndex]);
  
  // Get the current pinned message to display
  const currentPinnedMessage = pinnedMessages.length > 0 ? pinnedMessages[Math.min(currentPinnedIndex, pinnedMessages.length - 1)] : null;
  
  // Scroll to a specific message by ID
  const scrollToMessage = useCallback((messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.3, // Show message in upper third of screen
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [messages]);
  
  // Navigate to next/prev pinned message
  const navigatePinnedMessages = useCallback((direction: 'next' | 'prev') => {
    if (pinnedMessages.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentPinnedIndex(prev => (prev + 1) % pinnedMessages.length);
    } else {
      setCurrentPinnedIndex(prev => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
    }
    Haptics.selectionAsync();
  }, [pinnedMessages.length]);
  
  // Format last seen timestamp for display
  const formatLastSeen = (lastSeenAt: string | null | undefined): string => {
    if (!lastSeenAt) return '';
    
    const lastSeen = new Date(lastSeenAt);
    // Check if it's a valid date
    if (isNaN(lastSeen.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeen.toLocaleDateString();
  };
  
  // Subscribe to presence changes (both conversation and global friend presence)
  useEffect(() => {
    if (!conversationId || !otherParticipantId) return;
    
    // Initial check - first try global friend presence, then conversation presence
    const isOnline = socketManager.isFriendOnline(otherParticipantId) || 
                     socketManager.isUserOnline(conversationId, otherParticipantId);
    setIsOtherUserOnline(isOnline);
    
    // Subscribe to conversation-level status changes
    const unsubscribeConv = socketManager.onStatusChange((convId, participantId, isOnline) => {
      if (convId === conversationId && participantId === otherParticipantId) {
        setIsOtherUserOnline(isOnline);
      }
    });
    
    // Subscribe to global friend status changes
    const unsubscribeGlobal = socketManager.onGlobalStatusChange((userId, isOnline) => {
      if (userId === otherParticipantId) {
        setIsOtherUserOnline(isOnline);
      }
    });
    
    return () => {
      unsubscribeConv();
      unsubscribeGlobal();
    };
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
        
        // Handle events with message_id only (delete, unpin, reactions)
        if (event === 'message_deleted') {
          const deleteData = payload as { message_id?: string; message?: { id: string } };
          const messageId = deleteData.message_id || deleteData.message?.id;
          if (messageId) {
            // Track deleted message to prevent re-adding
            deletedMessageIdsRef.current.add(messageId);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
          return;
        }
        
        if (event === 'message_unpinned') {
          const unpinData = payload as { message_id?: string; message?: { id: string } };
          const messageId = unpinData.message_id || unpinData.message?.id;
          if (messageId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId ? { ...m, is_pinned: false, pinned_at: undefined, pinned_by_id: undefined } : m))
            );
          }
          return;
        }
        
        // Handle reaction added
        if (event === 'reaction_added') {
          const reactionData = payload as { 
            message_id: string; 
            emoji: string; 
            user_id: string;
            user?: { id: string; username?: string; display_name?: string; avatar_url?: string };
          };
          if (reactionData.message_id && reactionData.emoji) {
            const reactingUserId = String(reactionData.user_id);
            const currentUserId = String(user?.id || '');
            
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== reactionData.message_id) return m;
                const reactions = [...(m.reactions || [])];
                const existingIdx = reactions.findIndex(r => r.emoji === reactionData.emoji);
                
                if (existingIdx >= 0) {
                  // Add user to existing reaction
                  const existing = reactions[existingIdx];
                  const userAlreadyReacted = existing.users.some(u => String(u.id) === reactingUserId);
                  if (!userAlreadyReacted) {
                    reactions[existingIdx] = {
                      ...existing,
                      count: existing.count + 1,
                      users: [...existing.users, {
                        id: reactionData.user_id,
                        username: reactionData.user?.username || null,
                        display_name: reactionData.user?.display_name,
                        avatar_url: reactionData.user?.avatar_url,
                        status: 'online',
                      }],
                      hasReacted: existing.hasReacted || reactingUserId === currentUserId,
                    };
                  }
                } else {
                  // Create new reaction
                  reactions.push({
                    emoji: reactionData.emoji,
                    count: 1,
                    users: [{
                      id: reactionData.user_id,
                      username: reactionData.user?.username || null,
                      display_name: reactionData.user?.display_name,
                      avatar_url: reactionData.user?.avatar_url,
                      status: 'online',
                    }],
                    hasReacted: reactingUserId === currentUserId,
                  });
                }
                return { ...m, reactions };
              })
            );
          }
          return;
        }
        
        // Handle reaction removed
        if (event === 'reaction_removed') {
          const reactionData = payload as { message_id: string; emoji: string; user_id: string };
          if (reactionData.message_id && reactionData.emoji) {
            const removedUserId = String(reactionData.user_id);
            const currentUserId = String(user?.id || '');
            
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== reactionData.message_id) return m;
                const reactions = [...(m.reactions || [])];
                const existingIdx = reactions.findIndex(r => r.emoji === reactionData.emoji);
                
                if (existingIdx >= 0) {
                  const existing = reactions[existingIdx];
                  const newUsers = existing.users.filter(u => String(u.id) !== removedUserId);
                  if (newUsers.length === 0) {
                    // Remove reaction entirely
                    reactions.splice(existingIdx, 1);
                  } else {
                    reactions[existingIdx] = {
                      ...existing,
                      count: newUsers.length,
                      users: newUsers,
                      hasReacted: newUsers.some(u => String(u.id) === currentUserId),
                    };
                  }
                }
                return { ...m, reactions };
              })
            );
          }
          return;
        }
        
        const data = payload as { message: Record<string, unknown> };
        
        // Validate message data before normalizing
        if (!data.message || !data.message.id) {
          if (__DEV__) {
            logger.debug('Skipping invalid message payload:', data);
          }
          return;
        }
        
        const normalized = normalizeMessage(data.message);
        
        // Additional validation - skip messages without sender info (except for pin events)
        if (event !== 'message_pinned' && !normalized.sender_id && !normalized.sender?.id) {
          if (__DEV__) {
            logger.debug('Skipping message without sender:', normalized.id);
          }
          return;
        }
        
        // Validate message has actual content or media (except for pin events)
        if (event !== 'message_pinned') {
          const hasRealContent = normalized.content && normalized.content.trim().length > 0 && normalized.content !== '[Voice Message]';
          const hasMediaUrl = normalized.metadata?.url || normalized.file_url;
          if (!hasRealContent && !hasMediaUrl) {
            if (__DEV__) {
              logger.debug('Skipping empty WebSocket message:', normalized.id);
            }
            return;
          }
        }
        
        if (event === 'new_message') {
          // Skip if message was deleted
          if (deletedMessageIdsRef.current.has(normalized.id)) {
            if (__DEV__) {
              logger.debug('Skipping deleted message:', normalized.id);
            }
            return;
          }
          
          setMessages((prev) => {
            // Check for duplicates before adding
            const exists = prev.some(m => m.id === normalized.id);
            if (exists) {
              if (__DEV__) {
                logger.debug('Skipping duplicate message:', normalized.id);
              }
              return prev;
            }
            // Prepend for inverted list (newest first)
            return [normalized, ...prev];
          });
          
          // Scroll to top (visually bottom in inverted list) when receiving new message
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        } else if (event === 'message_updated') {
          // Skip if message was deleted
          if (deletedMessageIdsRef.current.has(normalized.id)) {
            return;
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === normalized.id ? normalized : m))
          );
        } else if (event === 'message_pinned') {
          // Update message to show as pinned
          setMessages((prev) =>
            prev.map((m) => (m.id === normalized.id ? { ...m, is_pinned: true, pinned_at: normalized.pinned_at, pinned_by_id: normalized.pinned_by_id } : m))
          );
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
        
        // Use global friend presence first, then fall back to conversation presence
        const presenceOnline = socketManager.isFriendOnline(otherUserId) ||
                               socketManager.isUserOnline(conversationId, otherUserId);
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
      logger.error('Error fetching conversation:', error);
    }
  };
  
  // Update header with current online and typing status
  const updateHeader = useCallback((displayName: string) => {
    // Determine status text with priority: typing > online > last seen > offline
    const lastSeenText = formatLastSeen(otherParticipantLastSeen);
    let statusText = lastSeenText ? `Last seen ${lastSeenText}` : 'Offline';
    let statusColor = '#6b7280';
    let showPulse = false;
    
    if (isOtherUserTyping) {
      statusText = 'Typing...';
      statusColor = '#3b82f6';
      showPulse = true;
    } else if (isOtherUserOnline) {
      statusText = 'Online';
      statusColor = '#22c55e';
      showPulse = true;
    }
    
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity 
          style={styles.headerTitleContainer}
          onPress={() => {
            if (otherParticipantId) {
              // Navigate to FriendsTab and then to UserProfile screen
              (navigation as any).navigate('FriendsTab', {
                screen: 'UserProfile',
                params: { userId: otherParticipantId }
              });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.headerAvatar, { backgroundColor: colors.surfaceHover }]}>
            {otherUser?.avatar_url ? (
              <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatarImage} />
            ) : (
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{displayName}</Text>
            <View style={styles.headerStatusRow}>
              {(isOtherUserOnline || isOtherUserTyping) && (
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: statusColor },
                  showPulse && styles.statusDotPulse
                ]} />
              )}
              <Text style={[
                styles.headerSubtitle, 
                { color: isOtherUserOnline || isOtherUserTyping ? statusColor : colors.textSecondary },
                (isOtherUserOnline || isOtherUserTyping) && { fontWeight: '500' }
              ]}>
                {statusText}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
            onPress={() => handleStartCall('audio')}
          >
            <Ionicons name="call-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
            onPress={() => handleStartCall('video')}
          >
            <Ionicons name="videocam-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [colors, isOtherUserOnline, isOtherUserTyping, otherParticipantLastSeen, otherParticipantId, otherUser, navigation]);
  
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
        // Process reactions to set hasReacted based on current user
        const withReactions = processMessagesWithReactions(normalized, user?.id);
        // Deduplicate and filter out deleted messages
        const uniqueMessages = withReactions.reduce((acc: Message[], msg: Message) => {
          // Skip messages that were deleted in this session
          if (deletedMessageIdsRef.current.has(msg.id)) {
            return acc;
          }
          if (!acc.some(m => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, []);
        
        // Sort messages reverse chronologically (newest first) for inverted list
        // Inverted FlatList displays from bottom, so newest appears at bottom visually
        const sortedMessages = uniqueMessages.sort((a, b) => {
          const dateA = new Date(a.inserted_at).getTime();
          const dateB = new Date(b.inserted_at).getTime();
          return dateB - dateA; // Newest first
        });
        
        setMessages(sortedMessages);
      }
    } catch (error) {
      logger.error('Error fetching messages:', error);
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
      // fetchMessages already handles scrolling to bottom
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Animated send button press effect
  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(sendButtonAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
  };
  
  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;
    
    // Trigger send button animation
    animateSendButton();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setIsSending(true);
    setInputText('');
    const currentReplyTo = replyingTo;
    setReplyingTo(null); // Clear reply after capturing
    
    // Stop typing indicator when sending
    stopTypingIndicator();
    
    try {
      let messagePayload: Record<string, unknown> = { content };
      if (currentReplyTo) {
        messagePayload.reply_to_id = currentReplyTo.id;
      }
      
      // E2EE: Encrypt message for direct conversations if E2EE is initialized
      let plaintextForLocal = content;
      if (isE2EEInitialized && otherParticipantId) {
        try {
          const encryptedMsg = await encryptMessage(otherParticipantId, content);
          messagePayload = {
            content: encryptedMsg.ciphertext,
            is_encrypted: true,
            ephemeral_public_key: encryptedMsg.ephemeralPublicKey,
            nonce: encryptedMsg.nonce,
            recipient_identity_key_id: encryptedMsg.recipientIdentityKeyId,
            one_time_prekey_id: encryptedMsg.oneTimePreKeyId,
          };
          if (currentReplyTo) {
            messagePayload.reply_to_id = currentReplyTo.id;
          }
          logger.log('Sent E2EE encrypted message');
        } catch (encryptError) {
          logger.error('E2EE encryption failed, falling back to plaintext:', encryptError);
          // Fall through to plaintext
        }
      }
      
      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, messagePayload);
      const rawMessage = response.data.data || response.data.message || response.data;
      const normalized = normalizeMessage(rawMessage);
      
      // For encrypted messages, store plaintext locally (we know what we sent)
      if (messagePayload.is_encrypted) {
        normalized.content = plaintextForLocal;
      }
      
      // Mark as new message for entrance animation
      setNewMessageIds(prev => new Set(prev).add(normalized.id));
      
      // Add with deduplication - socket may also deliver this message
      // Prepend for inverted list (newest first)
      setMessages((prev) => {
        const exists = prev.some(m => m.id === normalized.id);
        if (exists) return prev;
        return [normalized, ...prev];
      });
      
      // Scroll to the new message (offset 0 for inverted list)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
      
      // Clear new message flag after animation completes
      setTimeout(() => {
        setNewMessageIds(prev => {
          const next = new Set(prev);
          next.delete(normalized.id);
          return next;
        });
      }, 500);
    } catch (error) {
      logger.error('Error sending message:', error);
      setInputText(content);
      if (currentReplyTo) setReplyingTo(currentReplyTo); // Restore reply on error
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
        logger.warn('Invalid message response:', rawMessage);
        return;
      }
      
      const normalized = normalizeMessage(rawMessage);
      
      // Add with deduplication - socket may also deliver this message
      // Prepend for inverted list (newest first)
      setMessages((prev) => {
        const exists = prev.some(m => m.id === normalized.id);
        if (exists) return prev;
        return [normalized, ...prev];
      });
      
      // Scroll to the new voice message (offset 0 for inverted list)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
      
      // Clean up the temporary file
      await FileSystem.deleteAsync(voiceData.uri, { idempotent: true });
    } catch (error) {
      logger.error('Error sending voice message:', error);
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
  
  // Close attachment menu with animation - always animate to closed state
  const closeAttachMenu = useCallback(() => {
    setShowAttachMenu(false);
    Animated.spring(attachMenuAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [attachMenuAnim]);
  
  // Open attachment menu with animation
  const openAttachMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttachMenu(true);
    Animated.spring(attachMenuAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [attachMenuAnim]);
  
  // Toggle attachment menu with animation
  const toggleAttachMenu = useCallback(() => {
    if (showAttachMenu) {
      closeAttachMenu();
    } else {
      openAttachMenu();
    }
  }, [showAttachMenu, closeAttachMenu, openAttachMenu]);
  
  // Handle image press - open fullscreen viewer with animation
  // Can open a single image or a gallery of images with swipe support
  const handleImagePress = useCallback((imageUrl: string, allImages?: string[], startIndex?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Set up gallery if multiple images provided
    if (allImages && allImages.length > 1) {
      setImageGallery(allImages);
      setCurrentImageIndex(startIndex ?? 0);
      setSelectedImage(allImages[startIndex ?? 0]);
    } else {
      setImageGallery([imageUrl]);
      setCurrentImageIndex(0);
      setSelectedImage(imageUrl);
    }
    
    setShowImageViewer(true);
    
    // Animate in
    Animated.parallel([
      Animated.timing(imageViewerAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(imageScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start(() => {
      // Scroll to the correct image after modal opens
      if (allImages && allImages.length > 1 && startIndex && startIndex > 0) {
        setTimeout(() => {
          imageGalleryRef.current?.scrollToIndex({ index: startIndex, animated: false });
        }, 50);
      }
    });
  }, [imageViewerAnim, imageScaleAnim]);
  
  // Close image viewer with animation
  const closeImageViewer = useCallback(() => {
    Animated.parallel([
      Animated.timing(imageViewerAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(imageScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowImageViewer(false);
      setSelectedImage(null);
      setImageGallery([]);
      setCurrentImageIndex(0);
    });
  }, [imageViewerAnim, imageScaleAnim]);
  
  // Handle video press - open fullscreen video player
  const handleVideoPress = useCallback((videoUrl: string, duration?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVideoUrl(videoUrl);
    setSelectedVideoDuration(duration || 0);
    setShowVideoPlayer(true);
  }, []);
  
  // Close video player
  const closeVideoPlayer = useCallback(() => {
    setShowVideoPlayer(false);
    setSelectedVideoUrl(null);
    setSelectedVideoDuration(0);
  }, []);
  
  // Handle file press - open/download file
  const handleFilePress = useCallback(async (fileUrl: string, filename?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const canOpen = await Linking.canOpenURL(fileUrl);
      if (canOpen) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert(
          'Open File',
          `Would you like to open "${filename || 'this file'}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => Linking.openURL(fileUrl) },
          ]
        );
      }
    } catch (error) {
      logger.error('Error opening file:', error);
      Alert.alert('Error', 'Could not open file. Please try again.');
    }
  }, []);
  
  // Get appropriate icon for file type
  const getFileIcon = (filename?: string): keyof typeof Ionicons.glyphMap => {
    if (!filename) return 'document-outline';
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return 'document-text-outline';
      case 'doc': case 'docx': return 'document-text-outline';
      case 'xls': case 'xlsx': return 'grid-outline';
      case 'ppt': case 'pptx': return 'easel-outline';
      case 'zip': case 'rar': case '7z': return 'archive-outline';
      case 'mp3': case 'wav': case 'aac': return 'musical-notes-outline';
      case 'mp4': case 'mov': case 'avi': return 'videocam-outline';
      case 'txt': return 'document-outline';
      default: return 'document-outline';
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Handle long press on message to show actions
  const handleMessageLongPress = useCallback((message: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedMessage(message);
    setShowMessageActions(true);
    
    // Reset all animations
    backdropAnim.setValue(0);
    menuScaleAnim.setValue(0.9);
    messageActionsAnim.setValue(0);
    actionItemAnims.forEach(anim => anim.setValue(0));
    
    // Staggered entrance animation
    Animated.parallel([
      // Backdrop fade in
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // Menu slide up with spring
      Animated.spring(messageActionsAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
      }),
      // Menu scale up
      Animated.spring(menuScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start(() => {
      // Stagger action items
      const staggerDelay = 50;
      actionItemAnims.forEach((anim, index) => {
        setTimeout(() => {
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }).start();
        }, index * staggerDelay);
      });
    });
  }, [messageActionsAnim, backdropAnim, menuScaleAnim, actionItemAnims]);
  
  // Close message actions menu
  const closeMessageActions = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(messageActionsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuScaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMessageActions(false);
      setSelectedMessage(null);
    });
  }, [messageActionsAnim, backdropAnim, menuScaleAnim]);
  
  // Handle reply to message
  const handleReply = useCallback(() => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      closeMessageActions();
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedMessage, closeMessageActions]);
  
  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);
  
  // Handle adding a reaction to a message
  // Limit: 1 reaction per user per message - will replace existing reaction
  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Optimistic update - add reaction locally (replacing any existing user reaction)
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        let reactions = [...(m.reactions || [])];
        const currentUserId = user?.id;
        
        // First, remove user's previous reaction if any (1 reaction per user limit)
        reactions = reactions.map(r => {
          if (r.hasReacted && r.emoji !== emoji) {
            const newUsers = r.users.filter(u => u.id !== currentUserId);
            if (newUsers.length === 0) {
              return null; // Mark for removal
            }
            return {
              ...r,
              count: newUsers.length,
              hasReacted: false,
              users: newUsers,
            };
          }
          return r;
        }).filter(Boolean) as typeof reactions;
        
        // Now add the new reaction
        const existingIdx = reactions.findIndex(r => r.emoji === emoji);
        
        if (existingIdx >= 0) {
          const existing = reactions[existingIdx];
          if (!existing.hasReacted) {
            reactions[existingIdx] = {
              ...existing,
              count: existing.count + 1,
              hasReacted: true,
              users: [...existing.users, {
                id: currentUserId || '',
                username: user?.username || null,
                display_name: user?.display_name,
                avatar_url: user?.avatar_url,
                status: 'online',
              }],
            };
          }
        } else {
          reactions.push({
            emoji,
            count: 1,
            hasReacted: true,
            users: [{
              id: currentUserId || '',
              username: user?.username || null,
              display_name: user?.display_name,
              avatar_url: user?.avatar_url,
              status: 'online',
            }],
          });
        }
        return { ...m, reactions };
      }));
    } catch (error: any) {
      // 409 means user already has this exact reaction - silently ignore
      if (error?.response?.status !== 409) {
        logger.warn('Error adding reaction:', error?.message || error);
      }
    }
  }, [user]);
  
  // Handle removing a reaction from a message
  const handleRemoveReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await api.delete(`/api/v1/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Optimistic update - remove reaction locally
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const reactions = [...(m.reactions || [])];
        const existingIdx = reactions.findIndex(r => r.emoji === emoji);
        
        if (existingIdx >= 0) {
          const existing = reactions[existingIdx];
          const newUsers = existing.users.filter(u => u.id !== user?.id);
          if (newUsers.length === 0) {
            reactions.splice(existingIdx, 1);
          } else {
            reactions[existingIdx] = {
              ...existing,
              count: newUsers.length,
              hasReacted: false,
              users: newUsers,
            };
          }
        }
        return { ...m, reactions };
      }));
    } catch (error) {
      logger.error('Error removing reaction:', error);
      Alert.alert('Error', 'Failed to remove reaction');
    }
  }, [user?.id]);
  
  // Handle quick reaction from message actions menu
  const handleQuickReaction = useCallback((emoji: string) => {
    if (selectedMessage) {
      const hasReacted = selectedMessage.reactions?.some(
        r => r.emoji === emoji && r.hasReacted
      );
      if (hasReacted) {
        handleRemoveReaction(selectedMessage.id, emoji);
      } else {
        handleAddReaction(selectedMessage.id, emoji);
      }
      closeMessageActions();
    }
  }, [selectedMessage, handleAddReaction, handleRemoveReaction, closeMessageActions]);
  
  // Handle reaction tap on message bubble
  const handleReactionTap = useCallback((messageId: string, emoji: string, hasReacted: boolean) => {
    if (hasReacted) {
      handleRemoveReaction(messageId, emoji);
    } else {
      handleAddReaction(messageId, emoji);
    }
  }, [handleAddReaction, handleRemoveReaction]);
  
  // Open full reaction picker
  const openReactionPicker = useCallback(() => {
    if (selectedMessage) {
      setReactionPickerMessage(selectedMessage);
      closeMessageActions();
      setTimeout(() => setShowReactionPicker(true), 200);
    }
  }, [selectedMessage, closeMessageActions]);
  
  // Close reaction picker
  const closeReactionPicker = useCallback(() => {
    setShowReactionPicker(false);
    setReactionPickerMessage(null);
  }, []);
  
  // Handle pin/unpin message
  const handleTogglePin = useCallback(async () => {
    if (!selectedMessage) return;
    
    const channelTopic = `conversation:${conversationId}`;
    const channel = socketManager.getChannel(channelTopic);
    if (!channel) {
      Alert.alert('Error', 'Not connected to conversation');
      closeMessageActions();
      return;
    }
    
    const isPinned = selectedMessage.is_pinned;
    const event = isPinned ? 'unpin_message' : 'pin_message';
    
    channel.push(event, { message_id: selectedMessage.id })
      .receive('ok', (response: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Update local state with proper pin timestamp from server
        setMessages(prev => prev.map(m => 
          m.id === selectedMessage.id 
            ? { 
                ...m, 
                is_pinned: !isPinned,
                pinned_at: !isPinned ? (response?.pinned_at || new Date().toISOString()) : undefined,
                pinned_by_id: !isPinned ? (response?.pinned_by_id || user?.id) : undefined,
              }
            : m
        ));
      })
      .receive('error', (err: any) => {
        // Extract reason from various error formats
        const reason = typeof err === 'string' ? err : (err?.reason || err?.error || '');
        logger.warn('Pin error:', reason);
        
        let errorMsg = `Failed to ${isPinned ? 'unpin' : 'pin'} message`;
        
        if (reason === 'pin_limit_reached' || reason.includes('limit')) {
          errorMsg = 'You can only pin up to 3 messages. Unpin a message first.';
        } else if (reason === 'already_pinned') {
          errorMsg = 'This message is already pinned.';
        } else if (reason === 'unauthorized' || reason === 'not_authorized') {
          errorMsg = 'You do not have permission to pin messages.';
        } else if (reason === 'not_found') {
          errorMsg = 'Message not found.';
        }
        
        Alert.alert('Pin Error', errorMsg);
      });
    
    closeMessageActions();
  }, [selectedMessage, conversationId, closeMessageActions]);
  
  // Handle unsend/delete message (for everyone)
  const handleUnsend = useCallback(async () => {
    if (!selectedMessage) return;
    
    const isOwnMessage = String(user?.id) === String(selectedMessage.sender_id);
    if (!isOwnMessage) {
      Alert.alert('Error', 'You can only unsend your own messages');
      closeMessageActions();
      return;
    }
    
    Alert.alert(
      'Unsend Message',
      'This message will be deleted for everyone in this conversation. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsend',
          style: 'destructive',
          onPress: () => {
            const channelTopic = `conversation:${conversationId}`;
            const channel = socketManager.getChannel(channelTopic);
            if (!channel) {
              Alert.alert('Error', 'Not connected to conversation');
              return;
            }
            
            channel.push('delete_message', { message_id: selectedMessage.id })
              .receive('ok', () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Track deleted message ID to prevent re-adding
                deletedMessageIdsRef.current.add(selectedMessage.id);
                // Remove from local state
                setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
              })
              .receive('error', (err: any) => {
                logger.error('Failed to unsend message:', err);
                Alert.alert('Error', 'Failed to unsend message');
              });
          }
        }
      ]
    );
    
    closeMessageActions();
  }, [selectedMessage, user?.id, conversationId, closeMessageActions]);
  
  // Handle image picker
  const handlePickImage = async () => {
    // Prevent concurrent picker operations
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }
    
    isPickerActiveRef.current = true;
    logger.debug('Starting image picker...');
    closeAttachMenu();
    
    // Longer delay to ensure modal is fully closed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      logger.debug('Requesting media library permission...');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      logger.debug('Permission result:', permission.granted);
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos to send images.');
        return;
      }
      
      logger.debug('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      logger.debug('Image picker result:', result.canceled ? 'canceled' : `${result.assets?.length} selected`);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add to pending attachments and show preview
        const newAttachments = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image' as const,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        setPendingAttachments(prev => [...prev, ...newAttachments]);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open photo library');
    } finally {
      isPickerActiveRef.current = false;
    }
  };
  
  // Handle camera capture - opens native camera with photo/video toggle (like Telegram)
  const handleTakePhoto = async () => {
    // Prevent concurrent picker operations
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }
    
    isPickerActiveRef.current = true;
    logger.debug('Starting camera...');
    closeAttachMenu();
    
    // Longer delay to ensure modal is fully closed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      logger.debug('Requesting camera permission...');
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      logger.debug('Camera permission:', cameraPermission.granted);
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }
      
      // Note: Microphone permission is automatically requested by the camera when recording video
      // No need to request it separately for expo-image-picker
      
      logger.debug('Launching camera with photo/video support...');
      // Open native camera with BOTH photo and video options - user can switch in camera UI
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'], // Allow both - user decides in native camera
        quality: 0.8,
        videoMaxDuration: 60, // 1 minute max for videos
        videoQuality: 1, // High quality video
      });
      logger.debug('Camera result:', result.canceled ? 'canceled' : 'selected');
      
      if (!result.canceled && result.assets[0]) {
        // Add to pending attachments and show preview
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        logger.debug('Asset type:', asset.type, 'mimeType:', asset.mimeType, 'isVideo:', isVideo);
        setPendingAttachments(prev => [...prev, {
          uri: asset.uri,
          type: isVideo ? 'video' as const : 'image' as const,
          name: asset.fileName || `camera_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          duration: asset.duration ?? undefined,
        }]);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to open camera');
    } finally {
      isPickerActiveRef.current = false;
    }
  };
  
  // Handle document picker
  const handlePickDocument = async () => {
    // Prevent concurrent picker operations
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }
    
    isPickerActiveRef.current = true;
    logger.debug('Starting document picker...');
    closeAttachMenu();
    
    // Longer delay to ensure modal is fully closed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      logger.debug('Launching document picker...');
      // Note: multiple selection disabled - causes issues with bundle files on iOS
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'application/vnd.ms-excel', 'image/*', 'audio/*', 'video/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      logger.debug('Document picker result:', result.canceled ? 'canceled' : 'selected');
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Filter out directory bundles (like .band files)
        if (asset.name?.endsWith('.band') || asset.mimeType === 'application/octet-stream') {
          // Check if it might be a bundle/directory
          Alert.alert('Unsupported File', 'This file type is not supported. Please choose a different file.');
          return;
        }
        // Add single file to pending attachments
        setPendingAttachments(prev => [...prev, {
          uri: asset.uri,
          type: 'file' as const,
          name: asset.name || `file_${Date.now()}`,
          mimeType: asset.mimeType || 'application/octet-stream',
        }]);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to open file picker');
    } finally {
      isPickerActiveRef.current = false;
    }
  };
  
  // Open attachment preview modal
  const openAttachmentPreview = useCallback(() => {
    setShowAttachmentPreview(true);
    Animated.spring(attachmentPreviewAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, [attachmentPreviewAnim]);
  
  // Close attachment preview modal
  const closeAttachmentPreview = useCallback(() => {
    Animated.timing(attachmentPreviewAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowAttachmentPreview(false);
      setPendingAttachments([]);
      setAttachmentCaption('');
    });
  }, [attachmentPreviewAnim]);
  
  // Remove a specific attachment from pending list
  const removeAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingAttachments(prev => {
      const newList = prev.filter((_, i) => i !== index);
      if (newList.length === 0) {
        closeAttachmentPreview();
      }
      return newList;
    });
  };
  
  // Send all pending attachments
  const sendPendingAttachments = async () => {
    if (pendingAttachments.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const caption = attachmentCaption.trim();
    const attachmentsToSend = [...pendingAttachments];
    closeAttachmentPreview();
    setIsSending(true);
    
    try {
      // Separate images, videos, and files
      const images = attachmentsToSend.filter(a => a.type === 'image');
      const videos = attachmentsToSend.filter(a => a.type === 'video');
      const files = attachmentsToSend.filter(a => a.type === 'file');
      
      // Upload all images and collect URLs for grid message
      if (images.length > 0) {
        const uploadedUrls: string[] = [];
        
        for (const image of images) {
          const formData = new FormData();
          const name = image.name || `photo_${Date.now()}.jpg`;
          // Use helper to get correct MIME type from filename, fallback to asset's mimeType or jpeg
          const mimeType = getMimeType(name, image.mimeType || 'image/jpeg');
          
          formData.append('file', {
            uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
            name,
            type: mimeType,
          } as any);
          formData.append('context', 'message');
          
          const response = await api.post('/api/v1/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          });
          
          const fileUrl = response.data?.data?.url || response.data?.url || response.data?.file?.url;
          if (fileUrl) {
            uploadedUrls.push(fileUrl);
          }
        }
        
        // Send all images as a single message with grid metadata
        if (uploadedUrls.length > 0) {
          // Use 'image' content_type for backend compatibility, store grid info in metadata
          const msgPayload = {
            content: caption || `📷 ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`,
            content_type: 'image', // Use standard 'image' type for backend compatibility
            file_url: uploadedUrls[0], // Primary image
            // Store grid_images in link_preview since backend persists it as a :map
            link_preview: uploadedUrls.length > 1 ? {
              grid_images: uploadedUrls,
              image_count: uploadedUrls.length,
            } : undefined,
          };
          logger.debug('Sending message:', JSON.stringify(msgPayload));
          const msgResponse = await api.post(`/api/v1/conversations/${conversationId}/messages`, msgPayload);
          
          const rawMessage = msgResponse.data.data || msgResponse.data.message || msgResponse.data;
          if (__DEV__) {
            logger.debug('Server response metadata:', JSON.stringify(rawMessage?.metadata));
            logger.debug('Message ID:', rawMessage?.id);
          }
          // Don't add message here - let WebSocket handler add it to avoid duplicates
          // The WebSocket broadcast happens server-side before we get the API response
          // So by this point, the message is already added via WebSocket
          if (rawMessage?.id) {
            // Just scroll to show the new message that WebSocket already added
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }
      }
      
      // Send files individually (each as separate message)
      for (const file of files) {
        await uploadAndSendFile(file.uri, file.type, file.name, files.indexOf(file) === 0 ? caption : undefined);
      }
      
      // Send videos individually (each as separate message)
      for (const video of videos) {
        await uploadAndSendFile(video.uri, 'video', video.name, videos.indexOf(video) === 0 && !files.length ? caption : undefined, video.duration);
      }
    } catch (error: any) {
      logger.error('Error sending attachments:', error);
      logger.error('Error response:', error?.response?.data);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to send attachments. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Add more attachments to pending list
  const addMoreAttachments = async () => {
    // Close preview temporarily
    Animated.timing(attachmentPreviewAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(async () => {
      setShowAttachmentPreview(false);
      await handlePickImage();
    });
  };
  
  // Upload and send file as message
  const uploadAndSendFile = async (uri: string, type: 'image' | 'file' | 'video', filename?: string, caption?: string, duration?: number) => {
    setIsSending(true);
    
    try {
      const formData = new FormData();
      const defaultExt = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'bin';
      const name = filename || `${type}_${Date.now()}.${defaultExt}`;
      
      // Use helper for accurate MIME type detection
      const defaultMime = type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'application/octet-stream';
      const mimeType = getMimeType(name, defaultMime);
      
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name,
        type: mimeType,
      } as any);
      formData.append('context', 'message');
      
      logger.debug('Uploading file:', { name, type: mimeType, uri: uri.substring(0, 50) });
      
      const response = await api.post('/api/v1/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for video uploads
      });
      
      logger.debug('Upload response:', JSON.stringify(response.data));
      
      // Extract URL from various response formats
      const fileUrl = response.data?.data?.url || response.data?.url || response.data?.file?.url;
      
      if (fileUrl) {
        // Send message with file attachment
        // Use caption if provided, otherwise default content
        const messageContent = caption || (type === 'image' ? '📷 Photo' : type === 'video' ? '🎥 Video' : `📎 ${name}`);
        const msgPayload: any = {
          content: messageContent,
          content_type: type,
          file_url: fileUrl,
          file_name: name,
          file_mime_type: mimeType,
        };
        
        // Add duration for videos
        if (type === 'video' && duration) {
          msgPayload.metadata = { duration };
        }
        
        const msgResponse = await api.post(`/api/v1/conversations/${conversationId}/messages`, msgPayload);
        
        const rawMessage = msgResponse.data.data || msgResponse.data.message || msgResponse.data;
        if (rawMessage?.id) {
          const normalized = normalizeMessage(rawMessage);
          // Prepend for inverted list (newest first)
          setMessages((prev) => {
            const exists = prev.some(m => m.id === normalized.id);
            if (exists) return prev;
            return [normalized, ...prev];
          });
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
      } else {
        logger.error('No file URL in response:', response.data);
        Alert.alert('Error', 'Upload failed - no file URL returned.');
      }
    } catch (error: any) {
      logger.error('Error uploading file:', error?.response?.data || error?.message || error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to send file. Please try again.';
      Alert.alert('Upload Error', errorMessage);
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
        // Prepend for inverted list (newest first)
        setMessages((prev) => {
          const exists = prev.some(m => m.id === normalized.id);
          if (exists) return prev;
          return [normalized, ...prev];
        });
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      logger.error('Error sending wave:', error);
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
        logger.warn('Invalid date string:', dateString);
        return '';
      }
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      logger.error('Error formatting date:', error);
      return '';
    }
  };

  // Handle assets selected from TelegramAttachmentPicker
  // IMPORTANT: This must be defined BEFORE any early returns to comply with Rules of Hooks
  const handleAttachmentPickerSelect = useCallback((assets: Array<{
    uri: string;
    type: 'image' | 'video' | 'file';
    name?: string;
    mimeType?: string;
    duration?: number;
  }>) => {
    if (assets.length === 0) return;
    
    const newAttachments = assets.map(asset => ({
      uri: asset.uri,
      type: asset.type,
      name: asset.name,
      mimeType: asset.mimeType,
      duration: asset.duration,
    }));
    
    setPendingAttachments(prev => [...prev, ...newAttachments]);
    openAttachmentPreview();
  }, [openAttachmentPreview]);
  
  // Extracted message content renderer - must be defined before renderMessage
  const renderMessageContent = useCallback((item: Message, isOwnMessage: boolean, senderDisplayName: string) => {
    return (
      <>
        {/* Reply preview if this message is a reply */}
        {item.reply_to && (
          <View style={[
            styles.replyContainer,
            { 
              backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
              borderLeftColor: isOwnMessage ? 'rgba(255,255,255,0.5)' : colors.primary
            }
          ]}>
            <Text style={[styles.replyAuthor, { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : colors.primary }]} numberOfLines={1}>
              {item.reply_to.sender?.display_name || item.reply_to.sender?.username || 'Unknown'}
            </Text>
            <Text 
              style={[styles.replyText, { color: isOwnMessage ? 'rgba(255,255,255,0.75)' : colors.textSecondary }]} 
              numberOfLines={2}
            >
              {item.reply_to.content || (item.reply_to.type === 'image' ? '📷 Photo' : item.reply_to.type === 'file' ? '📎 File' : 'Message')}
            </Text>
          </View>
        )}
        {/* Image Grid messages - multiple photos in one message (check FIRST before single image) */}
        {item.type === 'image' && item.metadata?.grid_images && Array.isArray(item.metadata.grid_images) && item.metadata.grid_images.length > 0 && (
          <View style={styles.imageGrid}>
            {(() => {
              const images = item.metadata.grid_images as string[];
              const count = images.length;
              
              // Calculate grid layout based on image count
              const gridStyle = count === 1 ? styles.imageGridSingle :
                               count === 2 ? styles.imageGridTwo :
                               count === 3 ? styles.imageGridThree :
                               count === 4 ? styles.imageGridFour :
                               styles.imageGridMany;
              
              return (
                <View style={gridStyle}>
                  {images.slice(0, 4).map((imgUrl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.9}
                      onPress={() => handleImagePress(imgUrl, images, idx)}
                      style={[
                        styles.gridImageContainer,
                        count === 1 && styles.gridImageFull,
                        count === 2 && styles.gridImageHalf,
                        count === 3 && (idx === 0 ? styles.gridImageThreeMain : styles.gridImageThreeSide),
                        count >= 4 && styles.gridImageQuarter,
                      ]}
                    >
                      <Image
                        source={{ uri: imgUrl }}
                        style={styles.gridImage}
                        resizeMode="cover"
                      />
                      {/* Show "+X more" overlay on 4th image if more than 4 */}
                      {idx === 3 && count > 4 && (
                        <View style={styles.gridMoreOverlay}>
                          <Text style={styles.gridMoreText}>+{count - 4}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}
            {/* Photo count badge */}
            {(item.metadata.grid_images as string[]).length > 1 && (
              <View style={styles.imageGridBadge}>
                <Ionicons name="images" size={12} color="#fff" />
                <Text style={styles.imageGridBadgeText}>{(item.metadata.grid_images as string[]).length}</Text>
              </View>
            )}
          </View>
        )}
        {/* Single Image messages (only if NOT a grid) */}
        {item.type === 'image' && item.metadata?.url && !item.metadata?.grid_images && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => handleImagePress(item.metadata!.url!)}
          >
            <Image
              source={{ uri: item.metadata.url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.9)" />
            </View>
          </TouchableOpacity>
        )}
        {/* File messages */}
        {item.type === 'file' && item.metadata?.url && (
          <TouchableOpacity 
            style={[styles.fileAttachment, { backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.15)' : colors.input }]}
            onPress={() => handleFilePress(item.metadata!.url!, item.metadata?.filename)}
            activeOpacity={0.7}
          >
            <View style={[styles.fileIconContainer, { backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }]}>
              <Ionicons name={getFileIcon(item.metadata?.filename)} size={20} color={isOwnMessage ? '#fff' : colors.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={{ color: isOwnMessage ? '#fff' : colors.text, fontWeight: '600' }} numberOfLines={1}>
                {item.metadata.filename || 'File'}
              </Text>
              {item.metadata.size && (
                <Text style={{ color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {formatFileSize(item.metadata.size)}
                </Text>
              )}
            </View>
            <Ionicons name="download-outline" size={20} color={isOwnMessage ? 'rgba(255,255,255,0.8)' : colors.textSecondary} />
          </TouchableOpacity>
        )}
        {/* Video messages */}
        {item.type === 'video' && item.metadata?.url && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => handleVideoPress(item.metadata!.url!, item.metadata?.duration)}
            style={styles.videoMessageContainer}
          >
            {/* Video thumbnail - use url as poster or show placeholder */}
            {item.metadata.thumbnail ? (
              <Image
                source={{ uri: item.metadata.thumbnail }}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.videoThumbnail, styles.videoPlaceholder]}>
                <Ionicons name="videocam" size={40} color="rgba(255,255,255,0.8)" />
              </View>
            )}
            {/* Play button overlay */}
            <View style={styles.videoPlayOverlayMessage}>
              <View style={styles.videoPlayButtonMessage}>
                <Ionicons name="play" size={32} color="#fff" />
              </View>
            </View>
            {/* Duration badge */}
            {item.metadata.duration && (
              <View style={styles.videoDurationBadgeMessage}>
                <Text style={styles.videoDurationTextMessage}>
                  {Math.floor(item.metadata.duration / 60)}:{String(Math.floor(item.metadata.duration % 60)).padStart(2, '0')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
              { color: isOwnMessage ? 'rgba(255,255,255,0.75)' : colors.textTertiary },
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
                color="rgba(255,255,255,0.75)"
                style={styles.messageStatusIcon}
              />
            );
          })()}
        </View>
        {/* Reactions display with animations */}
        {item.reactions && item.reactions.length > 0 && (
          <View style={[
            styles.reactionsContainer,
            isOwnMessage ? styles.reactionsOwn : styles.reactionsOther
          ]}>
            {item.reactions.map((reaction, index) => (
              <AnimatedReactionBubble
                key={`${reaction.emoji}-${index}`}
                reaction={reaction}
                isOwnMessage={isOwnMessage}
                onPress={() => handleReactionTap(item.id, reaction.emoji, reaction.hasReacted)}
                colors={colors}
              />
            ))}
          </View>
        )}
      </>
    );
  }, [colors, handleImagePress, handleFilePress, getFileIcon, formatFileSize, formatTime, getMessageStatus, handleReactionTap]);
  
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    // Skip rendering messages without proper ID or that appear empty/invalid
    if (!item.id) {
      if (__DEV__) {
        logger.debug('Skipping message without ID');
      }
      return null;
    }
    
    // Skip messages without valid sender info (ghost messages)
    const hasSender = item.sender_id || item.sender?.id;
    if (!hasSender) {
      if (__DEV__) {
        logger.debug('Skipping message without sender:', item.id);
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
        logger.debug('Skipping empty/invalid message:', item.id, { 
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
    
    // Check if this is a new message for entrance animation
    const isNewMessage = newMessageIds.has(item.id);
    
    return (
      <AnimatedMessageWrapper 
        isOwnMessage={isOwnMessage} 
        index={0}
        isNew={isNewMessage}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => handleMessageLongPress(item)}
          delayLongPress={400}
        >
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
            {/* Pin indicator */}
            {item.is_pinned && (
              <View style={styles.pinnedIndicator}>
                <Ionicons name="pin" size={12} color={colors.primary} />
              </View>
            )}
            {isOwnMessage ? (
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.messageBubble,
                  styles.ownMessageBubble,
                  item.is_pinned && styles.pinnedBubble,
                ]}
              >
                {renderMessageContent(item, isOwnMessage, senderDisplayName)}
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.messageBubble,
                  styles.otherMessageBubble,
                  { backgroundColor: colors.surface },
                  item.is_pinned && styles.pinnedBubble,
                ]}
              >
                {renderMessageContent(item, isOwnMessage, senderDisplayName)}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </AnimatedMessageWrapper>
    );
  }, [user?.id, colors, handleMessageLongPress, renderMessageContent, newMessageIds]);
  
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

  // Message Actions Menu Component - Modern Discord/Telegram style
  const MessageActionsMenu = () => {
    if (!showMessageActions || !selectedMessage) return null;
    
    const isOwnMessage = String(user?.id) === String(selectedMessage.sender_id);
    const isPinned = selectedMessage.is_pinned;
    
    // Check which quick reactions the user has already used on this message
    const getReactionState = (emoji: string) => {
      return selectedMessage.reactions?.some(r => r.emoji === emoji && r.hasReacted) || false;
    };
    
    // Define action items
    const actionItems = [
      {
        id: 'reply',
        icon: 'arrow-undo',
        label: 'Reply',
        color: '#3b82f6',
        gradient: ['#3b82f6', '#60a5fa'],
        onPress: handleReply,
        visible: true,
      },
      {
        id: 'copy',
        icon: 'copy-outline',
        label: 'Copy',
        color: '#8b5cf6',
        gradient: ['#8b5cf6', '#a78bfa'],
        onPress: async () => {
          // Copy message content to clipboard
          if (selectedMessage.content) {
            await Clipboard.setStringAsync(selectedMessage.content);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          closeMessageActions();
        },
        visible: !!selectedMessage.content,
      },
      {
        id: 'pin',
        icon: isPinned ? 'pin-outline' : 'pin',
        label: isPinned ? 'Unpin' : 'Pin',
        color: isPinned ? '#f59e0b' : '#10b981',
        gradient: isPinned ? ['#f59e0b', '#fbbf24'] : ['#10b981', '#34d399'],
        onPress: handleTogglePin,
        visible: true,
      },
      {
        id: 'delete',
        icon: 'trash-outline',
        label: 'Unsend',
        color: '#ef4444',
        gradient: ['#ef4444', '#f87171'],
        onPress: handleUnsend,
        visible: isOwnMessage,
        danger: true,
      },
    ].filter(item => item.visible);
    
    const slideUp = messageActionsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [400, 0],
    });
    
    const backdropOpacity = backdropAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    
    // Render a pressable action item with animation
    const renderActionItem = (item: typeof actionItems[0], index: number) => {
      const itemAnim = actionItemAnims[index] || new Animated.Value(1);
      const translateY = itemAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0],
      });
      const itemOpacity = itemAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });
      
      return (
        <Animated.View
          key={item.id}
          style={{
            transform: [{ translateY }],
            opacity: itemOpacity,
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              item.onPress();
            }}
            style={({ pressed }) => [
              styles.modernActionItem,
              { 
                backgroundColor: pressed 
                  ? (item.danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)')
                  : 'rgba(255, 255, 255, 0.04)',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={[
              styles.modernActionIconWrap,
              { backgroundColor: `${item.color}18` }
            ]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={[
              styles.modernActionLabel,
              { color: item.danger ? item.color : colors.text }
            ]}>
              {item.label}
            </Text>
            <View style={styles.modernActionArrow}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </Pressable>
        </Animated.View>
      );
    };
    
    return (
      <Modal
        visible={showMessageActions}
        transparent
        animationType="none"
        onRequestClose={closeMessageActions}
        statusBarTranslucent
      >
        <View style={styles.modernActionsOverlay}>
          {/* Animated blur backdrop */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
            <BlurView 
              intensity={Platform.OS === 'ios' ? 40 : 100} 
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <Pressable 
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
              onPress={closeMessageActions}
            />
          </Animated.View>
          
          {/* Centered content area */}
          <View style={styles.modernActionsContent}>
            {/* Message Preview Card */}
            <Animated.View style={[
              styles.modernMessagePreview,
              { 
                backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                transform: [
                  { translateY: slideUp },
                  { scale: menuScaleAnim }
                ],
                opacity: backdropOpacity,
              }
            ]}>
              <View style={styles.modernPreviewHeader}>
                <View style={[styles.modernPreviewAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.modernPreviewAvatarText}>
                    {(selectedMessage.sender?.display_name || selectedMessage.sender?.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modernPreviewMeta}>
                  <Text style={[styles.modernPreviewName, { color: colors.text }]} numberOfLines={1}>
                    {selectedMessage.sender?.display_name || selectedMessage.sender?.username || 'Unknown'}
                  </Text>
                  <Text style={[styles.modernPreviewTime, { color: colors.textSecondary }]}>
                    {new Date(selectedMessage.inserted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {isPinned && (
                  <View style={[styles.modernPinnedBadge, { backgroundColor: '#f59e0b20' }]}>
                    <Ionicons name="pin" size={12} color="#f59e0b" />
                  </View>
                )}
              </View>
              
              {/* Message content preview */}
              <View style={styles.modernPreviewBody}>
                {selectedMessage.type === 'image' && selectedMessage.metadata?.url ? (
                  <View style={styles.modernPreviewImageWrap}>
                    <Image 
                      source={{ uri: selectedMessage.metadata.url }}
                      style={styles.modernPreviewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.modernPreviewImageOverlay}>
                      <Ionicons name="image" size={16} color="#fff" />
                      <Text style={styles.modernPreviewImageText}>Photo</Text>
                    </View>
                  </View>
                ) : selectedMessage.type === 'file' ? (
                  <View style={[styles.modernPreviewFile, { backgroundColor: colors.surfaceHover }]}>
                    <Ionicons name="document-outline" size={20} color={colors.primary} />
                    <Text style={[styles.modernPreviewFileText, { color: colors.text }]} numberOfLines={1}>
                      {selectedMessage.metadata?.filename || 'File'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.modernPreviewText, { color: colors.text }]} numberOfLines={3}>
                    {selectedMessage.content || 'Message'}
                  </Text>
                )}
              </View>
              
              {/* Quick Reactions Bar */}
              <View style={styles.quickReactionsBar}>
                {QUICK_REACTIONS.map((emoji) => {
                  const hasReacted = getReactionState(emoji);
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.quickReactionBtn,
                        { 
                          backgroundColor: hasReacted 
                            ? colors.primary + '25' 
                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                          borderColor: hasReacted ? colors.primary : 'transparent',
                          borderWidth: hasReacted ? 1.5 : 0,
                        }
                      ]}
                      onPress={() => handleQuickReaction(emoji)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.quickReactionBtn,
                    styles.quickReactionMore,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                  ]}
                  onPress={openReactionPicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
            
            {/* Action Menu Card */}
            <Animated.View style={[
              styles.modernActionsCard,
              { 
                backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                transform: [
                  { translateY: slideUp },
                  { scale: menuScaleAnim }
                ],
                opacity: backdropOpacity,
              }
            ]}>
              <View style={styles.modernActionsHeader}>
                <View style={[styles.modernActionsHandle, { backgroundColor: colors.border }]} />
                <Text style={[styles.modernActionsTitle, { color: colors.textSecondary }]}>
                  MESSAGE OPTIONS
                </Text>
              </View>
              
              <View style={styles.modernActionsList}>
                {actionItems.map((item, index) => renderActionItem(item, index))}
              </View>
            </Animated.View>
            
            {/* Cancel Button */}
            <Animated.View style={[
              { 
                transform: [
                  { translateY: slideUp },
                  { scale: menuScaleAnim }
                ],
                opacity: backdropOpacity,
              }
            ]}>
              <Pressable
                onPress={closeMessageActions}
                style={({ pressed }) => [
                  styles.modernCancelButton,
                  { 
                    backgroundColor: isDark 
                      ? (pressed ? 'rgba(50, 50, 55, 0.98)' : 'rgba(40, 40, 45, 0.95)')
                      : (pressed ? 'rgba(240, 240, 245, 0.98)' : 'rgba(255, 255, 255, 0.95)'),
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  }
                ]}
              >
                <Text style={[styles.modernCancelText, { color: colors.primary }]}>
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Modal>
    );
  };

  // Full Emoji Reaction Picker Modal
  const ReactionPickerModal = () => {
    if (!showReactionPicker || !reactionPickerMessage) return null;
    
    const categoryKeys = Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[];
    const emojis = EMOJI_CATEGORIES[selectedEmojiCategory];
    
    // Check if user has already reacted with an emoji
    const hasReacted = (emoji: string) => {
      return reactionPickerMessage.reactions?.some(r => r.emoji === emoji && r.hasReacted) || false;
    };
    
    return (
      <Modal
        visible={showReactionPicker}
        transparent
        animationType="slide"
        onRequestClose={closeReactionPicker}
        statusBarTranslucent
      >
        <View style={styles.reactionPickerOverlay}>
          <Pressable 
            style={styles.reactionPickerBackdrop}
            onPress={closeReactionPicker}
          />
          <View style={[
            styles.reactionPickerContainer,
            { backgroundColor: isDark ? '#1a1a2e' : '#ffffff' }
          ]}>
            {/* Header */}
            <View style={styles.reactionPickerHeader}>
              <View style={[styles.reactionPickerHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.reactionPickerTitle, { color: colors.text }]}>
                😊 Add Reaction
              </Text>
              <TouchableOpacity
                style={styles.reactionPickerClose}
                onPress={closeReactionPicker}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Category tabs */}
            <View style={styles.emojiCategoryTabs}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categoryKeys}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.emojiCategoryTab,
                      selectedEmojiCategory === item && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary,
                      }
                    ]}
                    onPress={() => setSelectedEmojiCategory(item)}
                  >
                    <Text style={[
                      styles.emojiCategoryLabel,
                      { color: selectedEmojiCategory === item ? colors.primary : colors.textSecondary }
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.emojiCategoryTabsContent}
              />
            </View>
            
            {/* Emoji grid */}
            <ScrollView 
              style={styles.emojiScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.emojiGrid}>
                {emojis.map((emoji, index) => {
                  const reacted = hasReacted(emoji);
                  return (
                    <TouchableOpacity
                      key={`${emoji}-${index}`}
                      style={[
                        styles.emojiGridItem,
                        reacted && {
                          backgroundColor: colors.primary + '20',
                          borderColor: colors.primary,
                          borderWidth: 1,
                        }
                      ]}
                      onPress={() => {
                        if (reacted) {
                          handleRemoveReaction(reactionPickerMessage.id, emoji);
                        } else {
                          handleAddReaction(reactionPickerMessage.id, emoji);
                        }
                        closeReactionPicker();
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.emojiGridEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Telegram-style Attachment Picker */}
      <TelegramAttachmentPicker
        visible={showAttachMenu}
        onClose={closeAttachMenu}
        onSelectAssets={handleAttachmentPickerSelect}
        maxSelection={10}
      />
      <MessageActionsMenu />
      <ReactionPickerModal />
      
      {/* Attachment Preview Modal */}
      <Modal
        visible={showAttachmentPreview}
        transparent
        animationType="none"
        onRequestClose={closeAttachmentPreview}
        statusBarTranslucent
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View 
            style={[
              styles.attachmentPreviewContainer,
              { 
                opacity: attachmentPreviewAnim,
                backgroundColor: 'rgba(0,0,0,0.95)'
              }
            ]}
          >
            {/* Header */}
            <View style={styles.attachmentPreviewHeader}>
              <TouchableOpacity 
                onPress={closeAttachmentPreview}
                style={styles.attachmentPreviewCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.attachmentPreviewTitle}>
                {pendingAttachments.length} {pendingAttachments.length === 1 ? 'item' : 'items'} selected
              </Text>
              <TouchableOpacity 
                onPress={addMoreAttachments}
                style={styles.attachmentPreviewAddBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Preview Area */}
            <ScrollView 
              style={styles.attachmentPreviewScroll}
              contentContainerStyle={styles.attachmentPreviewContent}
              horizontal={pendingAttachments.length > 1}
              pagingEnabled={pendingAttachments.length > 1}
              showsHorizontalScrollIndicator={pendingAttachments.length > 1}
            >
              {pendingAttachments.map((attachment, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.attachmentPreviewItem,
                    pendingAttachments.length > 1 && { width: SCREEN_WIDTH - 40 },
                    { transform: [{ scale: attachmentPreviewAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })}]}
                  ]}
                >
                  {/* Remove button */}
                  <TouchableOpacity 
                    style={styles.attachmentRemoveBtn}
                    onPress={() => removeAttachment(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.attachmentRemoveBtnInner}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  
                  {attachment.type === 'image' ? (
                    <Image 
                      source={{ uri: attachment.uri }}
                      style={styles.attachmentPreviewImage}
                      resizeMode="contain"
                    />
                  ) : attachment.type === 'video' ? (
                    <AttachmentVideoPreview 
                      uri={attachment.uri}
                      duration={attachment.duration}
                    />
                  ) : (
                    <View style={styles.attachmentPreviewFile}>
                      <View style={[styles.attachmentPreviewFileIcon, { backgroundColor: colors.primary }]}>
                        <Ionicons 
                          name={
                            attachment.mimeType?.includes('pdf') ? 'document-text' :
                            attachment.mimeType?.includes('word') ? 'document' :
                            attachment.mimeType?.includes('sheet') || attachment.mimeType?.includes('excel') ? 'grid' :
                            'document-attach'
                          } 
                          size={48} 
                          color="#fff" 
                        />
                      </View>
                      <Text style={styles.attachmentPreviewFileName} numberOfLines={2}>
                        {attachment.name}
                      </Text>
                      <Text style={styles.attachmentPreviewFileType}>
                        {attachment.mimeType?.split('/').pop()?.toUpperCase() || 'FILE'}
                      </Text>
                    </View>
                  )}
                  
                  {/* Index indicator for multiple attachments */}
                  {pendingAttachments.length > 1 && (
                    <View style={styles.attachmentIndexBadge}>
                      <Text style={styles.attachmentIndexText}>{index + 1}/{pendingAttachments.length}</Text>
                    </View>
                  )}
                </Animated.View>
              ))}
            </ScrollView>
            
            {/* Bottom: Caption input + Send button */}
            <View style={[styles.attachmentPreviewFooter, { backgroundColor: colors.surface }]}>
              <View style={[styles.attachmentCaptionContainer, { backgroundColor: colors.background }]}>
                <TextInput
                  style={[styles.attachmentCaptionInput, { color: colors.text }]}
                  placeholder="Add a caption..."
                  placeholderTextColor={colors.textSecondary}
                  value={attachmentCaption}
                  onChangeText={setAttachmentCaption}
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity 
                style={[styles.attachmentSendBtn, { backgroundColor: colors.primary }]}
                onPress={sendPendingAttachments}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent
        animationType="none"
        onRequestClose={closeImageViewer}
        statusBarTranslucent
      >
        <Animated.View 
          style={[
            styles.imageViewerContainer,
            { opacity: imageViewerAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.imageViewerBackdrop}
            activeOpacity={1}
            onPress={closeImageViewer}
          />
          <Animated.View 
            style={[
              styles.imageViewerContent,
              { 
                transform: [{ scale: imageScaleAnim }],
                opacity: imageViewerAnim 
              }
            ]}
          >
            {imageGallery.length > 1 ? (
              /* Swipeable gallery for multiple images */
              <FlatList
                ref={imageGalleryRef}
                data={imageGallery}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={currentImageIndex}
                getItemLayout={(_, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                onScroll={(e) => {
                  // Update page number in real-time during scroll
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < imageGallery.length) {
                    setCurrentImageIndex(newIndex);
                    setSelectedImage(imageGallery[newIndex]);
                  }
                }}
                scrollEventThrottle={16}
                keyExtractor={(item, index) => `gallery-${index}-${item}`}
                renderItem={({ item }) => (
                  <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={{ uri: item }}
                      style={styles.fullscreenImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
            ) : selectedImage && (
              /* Single image view */
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </Animated.View>
          
          {/* Image counter for gallery */}
          {imageGallery.length > 1 && (
            <View style={styles.imageCounterContainer}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {imageGallery.length}
              </Text>
            </View>
          )}
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.imageViewerCloseBtn}
            onPress={closeImageViewer}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <View style={styles.imageViewerCloseBtnInner}>
              <Ionicons name="close" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          
          {/* Action buttons */}
          <Animated.View 
            style={[
              styles.imageViewerActions,
              { opacity: imageViewerAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.imageViewerActionBtn}
              onPress={() => {
                if (selectedImage) {
                  Linking.openURL(selectedImage);
                }
              }}
            >
              <Ionicons name="download-outline" size={22} color="#fff" />
              <Text style={styles.imageViewerActionText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.imageViewerActionBtn}
              onPress={() => {
                if (selectedImage) {
                  // Share functionality could be added here
                  Alert.alert('Share', 'Sharing will be available soon!');
                }
              }}
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
              <Text style={styles.imageViewerActionText}>Share</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
      
      {/* Full-screen Video Player Modal */}
      <Modal
        visible={showVideoPlayer}
        transparent
        animationType="fade"
        onRequestClose={closeVideoPlayer}
        statusBarTranslucent
      >
        <View style={styles.videoPlayerContainer}>
          <TouchableOpacity 
            style={styles.videoPlayerBackdrop}
            activeOpacity={1}
            onPress={closeVideoPlayer}
          />
          <View style={styles.videoPlayerContent}>
            {selectedVideoUrl && (
              <VideoPlayerComponent
                videoUrl={selectedVideoUrl}
                duration={selectedVideoDuration}
                onClose={closeVideoPlayer}
              />
            )}
          </View>
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.videoPlayerCloseBtn}
            onPress={closeVideoPlayer}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <View style={styles.videoPlayerCloseBtnInner}>
              <Ionicons name="close" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      
      {/* Pinned Messages Bar */}
      {currentPinnedMessage && (
        <TouchableOpacity
          style={[styles.pinnedBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
          onPress={() => scrollToMessage(currentPinnedMessage.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.pinnedBarIndicator, { backgroundColor: colors.primary }]} />
          <Ionicons name="pin" size={16} color={colors.primary} style={styles.pinnedBarIcon} />
          <View style={styles.pinnedBarContent}>
            <View style={styles.pinnedBarHeader}>
              <Text style={[styles.pinnedBarLabel, { color: colors.primary }]}>
                Pinned Message
                {pinnedMessages.length > 1 && ` (${currentPinnedIndex + 1}/${pinnedMessages.length})`}
              </Text>
            </View>
            <Text 
              style={[styles.pinnedBarText, { color: colors.textSecondary }]} 
              numberOfLines={1}
            >
              {currentPinnedMessage.content || 
                (currentPinnedMessage.type === 'image' ? 'Photo' : 
                 currentPinnedMessage.type === 'voice' ? 'Voice message' : 
                 currentPinnedMessage.type === 'file' ? 'File' : 'Message')}
            </Text>
          </View>
          {pinnedMessages.length > 1 && (
            <View style={styles.pinnedBarNav}>
              <TouchableOpacity
                onPress={() => navigatePinnedMessages('prev')}
                style={styles.pinnedBarNavBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigatePinnedMessages('next')}
                style={styles.pinnedBarNavBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      )}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
        inverted={true}
        ListEmptyComponent={EmptyConversation}
        onScrollToIndexFailed={(info) => {
          // Handle scroll to index failure by scrolling to approximate offset
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
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
      
      {/* Reply preview bar */}
      {replyingTo && (
        <View style={[styles.replyPreviewBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={[styles.replyPreviewLine, { backgroundColor: colors.primary }]} />
          <View style={styles.replyPreviewContent}>
            <Text style={[styles.replyPreviewLabel, { color: colors.primary }]}>
              Replying to {replyingTo.sender?.display_name || replyingTo.sender?.username || 'User'}
            </Text>
            <Text style={[styles.replyPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
              {replyingTo.content || (replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'voice' ? '🎤 Voice message' : '📎 File')}
            </Text>
          </View>
          <TouchableOpacity onPress={cancelReply} style={styles.replyPreviewClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
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
            ref={inputRef}
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder={replyingTo ? "Reply..." : "Message..."}
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            maxLength={4000}
          />
          
          {/* Toggle between mic and send based on input text */}
          {inputText.trim() ? (
            <Animated.View style={{ transform: [{ scale: sendButtonAnim }] }}>
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={sendMessage}
                disabled={isSending}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>
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
    paddingBottom: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '82%',
    paddingHorizontal: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatarSmall: {
    width: 34,
    height: 34,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  messageImage: {
    width: 240,
    height: 180,
    borderRadius: 16,
    marginBottom: 6,
  },
  // Image grid styles for multi-photo messages
  imageGrid: {
    marginBottom: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageGridSingle: {
    width: 240,
    height: 180,
  },
  imageGridTwo: {
    width: 240,
    height: 120,
    flexDirection: 'row',
    gap: 2,
  },
  imageGridThree: {
    width: 240,
    height: 160,
    flexDirection: 'row',
    gap: 2,
  },
  imageGridFour: {
    width: 240,
    height: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  imageGridMany: {
    width: 240,
    height: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridImageContainer: {
    overflow: 'hidden',
  },
  gridImageFull: {
    width: '100%',
    height: '100%',
  },
  gridImageHalf: {
    width: 119,
    height: '100%',
  },
  gridImageThreeMain: {
    width: 159,
    height: '100%',
  },
  gridImageThreeSide: {
    width: 79,
    height: 79,
  },
  gridImageQuarter: {
    width: 119,
    height: 79,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridMoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridMoreText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  imageGridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageGridBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 14,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 10,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: 16,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginLeft: -8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    gap: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotPulse: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  // Header action buttons
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  // Image Viewer Modal styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  imageViewerContent: {
    width: SCREEN_WIDTH,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH - 20,
    height: '100%',
    borderRadius: 8,
  },
  imageCounterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  imageViewerCloseBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerActions: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    flexDirection: 'row',
    gap: 40,
  },
  imageViewerActionBtn: {
    alignItems: 'center',
    padding: 12,
  },
  imageViewerActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  // Modern Message Actions Menu styles
  modernActionsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modernActionsContent: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 10,
  },
  modernMessagePreview: {
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modernPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modernPreviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernPreviewAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modernPreviewMeta: {
    flex: 1,
    marginLeft: 10,
  },
  modernPreviewName: {
    fontSize: 14,
    fontWeight: '600',
  },
  modernPreviewTime: {
    fontSize: 11,
    marginTop: 1,
  },
  modernPinnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernPreviewBody: {
    marginTop: 2,
  },
  modernPreviewText: {
    fontSize: 15,
    lineHeight: 21,
  },
  modernPreviewImageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
    position: 'relative',
  },
  modernPreviewImage: {
    width: '100%',
    height: '100%',
  },
  modernPreviewImageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  modernPreviewImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  modernPreviewFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  modernPreviewFileText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  modernActionsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modernActionsHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  modernActionsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  modernActionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  modernActionsList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  modernActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  modernActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernActionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  modernActionArrow: {
    opacity: 0.4,
  },
  modernCancelButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modernCancelText: {
    fontSize: 17,
    fontWeight: '600',
  },
  // Legacy Message Actions styles (keep for compatibility)
  messageActionsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  messageActionsList: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  messageActionsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  messageActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  messageActionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageActionCancel: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  messageActionCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Pinned message indicator
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  pinnedIndicatorText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinnedBubble: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  // Reply preview bar styles
  replyPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  replyPreviewLine: {
    width: 3,
    height: '100%',
    minHeight: 36,
    borderRadius: 2,
    marginRight: 10,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 13,
    opacity: 0.8,
  },
  replyPreviewClose: {
    padding: 8,
    marginLeft: 8,
  },
  // Reply display in message bubble
  replyContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    opacity: 0.8,
  },
  // Reactions display styles
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  reactionsOwn: {
    justifyContent: 'flex-end',
  },
  reactionsOther: {
    justifyContent: 'flex-start',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Quick reactions bar in message actions
  quickReactionsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    marginTop: 12,
  },
  quickReactionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionEmoji: {
    fontSize: 22,
  },
  quickReactionMore: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderStyle: 'dashed',
  },
  // Full reaction picker modal styles
  reactionPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  reactionPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  reactionPickerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  reactionPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reactionPickerHandle: {
    position: 'absolute',
    top: 8,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  reactionPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  reactionPickerClose: {
    position: 'absolute',
    top: 12,
    right: 16,
    padding: 4,
  },
  emojiCategoryTabs: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  emojiCategoryTabsContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  emojiCategoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emojiCategoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  emojiScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'flex-start',
  },
  emojiGridItem: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emojiGridEmoji: {
    fontSize: 26,
  },
  // Pinned message bar styles
  pinnedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pinnedBarIndicator: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginRight: 10,
    minHeight: 32,
  },
  pinnedBarIcon: {
    marginRight: 8,
  },
  pinnedBarContent: {
    flex: 1,
    marginRight: 8,
  },
  pinnedBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedBarLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pinnedBarText: {
    fontSize: 14,
    marginTop: 2,
  },
  pinnedBarNav: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  pinnedBarNavBtn: {
    padding: 2,
  },
  // Attachment preview styles
  attachmentPreviewContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  attachmentPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  attachmentPreviewCloseBtn: {
    padding: 8,
  },
  attachmentPreviewTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  attachmentPreviewAddBtn: {
    padding: 8,
  },
  attachmentPreviewScroll: {
    flex: 1,
  },
  attachmentPreviewContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  attachmentPreviewItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  attachmentRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  attachmentRemoveBtnInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentPreviewImage: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 12,
  },
  attachmentPreviewVideoContainer: {
    position: 'relative',
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT * 0.5,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentPreviewFile: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    width: SCREEN_WIDTH - 80,
  },
  attachmentPreviewFileIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  attachmentPreviewFileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  attachmentPreviewFileType: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  attachmentIndexBadge: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  attachmentIndexText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentPreviewFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 34,
    gap: 12,
  },
  attachmentCaptionContainer: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  attachmentCaptionInput: {
    fontSize: 16,
    maxHeight: 76,
  },
  attachmentSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Video message styles
  videoMessageContainer: {
    width: 260,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
  },
  videoPlayOverlayMessage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayButtonMessage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  videoDurationBadgeMessage: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  videoDurationTextMessage: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Video player modal styles
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  videoPlayerContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayPauseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayPauseBtnInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  videoProgressContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  videoProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  videoTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  videoPlayerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  videoPlayerCloseBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
