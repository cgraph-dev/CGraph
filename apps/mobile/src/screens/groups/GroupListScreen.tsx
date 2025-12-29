import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { GroupsStackParamList, Group } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupList'>;
};

export default function GroupListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchGroups();
  }, []);
  
  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };
  
  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.groupItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Group', { groupId: item.id })}
    >
      <View style={styles.groupIcon}>
        {item.icon_url ? (
          <Image source={{ uri: item.icon_url }} style={styles.groupIconImage} />
        ) : (
          <View style={[styles.groupIconPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.groupIconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.groupMembers, { color: colors.textSecondary }]}>
          {item.member_count} members
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Groups</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Join a group or create your own
      </Text>
      <View style={styles.emptyButtons}>
        <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.emptyButtonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.emptyButtonOutline, { borderColor: colors.border }]}
        >
          <Text style={[styles.emptyButtonOutlineText, { color: colors.text }]}>
            Browse Groups
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContent,
          groups.length === 0 && styles.emptyContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  groupIcon: {
    marginRight: 12,
  },
  groupIconImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  groupIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButtons: {
    gap: 12,
    width: '100%',
    maxWidth: 240,
  },
  emptyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyButtonOutline: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyButtonOutlineText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
