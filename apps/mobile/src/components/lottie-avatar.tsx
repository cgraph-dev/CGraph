/**
 * Lottie-animated avatar rendered within a squircle mask.
 * @module components/LottieAvatar
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { getSquircleBorderRadius } from './avatar-squircle-clip';

interface LottieAvatarProps {
  /** URL to a Lottie JSON animation */
  lottieUrl: string;
  /** Pixel size of avatar */
  size: number;
  /** Fallback image URL */
  fallbackSource?: string | null;
  /** Fallback initials */
  initials?: string;
  /** Background color for initials */
  initialsColor?: string;
}

/**
 * Renders a Lottie animation inside squircle-masked avatar bounds.
 * Falls back to static image or initials while loading.
 */
export default function LottieAvatar({
  lottieUrl,
  size,
  fallbackSource,
  initials = '?',
  initialsColor = '#6366f1',
}: LottieAvatarProps) {
  const lottieRef = useRef<LottieView>(null);
  const reducedMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const radius = getSquircleBorderRadius(size);

  useEffect(() => {
    if (reducedMotion && lottieRef.current) {
      // Show first frame only under reduced-motion
      lottieRef.current.reset();
    }
  }, [reducedMotion]);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden' as const,
  };

  // Error fallback: show image or initials
  if (error) {
    if (fallbackSource) {
      return (
        <View style={containerStyle}>
          <Image
            source={{ uri: fallbackSource }}
            style={{ width: size, height: size, borderRadius: radius }}
            resizeMode="cover"
          />
        </View>
      );
    }
    return (
      <View style={[containerStyle, styles.initialsContainer, { backgroundColor: initialsColor }]}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Loading fallback */}
      {!loaded && fallbackSource && (
        <Image
          source={{ uri: fallbackSource }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          resizeMode="cover"
        />
      )}
      {!loaded && !fallbackSource && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.initialsContainer,
            { backgroundColor: initialsColor, borderRadius: radius },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}
      <LottieView
        ref={lottieRef}
        source={{ uri: lottieUrl }}
        autoPlay={!reducedMotion}
        loop
        style={{ width: size, height: size }}
        onAnimationLoaded={() => setLoaded(true)}
        onAnimationFailure={() => setError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
