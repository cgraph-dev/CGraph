/**
 * PremiumBanner Component (Mobile)
 *
 * Mobile-optimized premium upsell banners.
 * Features:
 * - Multiple variants
 * - Animated backgrounds
 * - Dismissible option
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PremiumBannerProps {
  title?: string;
  description?: string;
  features?: string[];
  variant?: 'hero' | 'bar' | 'card' | 'floating' | 'minimal';
  dismissible?: boolean;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export const PremiumBanner: React.FC<PremiumBannerProps> = ({
  title = 'Upgrade to Premium',
  description = 'Unlock all features and get the best experience',
  features = ['Unlimited access', 'No ads', 'Exclusive themes'],
  variant = 'card',
  dismissible = false,
  onUpgrade,
  onDismiss,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Float animation for floating variant
    if (variant === 'floating') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [variant]);

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgrade?.();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  if (variant === 'bar') {
    return (
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.barContainer}
      >
        <View style={styles.barContent}>
          <MaterialCommunityIcons name="crown" size={18} color="#FFFFFF" />
          <Text style={styles.barText} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Pressable onPress={handleUpgrade} style={styles.barButton}>
          <Text style={styles.barButtonText}>Upgrade</Text>
        </Pressable>
        {dismissible && (
          <Pressable onPress={handleDismiss} style={styles.barDismiss}>
            <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}
      </LinearGradient>
    );
  }

  if (variant === 'minimal') {
    return (
      <Pressable onPress={handleUpgrade} style={styles.minimalContainer}>
        <MaterialCommunityIcons name="crown" size={16} color="#8B5CF6" />
        <Text style={styles.minimalText}>Upgrade to Premium</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#8B5CF6" />
      </Pressable>
    );
  }

  if (variant === 'floating') {
    return (
      <Animated.View 
        style={[
          styles.floatingContainer,
          { transform: [{ translateY: floatAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          style={styles.floatingGradient}
        >
          <View style={styles.floatingContent}>
            <MaterialCommunityIcons name="crown" size={24} color="#FFFFFF" />
            <View style={styles.floatingText}>
              <Text style={styles.floatingTitle}>{title}</Text>
              <Text style={styles.floatingDesc} numberOfLines={1}>
                {description}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleUpgrade} style={styles.floatingButton}>
            <Text style={styles.floatingButtonText}>Upgrade</Text>
          </Pressable>
        </LinearGradient>
        {dismissible && (
          <Pressable onPress={handleDismiss} style={styles.floatingDismiss}>
            <MaterialCommunityIcons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>
        )}
      </Animated.View>
    );
  }

  if (variant === 'hero') {
    return (
      <LinearGradient
        colors={['#1F1F3D', '#0F0F1F']}
        style={styles.heroContainer}
      >
        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslateX }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(139, 92, 246, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        {dismissible && (
          <Pressable onPress={handleDismiss} style={styles.heroDismiss}>
            <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.5)" />
          </Pressable>
        )}

        <View style={styles.heroIcon}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.heroIconGradient}
          >
            <MaterialCommunityIcons name="crown" size={40} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroDescription}>{description}</Text>

        <View style={styles.heroFeatures}>
          {features.map((feature, index) => (
            <View key={index} style={styles.heroFeatureRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#8B5CF6" />
              <Text style={styles.heroFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={handleUpgrade}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.heroButton}
          >
            <Text style={styles.heroButtonText}>Upgrade Now</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    );
  }

  // Default card variant
  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.2)', 'rgba(99, 102, 241, 0.1)']}
        style={styles.cardGradient}
      >
        {dismissible && (
          <Pressable onPress={handleDismiss} style={styles.cardDismiss}>
            <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <MaterialCommunityIcons name="crown" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {description}
            </Text>
          </View>
        </View>

        <View style={styles.cardFeatures}>
          {features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.cardFeatureItem}>
              <MaterialCommunityIcons name="check" size={14} color="#10B981" />
              <Text style={styles.cardFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={handleUpgrade}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.cardButton}
          >
            <Text style={styles.cardButtonText}>Upgrade</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // Bar variant
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  barContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  barButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  barButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  barDismiss: {
    marginLeft: 8,
    padding: 4,
  },

  // Minimal variant
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },
  minimalText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },

  // Floating variant
  floatingContainer: {
    position: 'relative',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  floatingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingText: {
    flex: 1,
  },
  floatingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  floatingDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  floatingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  floatingDismiss: {
    position: 'absolute',
    top: -8,
    right: -8,
  },

  // Hero variant
  heroContainer: {
    padding: 24,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  heroDismiss: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  heroFeatures: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  heroFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroFeatureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Card variant
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  cardGradient: {
    padding: 16,
  },
  cardDismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cardFeatures: {
    marginBottom: 16,
    gap: 8,
  },
  cardFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardFeatureText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PremiumBanner;
