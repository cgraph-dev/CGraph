/**
 * AnimatedText - Text with entrance and character-by-character animation
 */

import React from 'react';
import { View, StyleSheet, StyleProp, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { ENTERING_PRESETS } from './animation-presets';

export interface AnimatedTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  entering?: keyof typeof ENTERING_PRESETS;
  delay?: number;
  staggerDelay?: number;
  characterAnimation?: boolean;
}

/**
 *
 */
export function AnimatedText({
  children,
  style,
  entering = 'fadeInUp',
  delay = 0,
  staggerDelay = 30,
  characterAnimation = false,
}: AnimatedTextProps) {
  const EnteringAnimation = ENTERING_PRESETS[entering];

  if (characterAnimation) {
    const characters = children.split('');

    return (
      <View style={styles.textRow}>
        {characters.map((char, index) => (
          <Animated.Text
            key={`${char}-${index}`}
            entering={EnteringAnimation.delay(delay + index * staggerDelay).duration(300)}
            style={style}
          >
            {char === ' ' ? '\u00A0' : char}
          </Animated.Text>
        ))}
      </View>
    );
  }

  return (
    <Animated.Text entering={EnteringAnimation.delay(delay).duration(300)} style={style}>
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
