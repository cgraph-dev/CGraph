import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { MessagesStackParamList, UserBasic } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'NewConversation'>;
};

export default function NewConversationScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await api.get(`/api/v1/search/users?q=${encodeURIComponent(query)}`);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const startConversation = async (userId: string) => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const response = await api.post('/api/v1/conversations', {
        participant_ids: [userId],
      });
      navigation.replace('Conversation', { conversationId: response.data.data.id });
    } catch (error) {
      console.error('Error creating conversation:', error);
      setIsCreating(false);
    }
  };
  
  const renderUser = ({ item }: { item: UserBasic }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: colors.border }]}
      onPress={() => startConversation(item.id)}
      disabled={isCreating}
    >
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.status === 'online' ? '#10b981' : colors.textTertiary },
          ]}
        />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.displayName, { color: colors.text }]}>
          {item.display_name || item.username}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{item.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            searchUsers(text);
          }}
          autoFocus
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            search.length >= 2 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No users found
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Enter a username to search
                </Text>
              </View>
            )
          }
        />
      )}
      
      {isCreating && (
        <View style={[styles.creatingOverlay, { backgroundColor: colors.overlay }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.creatingText, { color: '#fff' }]}>
            Starting conversation...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  creatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
