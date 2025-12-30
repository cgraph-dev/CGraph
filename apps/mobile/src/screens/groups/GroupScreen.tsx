import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { GroupsStackParamList, Group, ChannelCategory } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'Group'>;
  route: RouteProp<GroupsStackParamList, 'Group'>;
};

export default function GroupScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    fetchGroup();
  }, [groupId]);
  
  const fetchGroup = async () => {
    try {
      const response = await api.get(`/api/v1/groups/${groupId}`);
      const groupData = response.data.data;
      setGroup(groupData);
      
      navigation.setOptions({
        title: groupData.name,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupSettings', { groupId })}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      });
      
      // Expand all categories by default
      setExpandedCategories(new Set(groupData.categories?.map((c: ChannelCategory) => c.id) || []));
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!group) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Group not found</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Group Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        {group.banner_url && (
          <Image source={{ uri: group.banner_url }} style={styles.banner} />
        )}
        <View style={styles.headerContent}>
          <View style={styles.groupIconLarge}>
            {group.icon_url ? (
              <Image source={{ uri: group.icon_url }} style={styles.groupIconImage} />
            ) : (
              <View style={[styles.groupIconPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.groupIconText}>
                  {group.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
          <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
            {group.member_count} members
          </Text>
        </View>
      </View>
      
      {/* Channels */}
      <ScrollView style={styles.channelsContainer}>
        {group.categories?.map((category) => (
          <View key={category.id} style={styles.category}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.id)}
            >
              <Ionicons
                name={expandedCategories.has(category.id) ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
                {category.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
            
            {expandedCategories.has(category.id) && (
              <View style={styles.channelsList}>
                {category.channels?.map((channel) => (
                  <TouchableOpacity
                    key={channel.id}
                    style={[styles.channelItem, { backgroundColor: colors.surfaceHover }]}
                    onPress={() => navigation.navigate('Channel', { groupId, channelId: channel.id })}
                  >
                    <Ionicons
                      name={
                        channel.type === 'voice'
                          ? 'volume-high-outline'
                          : channel.type === 'announcements'
                            ? 'megaphone-outline'
                            : 'chatbubble-outline'
                      }
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.channelName, { color: colors.text }]}>
                      {channel.name}
                    </Text>
                    {channel.unread_count > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.unreadText}>{channel.unread_count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    paddingBottom: 16,
  },
  banner: {
    width: '100%',
    height: 100,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: -30,
  },
  groupIconLarge: {
    marginBottom: 8,
  },
  groupIconImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#fff',
  },
  groupIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  groupIconText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
  },
  channelsContainer: {
    flex: 1,
    padding: 16,
  },
  category: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  channelsList: {
    gap: 4,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  channelName: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
