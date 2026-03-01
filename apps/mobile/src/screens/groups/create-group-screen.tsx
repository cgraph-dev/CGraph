/**
 * Create Group screen for mobile.
 * Collects name, description, and visibility to create a new group.
 * @module screens/groups/create-group-screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import { useGroupStore } from '@/stores/groupStore';
import { GroupsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'CreateGroup'>;
};

/**
 * Screen for creating a new group.
 */
export default function CreateGroupScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const createGroup = useGroupStore((s) => s.createGroup);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const canCreate = name.trim().length >= 2;

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;

    setIsCreating(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      Alert.alert('Success', `Group "${group.name}" created!`, [
        {
          text: 'Open Group',
          onPress: () => navigation.replace('Group', { groupId: group.id }),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Name */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>GROUP NAME</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="My Awesome Group"
        placeholderTextColor={colors.textTertiary}
        value={name}
        onChangeText={setName}
        maxLength={100}
        autoFocus
      />

      {/* Description */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>DESCRIPTION</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="What is this group about?"
        placeholderTextColor={colors.textTertiary}
        value={description}
        onChangeText={setDescription}
        maxLength={500}
        multiline
        numberOfLines={3}
      />

      {/* Visibility */}
      <View style={[styles.switchRow, { borderColor: colors.border }]}>
        <View style={styles.switchLabel}>
          <Text style={[styles.switchTitle, { color: colors.text }]}>Public Group</Text>
          <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
            Anyone can find and join this group
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: canCreate ? colors.primary : colors.surfaceHover }]}
        onPress={handleCreate}
        disabled={!canCreate || isCreating}
        activeOpacity={0.8}
      >
        {isCreating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.createButtonText, { color: canCreate ? '#fff' : colors.textTertiary }]}>
            Create Group
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  createButton: {
    marginTop: 32,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
