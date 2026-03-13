/**
 * LottieRenderer — React Native Lottie animation renderer
 *
 * Uses lottie-react-native for native iOS/Android rendering (60fps, GPU-accelerated).
 * Falls back to a static WebP image when:
 * - Reduced motion is enabled
 * - Lottie source is unavailable
 * - Loading is in progress
 *
 * @module lib/lottie/lottie-renderer
 */

import React, { memo, useCallback } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLottie } from './use-lottie';
import { getWebPFallbackUrl, type LottieRendererProps } from './lottie-types';

/**
 * Renders a Lottie animation with native rendering.
 * Falls back to a static WebP image when Lottie is unavailable.
 */
export const LottieRenderer = memo(function LottieRenderer({
  codepoint,
  url,
  emoji,
  size = 32,
  autoplay = false,
  loop = false,
  fallbackSrc,
  renderMode = 'AUTOMATIC',
}: LottieRendererProps) {
  const { source, isLoading, reducedMotion, animationRef, play } = useLottie({
    codepoint,
    emoji,
    url,
    autoplay,
    loop,
  });

  const handlePressIn = useCallback(() => {
    if (!autoplay) {
      play();
    }
  }, [autoplay, play]);

  // Build fallback URI
  const fallback = fallbackSrc || (codepoint ? getWebPFallbackUrl(codepoint) : undefined);

  // Show fallback for reduced motion, missing source, or while loading
  if (reducedMotion || (!source && !isLoading)) {
    if (fallback) {
      return (
        <Image
          source={{ uri: fallback }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      );
    }
    return <View style={{ width: size, height: size }} />;
  }

  if (isLoading) {
    return (
      <View style={[styles.loader, { width: size, height: size }]}>
        <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
      </View>
    );
  }

  return (
    <Pressable onPressIn={handlePressIn} style={{ width: size, height: size }}>
      <LottieView
        ref={animationRef}
        source={{ uri: source! }}
        style={{ width: size, height: size }}
        autoPlay={autoplay}
        loop={loop}
        renderMode={renderMode}
        resizeMode="contain"
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export type { LottieRendererProps };
