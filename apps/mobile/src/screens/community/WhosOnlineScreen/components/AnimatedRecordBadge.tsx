import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedRecordBadgeProps {
  record: number;
  recordDate: string | null;
  scrollY: Animated.Value;
}

/**
 * AnimatedRecordBadge - Trophy badge showing record stats
 * Features shimmer effect, trophy bounce, and scroll parallax
 */
export function AnimatedRecordBadge({ record, recordDate, scrollY }: AnimatedRecordBadgeProps) {
  const trophyBounce = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.spring(entryAnim, {
      toValue: 1,
      friction: 6,
      tension: 50,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Trophy bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyBounce, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(trophyBounce, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [entryAnim, trophyBounce, shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const parallaxScale = scrollY.interpolate({
    inputRange: [-50, 0, 100],
    outputRange: [1.05, 1, 0.95],
    extrapolate: 'clamp',
  });

  const formatRecordDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Animated.View
      style={[
        styles.recordContainerEnhanced,
        {
          transform: [{ scale: Animated.multiply(entryAnim, parallaxScale) }],
          opacity: entryAnim,
        },
      ]}
    >
      <BlurView intensity={40} tint="dark" style={styles.recordBlur}>
        {/* Shimmer effect */}
        <Animated.View
          style={[styles.shimmerEffect, { transform: [{ translateX: shimmerTranslate }] }]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(245, 158, 11, 0.2)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: trophyBounce }] }}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.trophyContainer}>
            <Ionicons name="trophy" size={24} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <View style={styles.recordInfo}>
          <Text style={styles.recordLabel}>
            Record: <Text style={styles.recordValue}>{record}</Text> users online
          </Text>
          <Text style={styles.recordDate}>{formatRecordDate(recordDate)}</Text>
        </View>

        <View style={styles.recordCrown}>
          <Ionicons name="ribbon" size={16} color="#f59e0b" />
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  recordContainerEnhanced: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  recordBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 400,
  },
  trophyContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  recordValue: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 16,
  },
  recordDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  recordCrown: {
    marginLeft: 8,
  },
});
