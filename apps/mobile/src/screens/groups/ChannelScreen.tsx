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
import { GroupsStackParamList, Message, Channel } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'Channel'>;
  route: RouteProp<GroupsStackParamList, 'Channel'>;
};

export default function ChannelScreen({ navigation, route }: Props) {
  const { groupId, channelId } = route.params;
  const { colors } = useTheme();
  const { user: _user } = useAuth();
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    fetchChannel();
    fetchMessages();
    joinChannel();
    
    return () => {
      socketManager.leaveChannel(`group:${groupId}:channel:${channelId}`);
    };
  }, [groupId, channelId]);
  
  const fetchChannel = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/channels/${channelId}`);
      const channelData = response.data.data;
      setChannel(channelData);
      navigation.setOptions({ title: `#${channelData.name}` });
    } catch (error) {
      console.error('Error fetching channel:', error);
    }
  };
  
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/channels/${channelId}/messages`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const joinChannel = () => {
    const phoenixChannel = socketManager.joinChannel(`group:${groupId}:channel:${channelId}`);
    if (phoenixChannel) {
      phoenixChannel.on('new_message', (payload: unknown) => {
        const data = payload as { message: Message };
        setMessages((prev) => [...prev, data.message]);
      });
    }
  };
  
  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;
    
    setIsSending(true);
    setInputText('');
    
    try {
      const response = await api.post(`/groups/${groupId}/channels/${channelId}/messages`, {
        content,
      });
      setMessages((prev) => [...prev, response.data.data]);
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
  
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isGrouped = prevMessage?.sender_id === item.sender_id;
    
    return (
      <View style={[styles.messageContainer, !isGrouped && styles.messageWithAvatar]}>
        {!isGrouped && (
          <View style={styles.messageSender}>
            <View style={styles.avatarSmall}>
              {item.sender.avatar_url ? (
                <Image source={{ uri: item.sender.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {item.sender.username?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.senderName, { color: colors.text }]}>
              {item.sender.display_name || item.sender.username}
            </Text>
            <Text style={[styles.messageTime, { color: colors.textTertiary }]}>
              {formatTime(item.inserted_at)}
            </Text>
          </View>
        )}
        <View style={[styles.messageContent, !isGrouped && styles.messageContentWithAvatar]}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }, [messages, colors]);
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
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
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
          placeholder={`Message #${channel?.name || 'channel'}`}
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
    marginBottom: 2,
  },
  messageWithAvatar: {
    marginTop: 16,
  },
  messageSender: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
  },
  messageContent: {
    paddingLeft: 0,
  },
  messageContentWithAvatar: {
    paddingLeft: 44,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
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
});
