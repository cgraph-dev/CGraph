/**
 * Group settings screen for managing group configuration.
 * @module screens/groups/group-settings-screen
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupSettings'>;
  route: RouteProp<GroupsStackParamList, 'GroupSettings'>;
};

/**
 *
 */
export default function GroupSettingsScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { colors } = useThemeStore();
  const [showOverview, setShowOverview] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch current group data for overview editing
    api.get(`/api/v1/groups/${groupId}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        setGroupName(data?.name || '');
        setGroupDescription(data?.description || '');
      })
      .catch(() => {});
  }, [groupId]);

  const handleSaveOverview = async () => {
    if (!groupName.trim()) return;
    setIsSaving(true);
    try {
      await api.patch(`/api/v1/groups/${groupId}`, {
        name: groupName.trim(),
        description: groupDescription.trim() || null,
      });
      Alert.alert('Saved', 'Group settings updated');
      setShowOverview(false);
    } catch {
      Alert.alert('Error', 'Failed to update group settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const settingsItems = [
    {
      title: 'Overview',
      icon: 'information-circle-outline' as const,
      onPress: () => setShowOverview(true),
    },
    {
      title: 'Roles',
      icon: 'shield-outline' as const,
      onPress: () => navigation.navigate('GroupRoles', { groupId }),
    },
    {
      title: 'Channels',
      icon: 'list-outline' as const,
      onPress: () => navigation.navigate('GroupChannels', { groupId }),
    },
    {
      title: 'Members',
      icon: 'people-outline' as const,
      onPress: () => navigation.navigate('GroupMembers', { groupId }),
    },
    {
      title: 'Invites',
      icon: 'link-outline' as const,
      onPress: () => navigation.navigate('GroupInvites', { groupId }),
    },
    {
      title: 'Moderation',
      icon: 'hammer-outline' as const,
      onPress: () => navigation.navigate('GroupModeration', { groupId }),
    },
  ];
  
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/v1/groups/${groupId}/members/@me`);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to leave group');
            }
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Overview Edit Panel */}
      {showOverview && (
        <View style={[styles.section, { gap: 12 }]}>
          <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Group Name</Text>
            <TextInput
              style={[styles.overviewInput, { backgroundColor: colors.background, color: colors.text }]}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.overviewLabel, { color: colors.textSecondary, marginTop: 12 }]}>Description</Text>
            <TextInput
              style={[styles.overviewInput, styles.overviewTextArea, { backgroundColor: colors.background, color: colors.text }]}
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholder="Group description"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
            <View style={styles.overviewActions}>
              <TouchableOpacity
                style={[styles.overviewBtn, { backgroundColor: colors.background }]}
                onPress={() => setShowOverview(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.overviewBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveOverview}
                disabled={isSaving}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.settingsItem,
              { backgroundColor: colors.surface },
              index === 0 && styles.firstItem,
              index === settingsItems.length - 1 && styles.lastItem,
            ]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              {item.title}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: colors.surface }]}
          onPress={handleLeaveGroup}
        >
          <Ionicons name="exit-outline" size={22} color={colors.error} />
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            Leave Group
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  overviewCard: {
    borderRadius: 12,
    padding: 16,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  overviewInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  overviewTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  overviewActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  overviewBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
