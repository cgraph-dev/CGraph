import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import api from '../../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface OnlineUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  userGroup: string;
  userGroupColor: string | null;
  lastActivity: string;
  currentActivity: string | null;
}

interface OnlineStats {
  totalOnline: number;
  members: number;
  guests: number;
  bots: number;
  record: number;
  recordDate: string | null;
}

interface ActivityGroup {
  activity: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
}

// Timer ref type for cross-platform compatibility
type TimerRef = ReturnType<typeof setInterval> | null;

// ============================================================================
// FLOATING ORBS BACKGROUND
// ============================================================================

function FloatingOrbs() {
  const orbs = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * SCREEN_HEIGHT * 0.6),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      opacity: new Animated.Value(0.1 + Math.random() * 0.2),
      color: ['#10b981', '#8b5cf6', '#3b82f6', '#ec4899'][i % 4],
      size: 60 + Math.random() * 100,
    }))
  ).current;

  useEffect(() => {
    orbs.forEach((orb, index) => {
      const animateOrb = () => {
        const targetX = Math.random() * (SCREEN_WIDTH - orb.size);
        const targetY = Math.random() * (SCREEN_HEIGHT * 0.5);
        const duration = 8000 + Math.random() * 6000;

        Animated.parallel([
          Animated.timing(orb.x, {
            toValue: targetX,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb.y, {
            toValue: targetY,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(orb.scale, {
              toValue: 0.6 + Math.random() * 0.6,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orb.scale, {
              toValue: 0.4 + Math.random() * 0.4,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(orb.opacity, {
              toValue: 0.2 + Math.random() * 0.15,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(orb.opacity, {
              toValue: 0.1 + Math.random() * 0.1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animateOrb());
      };

      setTimeout(() => animateOrb(), index * 500);
    });
  }, []);

  return (
    <View style={styles.orbsContainer} pointerEvents="none">
      {orbs.map((orb, index) => (
        <Animated.View
          key={index}
          style={[
            styles.orb,
            {
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              transform: [
                { translateX: orb.x },
                { translateY: orb.y },
                { scale: orb.scale },
              ],
              opacity: orb.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ============================================================================
// WAVE EFFECT COMPONENT
// ============================================================================

function WaveEffect({ scrollY }: { scrollY: Animated.Value }) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(wave1, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(wave2, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const wave1TranslateX = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });

  const wave2TranslateX = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });

  const waveOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0.3, 0.1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.waveContainer, { opacity: waveOpacity }]}>
      <Animated.View
        style={[
          styles.wave,
          { transform: [{ translateX: wave1TranslateX }] },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(16, 185, 129, 0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.waveGradient}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.wave,
          styles.wave2,
          { transform: [{ translateX: wave2TranslateX }] },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.waveGradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ============================================================================
// MAGNETIC USER CARD
// ============================================================================

function MagneticUserCard({
  user,
  index,
  onPress,
  scrollY,
}: {
  user: OnlineUser;
  index: number;
  onPress: () => void;
  scrollY: Animated.Value;
}) {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const statusPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 60;

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
    ]).start();

    // Continuous status pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1.4,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [index]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cardWidth = SCREEN_WIDTH - 32;
        const cardHeight = 70;

        const tiltXValue = ((locationY / cardHeight) - 0.5) * 8;
        const tiltYValue = ((locationX / cardWidth) - 0.5) * -6;

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
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 150,
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
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        onPress();
      },
    })
  ).current;

  // Parallax effect based on scroll
  const parallaxTranslate = scrollY.interpolate({
    inputRange: [-100, 0, 100 * (index + 1)],
    outputRange: [20, 0, -10 * (index + 1) * 0.1],
    extrapolate: 'clamp',
  });

  const parallaxScale = scrollY.interpolate({
    inputRange: [0, 100 * (index + 1)],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const rotateX = tiltX.interpolate({
    inputRange: [-8, 8],
    outputRange: ['-8deg', '8deg'],
  });

  const rotateY = tiltY.interpolate({
    inputRange: [-6, 6],
    outputRange: ['-6deg', '6deg'],
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Animated.View
      style={[
        styles.magneticCardWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { perspective: 1000 },
            { translateY: Animated.add(slideAnim, parallaxTranslate) },
            { scale: Animated.multiply(scaleAnim, parallaxScale) },
            { rotateX: rotateX },
            { rotateY: rotateY },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.cardGlow,
          {
            opacity: glowAnim,
            backgroundColor: user.userGroupColor || '#10b981',
          },
        ]}
      />

      <BlurView intensity={30} tint="dark" style={styles.userItemEnhanced}>
        <View style={styles.userAvatar}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[user.userGroupColor || '#10b981', '#059669']}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarInitial}>
                {(user.displayName || user.username)[0].toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          {/* Animated online indicator */}
          <View style={styles.onlineIndicatorWrapper}>
            <Animated.View
              style={[
                styles.onlineIndicatorPulse,
                { transform: [{ scale: statusPulse }] },
              ]}
            />
            <View style={styles.onlineIndicator} />
          </View>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text
              style={[styles.userName, { color: user.userGroupColor || '#fff' }]}
              numberOfLines={1}
            >
              {user.displayName || user.username}
            </Text>
            <View style={styles.userGroupBadge}>
              <Text style={[styles.userGroupText, { color: user.userGroupColor || '#9ca3af' }]}>
                {user.userGroup}
              </Text>
            </View>
          </View>
          <View style={styles.userMetaRow}>
            {user.currentActivity && (
              <Text style={styles.userActivity} numberOfLines={1}>
                {user.currentActivity}
              </Text>
            )}
            <Text style={styles.userTime}>{getTimeAgo(user.lastActivity)}</Text>
          </View>
        </View>

        {/* Activity indicator */}
        <View style={styles.activityIndicator}>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </View>
      </BlurView>
    </Animated.View>
  );
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

function generateFallbackUsers(): OnlineUser[] {
  return [
    { id: '1', username: 'admin', displayName: 'Administrator', avatarUrl: null, userGroup: 'Admin', userGroupColor: '#ef4444', lastActivity: new Date().toISOString(), currentActivity: 'Viewing Dashboard' },
    { id: '2', username: 'moderator', displayName: 'Mod User', avatarUrl: null, userGroup: 'Moderator', userGroupColor: '#3b82f6', lastActivity: new Date().toISOString(), currentActivity: 'Reading Thread' },
    { id: '3', username: 'jane_smith', displayName: 'Jane Smith', avatarUrl: null, userGroup: 'Premium', userGroupColor: '#8b5cf6', lastActivity: new Date().toISOString(), currentActivity: 'Posting Reply' },
    { id: '4', username: 'active_user', displayName: 'Active User', avatarUrl: null, userGroup: 'Member', userGroupColor: '#10b981', lastActivity: new Date().toISOString(), currentActivity: 'Browsing Forum' },
  ];
}

function generateFallbackStats(): OnlineStats {
  return {
    totalOnline: 47,
    members: 12,
    guests: 32,
    bots: 3,
    record: 156,
    recordDate: '2025-12-25T20:00:00Z',
  };
}

// ============================================================================
// PULSING INDICATOR COMPONENT
// ============================================================================

function PulsingDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.pulsingDotContainer}>
      {/* Outer rotating ring */}
      <Animated.View
        style={[
          styles.pulsingDotRing,
          {
            transform: [{ rotate: rotation }],
            opacity: glowAnim,
          },
        ]}
      />
      {/* Pulsing glow */}
      <Animated.View
        style={[
          styles.pulsingDotOuter,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />
      {/* Core dot */}
      <View style={styles.pulsingDotInner} />
    </View>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
}

function AnimatedStatCard({ label, value, icon, color, index }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(1)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const delay = index * 100;

    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 50,
      delay,
      useNativeDriver: true,
    }).start();

    // Count up animation
    Animated.timing(countAnim, {
      toValue: value,
      duration: 1500,
      delay: delay + 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Icon bounce
    setTimeout(() => {
      Animated.sequence([
        Animated.spring(iconBounce, {
          toValue: 1.3,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(iconBounce, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay + 300);

    // Update display value
    const listener = countAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => countAnim.removeListener(listener);
  }, [value, index]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.statCard,
          {
            borderLeftColor: color,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconBounce }] }}>
          <Ionicons name={icon} size={22} color={color} />
        </Animated.View>
        <Text style={styles.statValue}>{displayValue}</Text>
        <Text style={styles.statLabel}>{label}</Text>

        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={[`${color}10`, 'transparent']}
          style={styles.statCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================================================
// ANIMATED RECORD TROPHY
// ============================================================================

function AnimatedRecordBadge({
  record,
  recordDate,
  scrollY,
}: {
  record: number;
  recordDate: string | null;
  scrollY: Animated.Value;
}) {
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
  }, []);

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
          style={[
            styles.shimmerEffect,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(245, 158, 11, 0.2)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: trophyBounce }] }}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.trophyContainer}
          >
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WhosOnlineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [stats, setStats] = useState<OnlineStats>(generateFallbackStats());
  const [activities, setActivities] = useState<ActivityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActivities, setShowActivities] = useState(false);

  // Scroll animation value for parallax
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animations
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Auto-refresh timer
  const refreshInterval = useRef<TimerRef>(null);

  useEffect(() => {
    // Animate header on mount
    Animated.parallel([
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Transform API response
  const transformApiUsers = (data: any[]): OnlineUser[] => {
    return data.map((u) => ({
      id: u.id,
      username: u.username || 'Unknown',
      displayName: u.display_name || null,
      avatarUrl: u.avatar_url || null,
      userGroup: u.user_group || 'Member',
      userGroupColor: u.user_group_color || null,
      lastActivity: u.last_activity || new Date().toISOString(),
      currentActivity: u.current_activity || null,
    }));
  };

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await api.get('/api/v1/presence/online');
      const data = response.data;

      // Set users
      const userList = transformApiUsers(data.users || []);
      setUsers(userList);

      // Set stats
      setStats({
        totalOnline: data.total_online || userList.length,
        members: data.members || userList.length,
        guests: data.guests || 0,
        bots: data.bots || 0,
        record: data.record || 0,
        recordDate: data.record_date || null,
      });

      // Set activities
      if (data.activities) {
        const activityGroups: ActivityGroup[] = data.activities.map((a: any) => ({
          activity: a.activity || 'Unknown',
          count: a.count || 0,
          icon: getActivityIcon(a.activity),
        }));
        setActivities(activityGroups);
      }
    } catch (err) {
      console.error('[WhosOnline] API error, using fallback:', err);
      setUsers(generateFallbackUsers());
      setStats(generateFallbackStats());
      setActivities([
        { activity: 'Browsing Forums', count: 15, icon: 'list' },
        { activity: 'Reading Threads', count: 12, icon: 'document-text' },
        { activity: 'Posting Messages', count: 8, icon: 'chatbubble' },
        { activity: 'Viewing Profiles', count: 5, icon: 'person' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get icon for activity
  const getActivityIcon = (activity: string): keyof typeof Ionicons.glyphMap => {
    const activityLower = activity.toLowerCase();
    if (activityLower.includes('forum') || activityLower.includes('browse')) return 'list';
    if (activityLower.includes('thread') || activityLower.includes('read')) return 'document-text';
    if (activityLower.includes('post') || activityLower.includes('reply')) return 'chatbubble';
    if (activityLower.includes('profile')) return 'person';
    if (activityLower.includes('search')) return 'search';
    if (activityLower.includes('chat') || activityLower.includes('message')) return 'chatbubbles';
    return 'ellipsis-horizontal';
  };

  useEffect(() => {
    fetchOnlineUsers();

    // Auto-refresh every 30 seconds
    refreshInterval.current = setInterval(() => {
      fetchOnlineUsers();
    }, 30000);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchOnlineUsers();
    setIsRefreshing(false);
  };

  // Navigate to member profile
  const handleUserPress = (user: OnlineUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Navigate to profile:', user.id);
  };

  // Parallax header transform
  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [50, 0, -30],
    extrapolate: 'clamp',
  });

  const backgroundOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backgroundOpacity }]}>
        <LinearGradient
          colors={['#111827', '#0f172a', '#111827']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Floating orbs background */}
      <FloatingOrbs />

      {/* Wave effect */}
      <WaveEffect scrollY={scrollY} />

      {/* Header with parallax */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
            opacity: headerOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Who's Online</Text>
            <PulsingDot />
          </View>
          <Text style={styles.headerSubtitle}>Live presence updates</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowActivities(!showActivities);
          }}
        >
          <BlurView intensity={30} tint="dark" style={styles.headerButtonBlur}>
            <Ionicons
              name="analytics"
              size={22}
              color={showActivities ? '#10b981' : '#fff'}
            />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
          <Text style={styles.loadingText}>Loading presence data...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MagneticUserCard
              user={item}
              index={index}
              onPress={() => handleUserPress(item)}
              scrollY={scrollY}
            />
          )}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#10b981"
            />
          }
          ListHeaderComponent={
            <>
              {/* Stats Cards with animations */}
              <View style={styles.statsContainer}>
                <AnimatedStatCard
                  label="Members"
                  value={stats.members}
                  icon="people"
                  color="#10b981"
                  index={0}
                />
                <AnimatedStatCard
                  label="Guests"
                  value={stats.guests}
                  icon="person-outline"
                  color="#6366f1"
                  index={1}
                />
                <AnimatedStatCard
                  label="Bots"
                  value={stats.bots}
                  icon="hardware-chip"
                  color="#f59e0b"
                  index={2}
                />
              </View>

              {/* Animated Record Badge */}
              <AnimatedRecordBadge
                record={stats.record}
                recordDate={stats.recordDate}
                scrollY={scrollY}
              />

              {/* Activity Breakdown with animations */}
              {showActivities && activities.length > 0 && (
                <View style={styles.activitiesContainer}>
                  <Text style={styles.activitiesTitle}>What People Are Doing</Text>
                  {activities.map((activity, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.activityItem,
                        {
                          transform: [
                            {
                              translateX: scrollY.interpolate({
                                inputRange: [0, 100],
                                outputRange: [0, -5 * index],
                                extrapolate: 'clamp',
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <View style={[styles.activityIcon, { backgroundColor: `${getActivityColor(index)}20` }]}>
                        <Ionicons name={activity.icon} size={16} color={getActivityColor(index)} />
                      </View>
                      <Text style={styles.activityText}>{activity.activity}</Text>
                      <View style={[styles.activityCountBadge, { backgroundColor: `${getActivityColor(index)}20` }]}>
                        <Text style={[styles.activityCountText, { color: getActivityColor(index) }]}>
                          {activity.count}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Online Members</Text>
                <View style={styles.sectionCountBadge}>
                  <Text style={styles.sectionCount}>{users.length}</Text>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['#374151', '#1f2937']}
                style={styles.emptyIconContainer}
              >
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
              </LinearGradient>
              <Text style={styles.emptyText}>No members currently online</Text>
              <Text style={styles.emptySubtext}>{stats.guests} guests browsing</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// Helper function for activity colors
function getActivityColor(index: number): string {
  const colors = ['#10b981', '#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b'];
  return colors[index % colors.length];
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  // Floating orbs
  orbsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
  },
  // Wave effect
  waveContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: 100,
  },
  wave2: {
    top: 30,
  },
  waveGradient: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    overflow: 'hidden',
  },
  // Pulsing dot
  pulsingDotContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDotRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderStyle: 'dashed',
  },
  pulsingDotOuter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  // List content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  statCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500',
  },
  // Record badge
  recordContainerEnhanced: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recordBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
    overflow: 'hidden',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  trophyContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  recordValue: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  recordDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  recordCrown: {
    padding: 8,
  },
  // Activities
  activitiesContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activitiesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#d1d5db',
  },
  activityCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  sectionCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  // Magnetic user card
  magneticCardWrapper: {
    marginBottom: 10,
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.3,
  },
  userItemEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },
  userAvatar: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicatorWrapper: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicatorPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#111827',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  userGroupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  userGroupText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  userActivity: {
    fontSize: 13,
    color: '#9ca3af',
    flex: 1,
  },
  userTime: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  activityIndicator: {
    marginLeft: 8,
    opacity: 0.6,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#9ca3af',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    color: '#6b7280',
  },
});
