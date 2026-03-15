/**
 * ProfileEffect — full-card Lottie overlay for profile entrance effects.
 *
 * Positioned absolutely over the card, with pointerEvents='none'
 * so it doesn't block touch interactions.
 *
 * @module profile/components/ProfileCard/ProfileEffect
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { getProfileEffectSource } from './profileEffectMap';

interface ProfileEffectProps {
  /** Profile effect ID (null or 'effect_none' = hidden) */
  effectId?: string | null;
  /** Whether the effect is playing */
  isAnimating: boolean;
  /** Effect overlay width */
  width: number;
  /** Effect overlay height */
  height: number;
}

/**
 * Full-card Lottie overlay that plays when a profile is opened.
 * Renders nothing if no effect is equipped or the asset isn't available.
 */
export function ProfileEffect({ effectId, isAnimating, width, height }: ProfileEffectProps) {
  const lottieRef = useRef<LottieView>(null);

  const source = getProfileEffectSource(effectId ?? null);

  useEffect(() => {
    if (!lottieRef.current || !source) return;
    if (isAnimating) {
      lottieRef.current.play();
    } else {
      lottieRef.current.pause();
    }
  }, [isAnimating, source]);

  if (!effectId || effectId === 'effect_none' || !source) {
    return null;
  }

  return (
    <View style={[styles.overlay, { width, height }]} pointerEvents="none">
      <LottieView
        ref={lottieRef}
        source={source as LottieView['props']['source']}
        style={{ width, height }}
        autoPlay={isAnimating}
        loop
        speed={1.0}
        renderMode="AUTOMATIC"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
});
