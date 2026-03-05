/**
 * StatusIndicator — standalone presence dot with optional pulse.
 * @module components/ui/status-indicator
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type StatusType = 'online' | 'offline' | 'idle' | 'dnd' | 'streaming';

interface StatusIndicatorProps {
  status: StatusType;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const STATUS_COLORS: Record<StatusType, string> = {
  online: '#22c55e',
  offline: '#6b7280',
  idle: '#eab308',
  dnd: '#ef4444',
  streaming: '#a855f7',
};

const SIZE_PX = { sm: 8, md: 10, lg: 12 };

export function StatusIndicator({ status, pulse = false, size = 'md', style }: StatusIndicatorProps) {
  const px = SIZE_PX[size];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (pulse && status === 'online') {
      scale.value = withRepeat(withTiming(2, { duration: 1000 }), -1, true);
      opacity.value = withRepeat(withTiming(0, { duration: 1000 }), -1, true);
    } else {
      scale.value = 1;
      opacity.value = 0;
    }
  }, [pulse, status, scale, opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[{ width: px, height: px, position: 'relative' }, style]}>
      <View
        style={{
          width: px,
          height: px,
          borderRadius: px / 2,
          backgroundColor: STATUS_COLORS[status],
        }}
      />
      {pulse && status === 'online' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: px,
              height: px,
              borderRadius: px / 2,
              backgroundColor: '#22c55e',
            },
            pulseStyle,
          ]}
        />
      )}
    </View>
  );
}

export default StatusIndicator;
