/**
 * GroupListScreen
 *
 * Premium UI with glassmorphism and animations for displaying groups.
 *
 * @refactored Extracted from 1050-line file:
 * - types.ts: Type definitions
 * - components/FloatingParticles: Particle effects
 * - components/MemberAvatarStack: Stacked member avatars
 * - components/AnimatedHeader: Create button with animation
 * - components/MorphingGroupCard: 3D card with magnetic effects
 * - components/EmptyGroupState: Empty state display
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/theme-context';
import api from '../../../lib/api';
import type { GroupListScreenProps, Group } from './types';
import { AnimatedHeader, MorphingGroupCard, EmptyGroupState } from './components';

export default function GroupListScreen({ navigation }: GroupListScreenProps) {
  const { colors, isDark } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Animate header entrance
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.text,
        fontWeight: '700',
      },
      headerRight: () => (
        <AnimatedHeader
          colors={colors}
          onCreatePress={() => {
            // Navigate to create group
          }}
        />
      ),
    });
  }, [colors, navigation, headerOpacity, headerSlide]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/v1/groups');
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchGroups();
    setRefreshing(false);
  };

  const renderGroup = useCallback(
    ({ item, index }: { item: Group; index: number }) => (
      <MorphingGroupCard
        item={item}
        index={index}
        onPress={() => navigation.navigate('Group', { groupId: item.id })}
        colors={colors}
        isDark={isDark}
      />
    ),
    [colors, isDark, navigation]
  );

  const renderEmptyState = () => <EmptyGroupState colors={colors} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[styles.listContent, groups.length === 0 && styles.emptyContainer]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
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
});
