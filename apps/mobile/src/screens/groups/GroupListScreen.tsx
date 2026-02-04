/**
 * GroupListScreen - Premium UI with Glassmorphism & Animations
 * Features: GlassCard, morphing animations, magnetic cards, 3D perspective,
 * particle effects, spring physics, and gesture-based interactions
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { GroupsStackParamList, Group } from '../../types';
import GlassCard from '../../components/ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Floating particle component for active groups
function FloatingParticles({ isActive }: { isActive: boolean }) {
  const particles = useRef(
    Array.from({ length: 6 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!isActive) return;

    particles.forEach((particle, index) => {
      const delay = index * 200;
      const duration = 2000 + Math.random() * 1000;

      const animate = () => {
        const randomX = (Math.random() - 0.5) * 40;
        const randomY = (Math.random() - 0.5) * 30;

        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.translateX, {
              toValue: randomX,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: randomY,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 0.8 + Math.random() * 0.4,
                duration: duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.3,
                duration: duration / 2,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.6,
                duration: duration / 3,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: (duration * 2) / 3,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => {
          particle.translateX.setValue(0);
          particle.translateY.setValue(0);
          animate();
        });
      };

      setTimeout(animate, delay);
    });
  }, [isActive]);

  if (!isActive) return null;

  return (
    <View style={styles.particlesContainer}>
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: 10 + (index % 3) * 15,
              top: 10 + Math.floor(index / 3) * 15,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.particleGradient} />
        </Animated.View>
      ))}
    </View>
  );
}

// Animated member avatars stacked
function MemberAvatarStack({ memberCount, colors }: { memberCount: number; colors: ThemeColors }) {
  const displayCount = Math.min(3, memberCount);
  const anims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      anims.map((anim, index) =>
        Animated.spring(anim, {
          toValue: index < displayCount ? 1 : 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [displayCount]);

  return (
    <View style={styles.avatarStack}>
      {anims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.stackedAvatar,
            {
              backgroundColor: ['#8b5cf6', '#ec4899', '#10b981'][index],
              marginLeft: index > 0 ? -8 : 0,
              zIndex: 3 - index,
              transform: [
                { scale: anim },
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
              opacity: anim,
            },
          ]}
        >
          <Ionicons name="person" size={10} color="#fff" />
        </Animated.View>
      ))}
      {memberCount > 3 && (
        <View style={[styles.avatarCountBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.avatarCountText, { color: colors.text }]}>+{memberCount - 3}</Text>
        </View>
      )}
    </View>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupList'>;
};

// Morphing Group Card with 3D perspective and magnetic effects
const MorphingGroupCard = ({
  item,
  index,
  onPress,
  colors,
  isDark,
}: {
  item: Group;
  index: number;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) => {
  // Entry animations
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const rotateYAnim = useRef(new Animated.Value(-15)).current;

  // Interactive animations
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const magnetScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const arrowTranslate = useRef(new Animated.Value(0)).current;

  // Icon morph animation for active groups
  const iconMorphScale = useRef(new Animated.Value(1)).current;
  const iconMorphRotate = useRef(new Animated.Value(0)).current;

  const memberCount = item.member_count || 0;
  const isLargeGroup = memberCount > 100;
  const isActiveGroup = memberCount > 50;

  useEffect(() => {
    // Staggered entry with 3D flip
    const delay = index * 80;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotateYAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous subtle animation for active groups
    if (isActiveGroup) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconMorphScale, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconMorphScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(iconMorphRotate, {
            toValue: 5,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconMorphRotate, {
            toValue: -5,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [index, isActiveGroup]);

  // Pan responder for magnetic tilt effect
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cardWidth = SCREEN_WIDTH - 32;
        const cardHeight = 90;

        // Calculate tilt based on touch position
        const tiltXValue = (locationY / cardHeight - 0.5) * 10;
        const tiltYValue = (locationX / cardWidth - 0.5) * -8;

        Animated.parallel([
          Animated.spring(tiltX, {
            toValue: tiltXValue,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(tiltY, {
            toValue: tiltYValue,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(magnetScale, {
            toValue: 1.02,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(arrowTranslate, {
            toValue: 5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.spring(tiltX, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(tiltY, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(magnetScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(arrowTranslate, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Morphing press animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 15,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(iconRotate, {
          toValue: 0,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress();
  };

  // Transform interpolations
  const rotateX = tiltX.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const rotateY = tiltY.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const entryRotateY = rotateYAnim.interpolate({
    inputRange: [-15, 0],
    outputRange: ['-15deg', '0deg'],
  });

  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 15],
    outputRange: ['0deg', '15deg'],
  });

  const iconMorphRotation = iconMorphRotate.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.groupItemWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { perspective: 1000 },
            { translateX: slideAnim },
            { scale: Animated.multiply(scaleAnim, magnetScale) },
            { rotateY: entryRotateY },
            { rotateX: rotateX },
            { rotateY: rotateY },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={1} onPress={handlePress}>
        {/* Glow effect layer */}
        <Animated.View
          style={[
            styles.glowLayer,
            {
              opacity: glowOpacity,
              backgroundColor: isActiveGroup ? '#8b5cf6' : '#10b981',
            },
          ]}
        />

        <GlassCard
          variant={isActiveGroup ? 'neon' : 'frosted'}
          intensity="subtle"
          style={styles.groupCard}
          glowColor={isActiveGroup ? '#8b5cf6' : undefined}
        >
          <View style={styles.groupInner}>
            {/* Floating particles for active groups */}
            <FloatingParticles isActive={isActiveGroup} />

            {/* Group Icon with morph animation */}
            <View style={styles.groupIconSection}>
              <Animated.View
                style={{
                  transform: [
                    { rotate: iconRotation },
                    { scale: iconMorphScale },
                    { rotate: iconMorphRotation },
                  ],
                }}
              >
                {item.icon_url ? (
                  <Image source={{ uri: item.icon_url }} style={styles.groupIconImage} />
                ) : (
                  <LinearGradient
                    colors={isLargeGroup ? ['#8b5cf6', '#ec4899'] : ['#10b981', '#059669']}
                    style={styles.groupIconPlaceholder}
                  >
                    <Text style={styles.groupIconText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                )}
              </Animated.View>

              {/* Animated active indicator */}
              {isActiveGroup && (
                <Animated.View
                  style={[
                    styles.activeIndicator,
                    {
                      transform: [{ scale: iconMorphScale }],
                    },
                  ]}
                >
                  <View style={styles.activeDot} />
                </Animated.View>
              )}
            </View>

            {/* Group Info */}
            <View style={styles.groupInfo}>
              <View style={styles.groupNameRow}>
                <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {isLargeGroup && (
                  <Animated.View
                    style={{
                      transform: [{ scale: iconMorphScale }],
                    }}
                  >
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.verifiedBadge}>
                      <Ionicons name="flame" size={10} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>

              <View style={styles.groupMeta}>
                {/* Animated member avatar stack */}
                <MemberAvatarStack memberCount={memberCount} colors={colors} />

                <Text style={[styles.groupMembers, { color: colors.textSecondary }]}>
                  {memberCount.toLocaleString()} members
                </Text>
              </View>

              {item.description && (
                <Text
                  style={[styles.groupDescription, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              )}
            </View>

            {/* Animated Arrow */}
            <Animated.View
              style={[
                styles.arrowContainer,
                {
                  transform: [{ translateX: arrowTranslate }],
                },
              ]}
            >
              <LinearGradient
                colors={isActiveGroup ? ['#8b5cf6', '#7c3aed'] : [colors.surface, colors.surface]}
                style={styles.arrowGradient}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isActiveGroup ? '#fff' : colors.textTertiary}
                />
              </LinearGradient>
            </Animated.View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated header with particle effect
function AnimatedHeader({
  colors,
  onCreatePress,
}: {
  colors: ThemeColors;
  onCreatePress: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onCreatePress();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <TouchableOpacity onPress={handlePress} style={styles.headerButton}>
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }, { rotate: rotation }],
        }}
      >
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.headerButtonGradient}>
          <Ionicons name="add" size={20} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function GroupListScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Animate header entrance
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.text,
        fontWeight: '700',
      },
      headerRight: () => (
        <AnimatedHeader
          colors={colors}
          onCreatePress={() => {
            // Navigate to create group
          }}
        />
      ),
    });
  }, [colors, navigation]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/v1/groups');
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchGroups();
    setRefreshing(false);
  };

  const renderGroup = useCallback(
    ({ item, index }: { item: Group; index: number }) => (
      <MorphingGroupCard
        item={item}
        index={index}
        onPress={() => navigation.navigate('Group', { groupId: item.id })}
        colors={colors}
        isDark={isDark}
      />
    ),
    [colors, isDark, navigation]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <GlassCard variant="crystal" intensity="medium" style={styles.emptyCard}>
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.emptyIconContainer}>
          <Ionicons name="people" size={48} color="#fff" />
        </LinearGradient>

        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Groups Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Join a community or create{'\n'}your own group
        </Text>

        <View style={styles.emptyButtons}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Create group
            }}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.emptyButton}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>Create Group</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Browse groups
            }}
            activeOpacity={0.8}
          >
            <GlassCard variant="frosted" intensity="subtle" style={styles.emptyButtonOutline}>
              <View style={styles.emptyButtonOutlineInner}>
                <Ionicons name="compass" size={18} color={colors.primary} />
                <Text style={[styles.emptyButtonOutlineText, { color: colors.text }]}>
                  Browse Groups
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[styles.listContent, groups.length === 0 && styles.emptyContainer]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  groupItemWrapper: {
    marginBottom: 4,
  },
  glowLayer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.3,
  },
  groupCard: {
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
  },
  groupInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  particleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  groupIconSection: {
    position: 'relative',
    marginRight: 14,
  },
  groupIconImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  groupIconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  groupIconText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 3,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#111827',
  },
  avatarCountBadge: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  avatarCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  groupMembers: {
    fontSize: 13,
  },
  groupDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    width: '100%',
    maxWidth: 320,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyButtons: {
    gap: 12,
    width: '100%',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyButtonOutline: {
    borderRadius: 20,
    padding: 0,
  },
  emptyButtonOutlineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
