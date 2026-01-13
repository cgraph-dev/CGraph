/**
 * Premium Badge Component
 * 
 * Displays a premium badge next to usernames for subscribed users.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  Easing 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface PremiumBadgeProps {
  tier: 'starter' | 'pro' | 'ultimate';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const TIER_COLORS = {
  starter: ['#60A5FA', '#3B82F6'],
  pro: ['#A78BFA', '#8B5CF6'],
  ultimate: ['#FCD34D', '#F59E0B'],
};

const TIER_ICONS = {
  starter: 'star',
  pro: 'diamond',
  ultimate: 'crown',
};

const SIZE_MAP = {
  sm: 16,
  md: 20,
  lg: 28,
};

export default function PremiumBadge({ 
  tier, 
  size = 'md', 
  animated = true 
}: PremiumBadgeProps) {
  const rotation = useSharedValue(0);
  
  React.useEffect(() => {
    if (animated && tier === 'ultimate') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated, tier]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  const iconSize = SIZE_MAP[size];
  const colors = TIER_COLORS[tier];
  const iconName = TIER_ICONS[tier] as keyof typeof Ionicons.glyphMap;
  
  return (
    <View style={[styles.container, { width: iconSize + 8, height: iconSize + 8 }]}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={animated && tier === 'ultimate' ? animatedStyle : undefined}>
          <Ionicons name={iconName} size={iconSize} color="white" />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
