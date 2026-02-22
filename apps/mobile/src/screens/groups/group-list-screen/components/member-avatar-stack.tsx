/**
 * MemberAvatarStack Component
 *
 * Animated stacked avatars showing group members.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MemberAvatarStackProps } from '../types';

export function MemberAvatarStack({ memberCount, colors }: MemberAvatarStackProps) {
  const displayCount = Math.min(3, memberCount);
  const anims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      anims.map((anim, index) =>
        Animated.spring(anim, {
          toValue: index < displayCount ? 1 : 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [displayCount, anims]);

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
              transform: [
                { scale: anim },
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
              opacity: anim,
            },
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
