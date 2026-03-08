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
import { PROFILE_EFFECT_LOTTIE_MAP } from './profileEffectMap';

interface ProfileEffectProps {
  /** Profile effect ID */
  effectId?: string;
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

  const source = effectId ? PROFILE_EFFECT_LOTTIE_MAP[effectId] : undefined;

  useEffect(() => {
    if (!lottieRef.current || !source) return;
    if (isAnimating) {
      lottieRef.current.play();
    } else {
      lottieRef.current.pause();
    }
  }, [isAnimating, source]);

  if (!effectId || !source) {
    return null;
  }

  return (
    <View style={[styles.overlay, { width, height }]} pointerEvents="none">
      <LottieView
        ref={lottieRef}
        source={source as LottieView['props']['source']}
        style={{ width, height }}
        autoPlay={isAnimating}
        loop={false}
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
