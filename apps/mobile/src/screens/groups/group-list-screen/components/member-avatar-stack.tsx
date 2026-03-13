/**
 * MemberAvatarStack Component
 *
 * Animated stacked avatars showing group members.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { MemberAvatarStackProps } from '../types';

/**
 * Member Avatar Stack component.
 *
 */
export function MemberAvatarStack({ memberCount, colors }: MemberAvatarStackProps) {
  const displayCount = Math.min(3, memberCount);
  const anim0 = useSharedValue(0);
  const anim1 = useSharedValue(0);
  const anim2 = useSharedValue(0);
  const anims = [anim0, anim1, anim2];

  useEffect(() => {
    anims.forEach((anim, index) => {
      anim.value = withDelay(
        index * 100,
        withSpring(index < displayCount ? 1 : 0, { damping: 8, stiffness: 50 })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayCount]);

  const style0 = useAnimatedStyle(() => ({
    transform: [{ scale: anim0.value }, { translateX: interpolate(anim0.value, [0, 1], [10, 0]) }],
    opacity: anim0.value,
  }));

  const style1 = useAnimatedStyle(() => ({
    transform: [{ scale: anim1.value }, { translateX: interpolate(anim1.value, [0, 1], [10, 0]) }],
    opacity: anim1.value,
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [{ scale: anim2.value }, { translateX: interpolate(anim2.value, [0, 1], [10, 0]) }],
    opacity: anim2.value,
  }));

  const animStyles = [style0, style1, style2];

  return (
    <View style={styles.avatarStack}>
      {anims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.stackedAvatar,
            {
              backgroundColor: ['#8b5cf6', '#ec4899', '#10b981'][index],
              marginLeft: index > 0 ? -8 : 0,
              zIndex: 3 - index,
            },
            animStyles[index],
          ]}
        >
          <Ionicons name="person" size={10} color="#fff" />
        </Animated.View>
      ))}
      {memberCount > 3 && (
        <View style={[styles.avatarCountBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.avatarCountText, { color: colors.text }]}>+{memberCount - 3}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#111827',
  },
  avatarCountBadge: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  avatarCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
