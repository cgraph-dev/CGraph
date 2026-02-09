/**
 * GroupChannelsScreen - Manage group channels
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
import Animated, { FadeInDown, FadeOutLeft, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupChannels'>;
  route: RouteProp<GroupsStackParamList, 'GroupChannels'>;
};

interface Channel {
  id: string;
  name: string;
  type: string;
  topic: string | null;
  position: number;
}

const channelIcons: Record<string, string> = {
  text: 'chatbox-outline',
  voice: 'volume-medium-outline',
  announcement: 'megaphone-outline',
};

export default function GroupChannelsScreen({ route }: Props) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'text' | 'voice' | 'announcement'>('text');

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/channels`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setChannels(
        data
          .map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: (c.name ?? '') as string,
            type: (c.type ?? 'text') as string,
            topic: (c.topic ?? null) as string | null,
            position: (c.position ?? 0) as number,
          }))
          .sort((a: Channel, b: Channel) => a.position - b.position)
      );
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/channels`, {
        name: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        type: newType,
        position: channels.length,
      });
      setNewName('');
      setShowCreate(false);
      fetchChannels();
    } catch {
      Alert.alert('Error', 'Failed to create channel');
    }
  };

  const handleDelete = (channel: Channel) => {
    Alert.alert('Delete Channel', `Delete #${channel.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/v1/groups/${groupId}/channels/${channel.id}`);
            setChannels((prev) => prev.filter((c) => c.id !== channel.id));
          } catch {
            Alert.alert('Error', 'Failed to delete channel');
          }
        },
      },
    ]);
  };

  const renderChannel = ({ item, index }: { item: Channel; index: number }) => (
    <Animated.View
      entering={FadeInDown.springify().delay(index * 40)}
      exiting={FadeOutLeft.duration(200)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[styles.channelItem, { backgroundColor: colors.surface }]}
        onLongPress={() => handleDelete(item)}
      >
        <Ionicons
          name={(channelIcons[item.type] || 'chatbox-outline') as keyof typeof Ionicons.glyphMap}
          size={22}
          color={colors.textSecondary}
        />
        <View style={styles.channelInfo}>
          <Text style={[styles.channelName, { color: colors.text }]}>{item.name}</Text>
          {item.topic && (
            <Text style={[styles.channelTopic, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.topic}
            </Text>
          )}
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
          <Text style={[styles.typeText, { color: colors.textSecondary }]}>{item.type}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Create button */}
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>
          {channels.length} channel{channels.length !== 1 ? 's' : ''} · Long-press to delete
        </Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(!showCreate)}
        >
          <Ionicons name={showCreate ? 'close' : 'add'} size={18} color="#fff" />
          <Text style={styles.createBtnText}>{showCreate ? 'Cancel' : 'Create'}</Text>
        </TouchableOpacity>
      </View>

      {/* Create Form */}
      {showCreate && (
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.createForm, { backgroundColor: colors.surface }]}
        >
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
            placeholder="channel-name"
            placeholderTextColor={colors.textTertiary}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <View style={styles.typeRow}>
            {(['text', 'voice', 'announcement'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  { borderColor: newType === type ? colors.primary : colors.textTertiary + '40' },
                  newType === type && { backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => setNewType(type)}
              >
                <Ionicons
                  name={(channelIcons[type] || 'chatbox-outline') as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={newType === type ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[styles.typeOptionText, { color: newType === type ? colors.primary : colors.textSecondary }]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: newName.trim() ? 1 : 0.5 }]}
            onPress={handleCreate}
            disabled={!newName.trim()}
          >
            <Text style={styles.submitBtnText}>Create Channel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          renderItem={renderChannel}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No channels yet</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: { fontSize: 13 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  createForm: { marginHorizontal: 16, padding: 16, borderRadius: 12, gap: 12, marginBottom: 8 },
  input: { fontSize: 15, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeOptionText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  submitBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  channelInfo: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: '600' },
  channelTopic: { fontSize: 12, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
