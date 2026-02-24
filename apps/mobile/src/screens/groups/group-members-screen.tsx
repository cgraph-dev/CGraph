/**
 * GroupMembersScreen - View and manage group members
 * @module screens/groups
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown, FadeOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupMembers'>;
  route: RouteProp<GroupsStackParamList, 'GroupMembers'>;
};

interface Member {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  isMuted: boolean;
}

const roleColors: Record<string, string> = {
  owner: '#facc15',
  admin: '#ef4444',
  moderator: '#3b82f6',
  member: '#9ca3af',
};

export default function GroupMembersScreen({ route }: Props) {
  const { groupId } = route.params;
  const { colors } = useThemeStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/members`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setMembers(
        data.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          userId: (m.user_id ?? m.userId ?? m.id) as string,
          username: (m.username ?? (m.user as Record<string, unknown>)?.username ?? 'unknown') as string,
          displayName: (m.display_name ?? m.displayName ?? null) as string | null,
          avatarUrl: (m.avatar_url ?? m.avatarUrl ?? null) as string | null,
          role: (m.role ?? 'member') as string,
          isMuted: !!(m.is_muted ?? m.isMuted),
        }))
      );
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleMemberAction = (member: Member) => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: member.isMuted ? 'Unmute' : 'Mute',
        onPress: async () => {
          try {
            if (member.isMuted) {
              await api.delete(`/api/v1/groups/${groupId}/members/${member.id}/mute`);
            } else {
              await api.post(`/api/v1/groups/${groupId}/members/${member.id}/mute`);
            }
            fetchMembers();
          } catch { /* ignore */ }
        },
      },
      {
        text: 'Kick',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert('Kick Member', `Remove ${member.username} from the group?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Kick',
              style: 'destructive',
              onPress: async () => {
                try {
                  await api.delete(`/api/v1/groups/${groupId}/members/${member.id}`);
                  setMembers((prev) => prev.filter((m) => m.id !== member.id));
                } catch { /* ignore */ }
              },
            },
          ]);
        },
      },
      {
        text: 'Ban',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert('Ban Member', `Ban ${member.username} from the group?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Ban',
              style: 'destructive',
              onPress: async () => {
                try {
                  await api.post(`/api/v1/groups/${groupId}/members/${member.id}/ban`);
                  setMembers((prev) => prev.filter((m) => m.id !== member.id));
                } catch { /* ignore */ }
              },
            },
          ]);
        },
      },
    ];
    Alert.alert(member.displayName || member.username, `@${member.username}`, options);
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return m.username.toLowerCase().includes(q) || (m.displayName?.toLowerCase().includes(q) ?? false);
  });

  const renderMember = ({ item, index }: { item: Member; index: number }) => (
    <Animated.View
      entering={FadeInDown.springify().delay(index * 30)}
      exiting={FadeOutRight.duration(200)}
    >
      <TouchableOpacity
        style={[styles.memberItem, { backgroundColor: colors.surface }]}
        onPress={() => handleMemberAction(item)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.background }]}>
          <Ionicons name="person" size={20} color={colors.textTertiary} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.displayName || item.username}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{item.username}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: (roleColors[item.role] || roleColors.member) + '20' }]}>
          <Text style={[styles.roleText, { color: roleColors[item.role] || roleColors.member }]}>
            {item.role}
          </Text>
        </View>
        {item.isMuted && (
          <Ionicons name="volume-mute" size={16} color="#f97316" style={{ marginLeft: 4 }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search members..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search ? 'No members found' : 'No members'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  username: { fontSize: 12, marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
