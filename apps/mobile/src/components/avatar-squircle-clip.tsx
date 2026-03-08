/**
 * Squircle clip wrapper for native avatar/image components.
 * Uses borderRadius + overflow hidden for cross-platform squircle masking.
 * @module components/AvatarSquircleClip
 */
import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

interface SquircleClipProps {
  /** Width/height of the squircle in pixels */
  size: number;
  /** Children to clip into squircle shape */
  children: ReactNode;
  /** Additional container styles */
  style?: ViewStyle;
}

/**
 * Compute squircle borderRadius for a given pixel size.
 * Uses 43px for ≥48px sizes; for smaller avatars caps at size/2 to avoid
 * looking like a circle.
 */
export function getSquircleBorderRadius(size: number): number {
  return Math.min(43, size / 2);
}

/**
 * Wraps children in a squircle-clipped container.
 */
export default function SquircleClip({ size, children, style }: SquircleClipProps) {
  const radius = getSquircleBorderRadius(size);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
