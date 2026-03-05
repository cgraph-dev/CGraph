/**
 * AvatarGroup — stacked avatars with +N overflow pill for mobile.
 * @module components/ui/avatar-group
 */
import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import type { AvatarSize } from './avatar';

interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 16, sm: 24, md: 32, lg: 40, xl: 56, '2xl': 80, '3xl': 120,
};

export function AvatarGroup({ children, max = 3, size = 'md', style }: AvatarGroupProps) {
  const items = React.Children.toArray(children);
  const visible = items.slice(0, max);
  const overflow = items.length - max;
  const px = SIZE_PX[size];
  const overlap = -px * 0.3;

  return (
    <View style={[styles.row, style]}>
      {visible.map((child, i) => (
        <View
          key={i}
          style={[
            styles.item,
            { marginLeft: i > 0 ? overlap : 0, zIndex: visible.length - i },
          ]}
        >
          {child}
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.pill,
            {
              width: px,
              height: px,
              borderRadius: px / 2,
              marginLeft: overlap,
            },
          ]}
        >
          <Text style={[styles.pillText, { fontSize: px * 0.32 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  item: {
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#0f0f14',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#0f0f14',
  },
  pillText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
});

export default AvatarGroup;
