/**
 * GroupRolesScreen - View and manage group roles
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
} from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupRoles'>;
  route: RouteProp<GroupsStackParamList, 'GroupRoles'>;
};

interface Role {
  id: string;
  name: string;
  color: string | null;
  position: number;
  permissions: number;
  memberCount?: number;
}

/**
 *
 */
export default function GroupRolesScreen({ route }: Props) {
  const { groupId } = route.params;
  const { colors } = useThemeStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/roles`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRoles(data.sort((a: Role, b: Role) => a.position - b.position));
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const renderRole = ({ item, index }: { item: Role; index: number }) => (
    <Animated.View
      entering={FadeInDown.springify().delay(index * 40)}
      exiting={FadeOutLeft.duration(200)}
    >
      <TouchableOpacity
        style={[styles.roleItem, { backgroundColor: colors.surface }]}
        onPress={() => Alert.alert('Edit Role', `Edit ${item.name} permissions`)}
      >
        <View style={[styles.roleColor, { backgroundColor: item.color || colors.textSecondary }]} />
        <View style={styles.roleInfo}>
          <Text style={[styles.roleName, { color: item.color || colors.text }]}>{item.name}</Text>
          {item.memberCount !== undefined && (
            <Text style={[styles.roleMeta, { color: colors.textSecondary }]}>
              {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={roles}
        keyExtractor={(item) => item.id}
        renderItem={renderRole}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No custom roles yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 8 },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleColor: { width: 12, height: 12, borderRadius: 6 },
  roleInfo: { flex: 1, marginLeft: 12 },
  roleName: { fontSize: 16, fontWeight: '600' },
  roleMeta: { fontSize: 12, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
