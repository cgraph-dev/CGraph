/**
 * TrendingItem – animated trending search suggestion pill.
 *
 * @module screens/search/SearchScreen/components/trending-item
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface TrendingItemData {
  text: string;
  icon: string;
  color: string;
  searches: number;
}

interface TrendingItemProps {
  item: TrendingItemData;
  onPress: () => void;
  isDark: boolean;
}

/**
 * Trending Item component.
 *
 */
export function TrendingItem({ item, onPress, isDark }: TrendingItemProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: durations.ambient.ms,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: durations.ambient.ms,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: durations.loop.ms,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: durations.loop.ms,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          trendingStyles.item,
          {
            transform: [{ scale: pulseAnim }],
            shadowColor: item.color,
            shadowOpacity: 0.3,
          },
        ]}
      >
        <Animated.View
          style={[
            trendingStyles.glowOverlay,
            { backgroundColor: item.color, opacity: glowOpacity },
          ]}
        />
        <LinearGradient
          colors={[item.color, `${item.color}99`]}
          style={trendingStyles.iconContainer}
        >
          { }
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color="#fff" />
        </LinearGradient>
        <View style={trendingStyles.textContainer}>
          <Text
            style={[trendingStyles.text, { color: isDark ? '#fff' : '#1f2937' }]}
            numberOfLines={1}
          >
            {item.text}
          </Text>
          <Text style={trendingStyles.searchCount}>{item.searches.toLocaleString()} searches</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const trendingStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginRight: 12,
    minWidth: 180,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});
