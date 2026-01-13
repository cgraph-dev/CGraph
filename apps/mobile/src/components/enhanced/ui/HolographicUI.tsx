/**
 * Holographic UI Component System - React Native Edition
 * 
 * Mobile adaptation of next-generation holographic user interface components with:
 * - Holographic glow effects using LinearGradient
 * - Animated scan lines and flicker effects
 * - Parallax depth with gyroscope (when available)
 * - Interactive touch feedback with haptics
 * - Sci-fi inspired animations using Animated API
 * 
 * Creates a futuristic "Minority Report" style interface optimized for mobile.
 * 
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { ReactNode, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  ViewStyle,
  TextStyle,
  Platform,
  Easing,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

export interface HolographicTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  scanline: string;
  background: string;
}

export interface HolographicConfig {
  intensity: 'subtle' | 'medium' | 'intense';
  colorTheme: 'cyan' | 'green' | 'purple' | 'gold' | 'custom';
  customColors?: HolographicTheme;
  enableScanlines: boolean;
  enableFlicker: boolean;
  enableHaptics: boolean;
  glitchProbability: number;
}

// =============================================================================
// COLOR THEMES
// =============================================================================

export const HOLOGRAPHIC_THEMES: Record<string, HolographicTheme> = {
  cyan: {
    primary: 'rgba(0, 255, 255, 0.9)',
    secondary: 'rgba(0, 200, 255, 0.7)',
    accent: 'rgba(100, 255, 255, 1)',
    glow: 'rgba(0, 255, 255, 0.5)',
    scanline: 'rgba(0, 255, 255, 0.1)',
    background: 'rgba(0, 20, 40, 0.95)',
  },
  green: {
    primary: 'rgba(0, 255, 100, 0.9)',
    secondary: 'rgba(50, 255, 150, 0.7)',
    accent: 'rgba(100, 255, 150, 1)',
    glow: 'rgba(0, 255, 100, 0.5)',
    scanline: 'rgba(0, 255, 100, 0.1)',
    background: 'rgba(0, 30, 20, 0.95)',
  },
  purple: {
    primary: 'rgba(200, 100, 255, 0.9)',
    secondary: 'rgba(150, 50, 255, 0.7)',
    accent: 'rgba(220, 150, 255, 1)',
    glow: 'rgba(180, 80, 255, 0.5)',
    scanline: 'rgba(180, 80, 255, 0.1)',
    background: 'rgba(30, 10, 50, 0.95)',
  },
  gold: {
    primary: 'rgba(255, 200, 50, 0.9)',
    secondary: 'rgba(255, 180, 30, 0.7)',
    accent: 'rgba(255, 220, 100, 1)',
    glow: 'rgba(255, 200, 50, 0.5)',
    scanline: 'rgba(255, 200, 50, 0.1)',
    background: 'rgba(40, 30, 10, 0.95)',
  },
};

function getTheme(colorTheme: HolographicConfig['colorTheme'], customColors?: HolographicTheme): HolographicTheme {
  if (colorTheme === 'custom' && customColors) return customColors;
  return HOLOGRAPHIC_THEMES[colorTheme] ?? HOLOGRAPHIC_THEMES.cyan;
}

// =============================================================================
// ANIMATED CORNER DECORATION
// =============================================================================

interface CornerDecorationProps {
  color: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

function CornerDecoration({ color, position }: CornerDecorationProps) {
  const rotation = {
    topLeft: '0deg',
    topRight: '90deg',
    bottomLeft: '-90deg',
    bottomRight: '180deg',
  };
  
  const positionStyle: ViewStyle = {
    topLeft: { top: 0, left: 0 },
    topRight: { top: 0, right: 0 },
    bottomLeft: { bottom: 0, left: 0 },
    bottomRight: { bottom: 0, right: 0 },
  }[position];
  
  return (
    <View style={[styles.cornerDecoration, positionStyle, { transform: [{ rotate: rotation[position] }] }]}>
      <Svg width={24} height={24} viewBox="0 0 32 32">
        <Path
          d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z"
          fill={color}
          opacity={0.8}
        />
      </Svg>
    </View>
  );
}

// =============================================================================
// SCANLINES OVERLAY
// =============================================================================

interface ScanlinesProps {
  color: string;
  intensity: number;
}

function Scanlines({ color, intensity }: ScanlinesProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateY, {
        toValue: 100,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);
  
  // Generate scanline rows
  const lines = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 100; i += 3) {
      rows.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            top: `${i}%`,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: color,
            opacity: 0.5 * intensity,
          }}
        />
      );
    }
    return rows;
  }, [color, intensity]);
  
  return (
    <Animated.View
      style={[
        styles.scanlinesContainer,
        {
          transform: [
            {
              translateY: translateY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 30],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {lines}
    </Animated.View>
  );
}

// =============================================================================
// HOLOGRAPHIC CONTAINER
// =============================================================================

interface HolographicContainerProps {
  children: ReactNode;
  config?: Partial<HolographicConfig>;
  style?: ViewStyle;
  onPress?: () => void;
}

export function HolographicContainer({
  children,
  config: userConfig,
  style,
  onPress,
}: HolographicContainerProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const flickerOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  
  const config: HolographicConfig = {
    intensity: userConfig?.intensity ?? 'medium',
    colorTheme: userConfig?.colorTheme ?? 'cyan',
    enableScanlines: userConfig?.enableScanlines ?? true,
    enableFlicker: userConfig?.enableFlicker ?? true,
    enableHaptics: userConfig?.enableHaptics ?? true,
    glitchProbability: userConfig?.glitchProbability ?? 0.02,
    ...userConfig,
  };
  
  const theme = getTheme(config.colorTheme, config.customColors);
  
  const intensityMultiplier = {
    subtle: 0.5,
    medium: 1,
    intense: 1.5,
  }[config.intensity];
  
  // Glow pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);
  
  // Flicker effect
  useEffect(() => {
    if (!config.enableFlicker) return;
    
    const flickerInterval = setInterval(() => {
      const randomOpacity = 0.95 + Math.random() * 0.05;
      flickerOpacity.setValue(randomOpacity);
    }, 100);
    
    return () => clearInterval(flickerInterval);
  }, [config.enableFlicker]);
  
  // Random glitch effect
  useEffect(() => {
    if (!config.enableFlicker) return;
    
    const glitchInterval = setInterval(() => {
      if (Math.random() < config.glitchProbability) {
        setIsGlitching(true);
        if (config.enableHaptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 150);
      }
    }, 500);
    
    return () => clearInterval(glitchInterval);
  }, [config.enableFlicker, config.glitchProbability, config.enableHaptics]);
  
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
    
    if (config.enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [config.enableHaptics]);
  
  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const borderGlow = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [15 * intensityMultiplier, 25 * intensityMultiplier],
  });
  
  const Container = onPress ? Pressable : View;
  const containerProps = onPress ? {
    onPress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  } : {};
  
  return (
    <Animated.View
      style={[
        styles.holographicContainer,
        {
          opacity: flickerOpacity,
          transform: [{ scale: scaleAnim }],
          borderColor: theme.primary,
          backgroundColor: theme.background,
        },
        // Shadow for glow effect (iOS)
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20 * intensityMultiplier,
        },
        style,
      ]}
    >
      <Container {...containerProps} style={styles.containerInner}>
        {/* Holographic gradient overlay */}
        <LinearGradient
          colors={[
            'transparent',
            theme.glow,
            'transparent',
            theme.glow,
            'transparent',
          ] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientOverlay, { opacity: 0.1 * intensityMultiplier }]}
        />
        
        {/* Scanlines */}
        {config.enableScanlines && (
          <Scanlines color={theme.scanline} intensity={intensityMultiplier} />
        )}
        
        {/* Glitch overlay */}
        {isGlitching && (
          <LinearGradient
            colors={['transparent', theme.accent, 'transparent'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.glitchOverlay}
          />
        )}
        
        {/* Corner decorations */}
        <CornerDecoration color={theme.primary} position="topLeft" />
        <CornerDecoration color={theme.primary} position="topRight" />
        <CornerDecoration color={theme.primary} position="bottomLeft" />
        <CornerDecoration color={theme.primary} position="bottomRight" />
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {children}
        </View>
      </Container>
    </Animated.View>
  );
}

// =============================================================================
// HOLOGRAPHIC TEXT
// =============================================================================

interface HolographicTextProps {
  children: ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'label';
  colorTheme?: HolographicConfig['colorTheme'];
  animate?: boolean;
  glowIntensity?: number;
  style?: TextStyle;
}

export function HolographicText({
  children,
  variant = 'body',
  colorTheme = 'cyan',
  animate = true,
  glowIntensity = 1,
  style,
}: HolographicTextProps) {
  const theme = getTheme(colorTheme);
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (!animate) return;
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animate]);
  
  const variantStyles: Record<string, TextStyle> = {
    title: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 2,
    },
    subtitle: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: 1,
    },
    body: {
      fontSize: 16,
      fontWeight: '500',
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  };
  
  const textShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5 * glowIntensity, 15 * glowIntensity],
  });
  
  return (
    <Animated.Text
      style={[
        variantStyles[variant],
        {
          color: theme.primary,
          textShadowColor: theme.glow,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: animate ? textShadowRadius : 10 * glowIntensity,
        },
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

// =============================================================================
// HOLOGRAPHIC BUTTON
// =============================================================================

interface HolographicButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

export function HolographicButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  colorTheme = 'cyan',
  style,
}: HolographicButtonProps) {
  const theme = getTheme(colorTheme);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
  
  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 16, paddingVertical: 8 },
    md: { paddingHorizontal: 24, paddingVertical: 12 },
    lg: { paddingHorizontal: 32, paddingVertical: 16 },
  };
  
  const textSizes: Record<string, number> = {
    sm: 12,
    md: 14,
    lg: 16,
  };
  
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          gradientColors: [`${theme.primary}20`, `${theme.secondary}30`] as const,
          borderColor: theme.primary,
          textColor: theme.primary,
        };
      case 'secondary':
        return {
          gradientColors: ['transparent', 'transparent'] as const,
          borderColor: theme.secondary,
          textColor: theme.secondary,
        };
      case 'danger':
        return {
          gradientColors: ['rgba(255,50,50,0.2)', 'rgba(255,100,100,0.3)'] as const,
          borderColor: 'rgba(255,100,100,0.8)',
          textColor: 'rgba(255,150,150,1)',
        };
      case 'ghost':
        return {
          gradientColors: ['transparent', 'transparent'] as const,
          borderColor: 'transparent',
          textColor: theme.primary,
        };
    }
  };
  
  const { gradientColors, borderColor, textColor } = getVariantColors();
  
  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };
  
  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.8],
  });
  
  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : 1,
        },
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity,
          shadowRadius: 15,
        },
        style,
      ]}
    >
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.buttonBase,
            sizeStyles[size],
            {
              borderColor,
              borderWidth: variant === 'ghost' ? 0 : variant === 'secondary' ? 1 : 2,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <Text
              style={[
                styles.buttonText,
                {
                  fontSize: textSizes[size],
                  color: textColor,
                  textShadowColor: theme.glow,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                },
              ]}
            >
              {children}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// HOLOGRAPHIC CARD
// =============================================================================

interface HolographicCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
  onPress?: () => void;
}

export function HolographicCard({
  children,
  header,
  footer,
  colorTheme = 'cyan',
  style,
  onPress,
}: HolographicCardProps) {
  const theme = getTheme(colorTheme);
  
  return (
    <HolographicContainer
      config={{ colorTheme }}
      style={style}
      onPress={onPress}
    >
      {/* Header */}
      {header && (
        <View style={[styles.cardSection, { borderBottomWidth: 1, borderBottomColor: `${theme.primary}40` }]}>
          {header}
        </View>
      )}
      
      {/* Body */}
      <View style={styles.cardSection}>
        {children}
      </View>
      
      {/* Footer */}
      {footer && (
        <View style={[styles.cardSection, { borderTopWidth: 1, borderTopColor: `${theme.primary}40` }]}>
          {footer}
        </View>
      )}
    </HolographicContainer>
  );
}

// =============================================================================
// HOLOGRAPHIC AVATAR
// =============================================================================

interface HolographicAvatarProps {
  source?: { uri: string } | number;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

export function HolographicAvatar({
  source,
  name,
  size = 'md',
  status,
  colorTheme = 'cyan',
  style,
}: HolographicAvatarProps) {
  const theme = getTheme(colorTheme);
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const statusPulse = useRef(new Animated.Value(1)).current;
  
  const sizeValues = {
    sm: { container: 32, text: 10, status: 8 },
    md: { container: 48, text: 14, status: 12 },
    lg: { container: 64, text: 18, status: 14 },
    xl: { container: 96, text: 28, status: 18 },
  };
  
  const statusColors = {
    online: 'rgb(50, 255, 100)',
    offline: 'rgb(150, 150, 150)',
    away: 'rgb(255, 200, 50)',
    busy: 'rgb(255, 80, 80)',
  };
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  
  // Ring animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
  
  // Status pulse
  useEffect(() => {
    if (!status) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [status]);
  
  const currentSize = sizeValues[size];
  
  return (
    <View style={[{ width: currentSize.container, height: currentSize.container }, style]}>
      {/* Animated ring */}
      <Animated.View
        style={[
          styles.avatarRing,
          {
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
            borderColor: theme.accent,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />
      
      {/* Avatar container */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
            borderColor: theme.primary,
            backgroundColor: theme.background,
          },
          Platform.OS === 'ios' && {
            shadowColor: theme.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 10,
          },
        ]}
      >
        {source ? (
          <Image
            source={source}
            style={[
              styles.avatarImage,
              {
                width: currentSize.container - 4,
                height: currentSize.container - 4,
                borderRadius: (currentSize.container - 4) / 2,
              },
            ]}
          />
        ) : (
          <Text
            style={[
              styles.avatarInitials,
              {
                fontSize: currentSize.text,
                color: theme.primary,
              },
            ]}
          >
            {initials}
          </Text>
        )}
      </View>
      
      {/* Status indicator */}
      {status && (
        <Animated.View
          style={[
            styles.statusIndicator,
            {
              width: currentSize.status,
              height: currentSize.status,
              borderRadius: currentSize.status / 2,
              backgroundColor: statusColors[status],
              borderColor: theme.background,
              transform: [{ scale: statusPulse }],
            },
            Platform.OS === 'ios' && {
              shadowColor: statusColors[status],
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
            },
          ]}
        />
      )}
    </View>
  );
}

// =============================================================================
// HOLOGRAPHIC INPUT
// =============================================================================

interface HolographicInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

export function HolographicInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  disabled = false,
  colorTheme = 'cyan',
  style,
}: HolographicInputProps) {
  const theme = getTheme(colorTheme);
  const [isFocused, setIsFocused] = useState(false);
  const focusLineWidth = useRef(new Animated.Value(0)).current;
  const glowIntensity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(focusLineWidth, {
        toValue: isFocused ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(glowIntensity, {
        toValue: isFocused ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    
    if (isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isFocused]);
  
  const lineWidthPercent = focusLineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const shadowRadius = glowIntensity.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 20],
  });
  
  return (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          borderColor: isFocused ? theme.primary : `${theme.secondary}50`,
          backgroundColor: theme.background,
        },
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isFocused ? 0.6 : 0.2,
          shadowRadius,
        },
        style,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={`${theme.secondary}80`}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.textInput,
          {
            color: theme.primary,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      />
      
      {/* Focus indicator line */}
      <Animated.View
        style={[
          styles.focusLine,
          {
            width: lineWidthPercent,
            backgroundColor: theme.accent,
          },
          Platform.OS === 'ios' && {
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          },
        ]}
      />
    </Animated.View>
  );
}

// =============================================================================
// HOLOGRAPHIC PROGRESS
// =============================================================================

interface HolographicProgressProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

export function HolographicProgress({
  value,
  showLabel = true,
  size = 'md',
  colorTheme = 'cyan',
  style,
}: HolographicProgressProps) {
  const theme = getTheme(colorTheme);
  const progressWidth = useRef(new Animated.Value(0)).current;
  const shineTranslate = useRef(new Animated.Value(-100)).current;
  
  const heightValues = {
    sm: 8,
    md: 16,
    lg: 24,
  };
  
  const clampedValue = Math.max(0, Math.min(100, value));
  
  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: clampedValue,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [clampedValue]);
  
  // Shine animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shineTranslate, {
        toValue: 100,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);
  
  const widthPercent = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <View style={style}>
      <View
        style={[
          styles.progressTrack,
          {
            height: heightValues[size],
            backgroundColor: theme.background,
            borderColor: `${theme.secondary}40`,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthPercent,
              height: '100%',
            },
          ]}
        >
          <LinearGradient
            colors={[theme.secondary, theme.primary] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressGradient,
              Platform.OS === 'ios' && {
                shadowColor: theme.glow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 15,
              },
            ]}
          >
            {/* Shine effect */}
            <Animated.View
              style={[
                styles.progressShine,
                {
                  transform: [
                    {
                      translateX: shineTranslate.interpolate({
                        inputRange: [-100, 100],
                        outputRange: [-50, 150],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['transparent', `${theme.accent}80`, 'transparent'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shineGradient}
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
      
      {showLabel && (
        <Text style={[styles.progressLabel, { color: theme.primary }]}>
          {clampedValue.toFixed(0)}%
        </Text>
      )}
    </View>
  );
}

// =============================================================================
// HOLOGRAPHIC NOTIFICATION
// =============================================================================

interface HolographicNotificationProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
  duration?: number;
  style?: ViewStyle;
}

export function HolographicNotification({
  message,
  type = 'info',
  onDismiss,
  duration = 5000,
  style,
}: HolographicNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const typeThemes: Record<string, HolographicConfig['colorTheme']> = {
    info: 'cyan',
    success: 'green',
    warning: 'gold',
    error: 'purple',
  };
  
  const colorTheme = typeThemes[type] ?? 'cyan';
  const theme = getTheme(colorTheme);
  
  useEffect(() => {
    // Enter animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    Haptics.notificationAsync(
      type === 'success' ? Haptics.NotificationFeedbackType.Success :
      type === 'error' ? Haptics.NotificationFeedbackType.Error :
      Haptics.NotificationFeedbackType.Warning
    );
    
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss();
      }, duration);
      return () => {
        clearTimeout(timer);
        pulse.stop();
      };
    }
    
    return () => pulse.stop();
  }, [duration]);
  
  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };
  
  if (!isVisible) return null;
  
  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        {
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <HolographicContainer config={{ colorTheme }}>
        <View style={styles.notificationContent}>
          <Animated.View
            style={[
              styles.notificationDot,
              {
                backgroundColor: theme.accent,
                transform: [{ scale: pulseAnim }],
              },
              Platform.OS === 'ios' && {
                shadowColor: theme.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
              },
            ]}
          />
          <Text style={[styles.notificationMessage, { color: theme.primary }]}>
            {message}
          </Text>
          {onDismiss && (
            <TouchableOpacity onPress={dismiss} style={styles.notificationDismiss}>
              <Text style={{ color: theme.secondary, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </HolographicContainer>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Container
  holographicContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  containerInner: {
    flex: 1,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  glitchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    pointerEvents: 'none',
  },
  cornerDecoration: {
    position: 'absolute',
    width: 24,
    height: 24,
    zIndex: 20,
  },
  
  // Button
  buttonBase: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Card
  cardSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Avatar
  avatarContainer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarInitials: {
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
  
  // Input
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  focusLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
  
  // Progress
  progressTrack: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressShine: {
    ...StyleSheet.absoluteFillObject,
    width: 50,
  },
  shineGradient: {
    flex: 1,
  },
  progressLabel: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'right',
  },
  
  // Notification
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  notificationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  notificationMessage: {
    flex: 1,
    fontSize: 14,
  },
  notificationDismiss: {
    padding: 4,
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getTheme,
  CornerDecoration,
  Scanlines,
};
