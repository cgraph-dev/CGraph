/**
 * TypingIndicator Component
 * 
 * Animated dots indicating that the other user is typing.
 * Positioned above the input area in conversations.
 * Features 4 variants (dots, wave, pulse, bars), glow effect, and gradient colors matching web parity.
 * 
 * @module components/conversation/TypingIndicator
 * @since v0.7.29
 * @updated v0.8.2 - Added glow effect and gradient for web parity
 * @updated v0.8.3 - Added 4 typing indicator variants (dots, wave, pulse, bars)
 */

import { durations } from '@cgraph/animation-constants';
import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Gradient colors matching web (from-primary-400 to-purple-400)
const DOT_GRADIENT_COLORS = ['#818cf8', '#a855f7'] as const; // primary-400 to purple-400
const GLOW_COLOR = 'rgba(129, 140, 248, 0.4)'; // primary-400 with opacity

/** Typing indicator animation variants matching web ChatBubbleSettings */
export type TypingIndicatorVariant = 'dots' | 'wave' | 'pulse' | 'bars';

export interface TypingIndicatorProps {
  /** Whether the other user is currently typing */
  isTyping: boolean;
  /** Display name of the typing user */
  username: string;
  /** Background color for the indicator container */
  backgroundColor: string;
  /** Text color for the indicator */
  textColor: string;
  /** Optional: Enable glow effect on dots */
  enableGlow?: boolean;
  /** Optional: Use gradient colors for dots */
  useGradient?: boolean;
  /** Optional: Animation variant - dots, wave, pulse, or bars */
  variant?: TypingIndicatorVariant;
}

/**
 * Animated dot with optional glow effect (for 'dots' variant)
 */
const AnimatedDot = memo(function AnimatedDot({
  translateY,
  glowOpacity,
  textColor,
  enableGlow,
  useGradient,
}: {
  translateY: Animated.Value;
  glowOpacity: Animated.Value;
  textColor: string;
  enableGlow?: boolean;
  useGradient?: boolean;
}) {
  if (useGradient) {
    return (
      <Animated.View
        style={[
          styles.dotWrapper,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Glow layer */}
        {enableGlow && (
          <Animated.View
            style={[
              styles.dotGlow,
              { opacity: glowOpacity },
            ]}
          />
        )}
        {/* Gradient dot */}
        <LinearGradient
          colors={DOT_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientDot}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: textColor, transform: [{ translateY }] },
      ]}
    />
  );
});

/**
 * Wave bar element (for 'wave' variant)
 */
const WaveBar = memo(function WaveBar({
  scaleY,
  useGradient,
  textColor,
}: {
  scaleY: Animated.Value;
  useGradient?: boolean;
  textColor: string;
}) {
  if (useGradient) {
    return (
      <Animated.View style={[styles.waveBarWrapper, { transform: [{ scaleY }] }]}>
        <LinearGradient
          colors={DOT_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.waveBar}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { backgroundColor: textColor, transform: [{ scaleY }] },
      ]}
    />
  );
});

/**
 * Pulse circle element (for 'pulse' variant)
 */
const PulseCircle = memo(function PulseCircle({
  scale,
  opacity,
  useGradient,
  textColor,
}: {
  scale: Animated.Value;
  opacity: Animated.Value;
  useGradient?: boolean;
  textColor: string;
}) {
  if (useGradient) {
    return (
      <Animated.View
        style={[
          styles.pulseCircleWrapper,
          { transform: [{ scale }], opacity },
        ]}
      >
        <LinearGradient
          colors={DOT_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pulseCircle}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.pulseCircle,
        { backgroundColor: textColor, transform: [{ scale }], opacity },
      ]}
    />
  );
});

/**
 * Vertical bar element (for 'bars' variant)
 */
const VerticalBar = memo(function VerticalBar({
  height,
  useGradient,
  textColor,
}: {
  height: Animated.Value;
  useGradient?: boolean;
  textColor: string;
}) {
  if (useGradient) {
    return (
      <Animated.View style={[styles.verticalBarWrapper, { height }]}>
        <LinearGradient
          colors={DOT_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.verticalBar,
        { backgroundColor: textColor, height },
      ]}
    />
  );
});

/**
 * Typing indicator with animated bouncing dots.
 * 
 * Features:
 * - Four variants: dots, wave, pulse, bars (matching web)
 * - Three dots with staggered bounce animation
 * - Fade in/out when typing state changes
 * - Shows username of who is typing
 * - Customizable colors for dark/light theme
 * - Optional glow effect and gradient colors (matching web)
 * 
 * @example
 * ```tsx
 * <TypingIndicator
 *   isTyping={otherUserTyping}
 *   username="Alice"
 *   backgroundColor="#1a1a2e"
 *   textColor="#a5a5b5"
 *   enableGlow={true}
 *   useGradient={true}
 *   variant="dots"
 * />
 * ```
 */
export const TypingIndicator = memo(function TypingIndicator({
  isTyping,
  username,
  backgroundColor,
  textColor,
  enableGlow = true,
  useGradient = true,
  variant = 'dots',
}: TypingIndicatorProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Dots variant animations
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const glow1 = useRef(new Animated.Value(0.3)).current;
  const glow2 = useRef(new Animated.Value(0.3)).current;
  const glow3 = useRef(new Animated.Value(0.3)).current;
  
  // Wave variant animations
  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.3)).current;
  const wave3 = useRef(new Animated.Value(0.3)).current;
  const wave4 = useRef(new Animated.Value(0.3)).current;
  
  // Pulse variant animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  
  // Bars variant animations
  const bar1 = useRef(new Animated.Value(8)).current;
  const bar2 = useRef(new Animated.Value(8)).current;
  const bar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isTyping) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.normal.ms,
        useNativeDriver: true,
      }).start();

      let animations: Animated.CompositeAnimation;

      switch (variant) {
        case 'dots': {
          // Start dot animation with glow
          const bounceAnimation = (
            dot: Animated.Value,
            glow: Animated.Value,
            delay: number
          ) => {
            return Animated.loop(
              Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                  Animated.timing(dot, {
                    toValue: -6,
                    duration: durations.slow.ms,
                    useNativeDriver: true,
                  }),
                  enableGlow
                    ? Animated.timing(glow, {
                        toValue: 0.8,
                        duration: durations.slow.ms,
                        useNativeDriver: true,
                      })
                    : Animated.timing(glow, {
                        toValue: 0.3,
                        duration: 0,
                        useNativeDriver: true,
                      }),
                ]),
                Animated.parallel([
                  Animated.timing(dot, {
                    toValue: 0,
                    duration: durations.slow.ms,
                    useNativeDriver: true,
                  }),
                  enableGlow
                    ? Animated.timing(glow, {
                        toValue: 0.3,
                        duration: durations.slow.ms,
                        useNativeDriver: true,
                      })
                    : Animated.timing(glow, {
                        toValue: 0.3,
                        duration: 0,
                        useNativeDriver: true,
                      }),
                ]),
              ])
            );
          };

          animations = Animated.parallel([
            bounceAnimation(dot1, glow1, 0),
            bounceAnimation(dot2, glow2, 150),
            bounceAnimation(dot3, glow3, 300),
          ]);
          break;
        }

        case 'wave': {
          // Wave animation - bars scale up/down like audio equalizer
          const waveAnimation = (wave: Animated.Value, delay: number) => {
            return Animated.loop(
              Animated.sequence([
                Animated.delay(delay),
                Animated.timing(wave, {
                  toValue: 1,
                  duration: durations.normal.ms,
                  useNativeDriver: true,
                }),
                Animated.timing(wave, {
                  toValue: 0.3,
                  duration: durations.normal.ms,
                  useNativeDriver: true,
                }),
              ])
            );
          };

          animations = Animated.parallel([
            waveAnimation(wave1, 0),
            waveAnimation(wave2, 100),
            waveAnimation(wave3, 200),
            waveAnimation(wave4, 300),
          ]);
          break;
        }

        case 'pulse': {
          // Pulse animation - single circle that pulses
          animations = Animated.loop(
            Animated.sequence([
              Animated.parallel([
                Animated.timing(pulseScale, {
                  toValue: 1.3,
                  duration: durations.slower.ms,
                  useNativeDriver: true,
                }),
                Animated.timing(pulseOpacity, {
                  toValue: 0.3,
                  duration: durations.slower.ms,
                  useNativeDriver: true,
                }),
              ]),
              Animated.parallel([
                Animated.timing(pulseScale, {
                  toValue: 1,
                  duration: durations.slower.ms,
                  useNativeDriver: true,
                }),
                Animated.timing(pulseOpacity, {
                  toValue: 0.6,
                  duration: durations.slower.ms,
                  useNativeDriver: true,
                }),
              ]),
            ])
          );
          break;
        }

        case 'bars': {
          // Bars animation - vertical bars that grow/shrink
          const barAnimation = (bar: Animated.Value, delay: number) => {
            return Animated.loop(
              Animated.sequence([
                Animated.delay(delay),
                Animated.timing(bar, {
                  toValue: 16,
                  duration: durations.slow.ms,
                  useNativeDriver: false, // height can't use native driver
                }),
                Animated.timing(bar, {
                  toValue: 8,
                  duration: durations.slow.ms,
                  useNativeDriver: false,
                }),
              ])
            );
          };

          animations = Animated.parallel([
            barAnimation(bar1, 0),
            barAnimation(bar2, 150),
            barAnimation(bar3, 300),
          ]);
          break;
        }

        default:
          animations = Animated.parallel([]);
      }

      animations.start();

      return () => {
        animations.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: durations.fast.ms,
        useNativeDriver: true,
      }).start();
    }
  }, [isTyping, fadeAnim, variant, enableGlow, dot1, dot2, dot3, glow1, glow2, glow3, wave1, wave2, wave3, wave4, pulseScale, pulseOpacity, bar1, bar2, bar3]);

  if (!isTyping) return null;

  // Render the appropriate variant
  const renderIndicator = () => {
    switch (variant) {
      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            <AnimatedDot
              translateY={dot1}
              glowOpacity={glow1}
              textColor={textColor}
              enableGlow={enableGlow}
              useGradient={useGradient}
            />
            <AnimatedDot
              translateY={dot2}
              glowOpacity={glow2}
              textColor={textColor}
              enableGlow={enableGlow}
              useGradient={useGradient}
            />
            <AnimatedDot
              translateY={dot3}
              glowOpacity={glow3}
              textColor={textColor}
              enableGlow={enableGlow}
              useGradient={useGradient}
            />
          </View>
        );

      case 'wave':
        return (
          <View style={styles.waveContainer}>
            <WaveBar scaleY={wave1} useGradient={useGradient} textColor={textColor} />
            <WaveBar scaleY={wave2} useGradient={useGradient} textColor={textColor} />
            <WaveBar scaleY={wave3} useGradient={useGradient} textColor={textColor} />
            <WaveBar scaleY={wave4} useGradient={useGradient} textColor={textColor} />
          </View>
        );

      case 'pulse':
        return (
          <View style={styles.pulseContainer}>
            <PulseCircle
              scale={pulseScale}
              opacity={pulseOpacity}
              useGradient={useGradient}
              textColor={textColor}
            />
          </View>
        );

      case 'bars':
        return (
          <View style={styles.barsContainer}>
            <VerticalBar height={bar1} useGradient={useGradient} textColor={textColor} />
            <VerticalBar height={bar2} useGradient={useGradient} textColor={textColor} />
            <VerticalBar height={bar3} useGradient={useGradient} textColor={textColor} />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, opacity: fadeAnim },
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {username} is typing
      </Text>
      {renderIndicator()}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  // Dots variant styles
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  dotWrapper: {
    width: 9,
    height: 9,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGlow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GLOW_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: DOT_GRADIENT_COLORS[0],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
  // Wave variant styles
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  waveBarWrapper: {
    width: 3,
    height: 12,
    marginHorizontal: 2,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  waveBar: {
    width: 3,
    height: 12,
    marginHorizontal: 2,
    borderRadius: 1.5,
  },
  // Pulse variant styles
  pulseContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircleWrapper: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  pulseCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  // Bars variant styles
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
  },
  verticalBarWrapper: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  verticalBar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
});

export default TypingIndicator;
