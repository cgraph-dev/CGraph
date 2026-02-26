/**
 * Main settings screen with navigation to all settings sub-screens.
 * @module screens/settings/settings-screen
 */
import { durations } from '@cgraph/animation-constants';
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useThemeStore } from '@/stores';
import GlassCard from '../../components/ui/glass-card';
import AnimatedAvatar from '../../components/ui/animated-avatar';
import { getValidImageUrl } from '../../lib/imageUtils';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;
};

const formatKarma = (karma: number): string => {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
};

/**
 *
 */
export default function SettingsScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const { user, logout } = useAuthStore();
  
  const profileScale = useRef(new Animated.Value(0.8)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;
  const sectionsOpacity = useRef(new Animated.Value(0)).current;
  const sectionsTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animate profile card
    Animated.parallel([
      Animated.spring(profileScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(profileOpacity, {
        toValue: 1,
        duration: durations.smooth.ms,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate sections with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(sectionsOpacity, {
          toValue: 1,
          duration: durations.smooth.ms,
          useNativeDriver: true,
        }),
        Animated.spring(sectionsTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
  }, []);
  
  const settingsSections = [
    {
      title: 'Premium',
      icon: 'star',
       
      gradient: ['#F59E0B', '#EF4444'] as [string, string],
      items: [
        {
          title: 'CGraph Premium',
          icon: 'star' as const,
          onPress: () => navigation.navigate('Premium'),
          isPremium: true,
           
          gradient: ['#F59E0B', '#EF4444'] as [string, string],
        },
        {
          title: 'Coin Shop',
          icon: 'logo-bitcoin' as const,
          onPress: () => navigation.navigate('CoinShop'),
          isShop: true,
           
          gradient: ['#10b981', '#34d399'] as [string, string],
        },
      ],
    },
    {
      title: 'Features',
      icon: 'apps',
       
      gradient: ['#3b82f6', '#8b5cf6'] as [string, string],
      items: [
        {
          title: 'Calendar',
          icon: 'calendar' as const,
          onPress: () => navigation.navigate('Calendar'),
           
          gradient: ['#06b6d4', '#22d3ee'] as [string, string],
        },
        {
          title: 'Leaderboard',
          icon: 'trophy' as const,
          onPress: () => navigation.navigate('Leaderboard'),
           
          gradient: ['#f59e0b', '#fbbf24'] as [string, string],
        },
        {
          title: 'Gamification',
          icon: 'game-controller' as const,
          onPress: () => navigation.navigate('GamificationHub'),
           
          gradient: ['#8b5cf6', '#c084fc'] as [string, string],
        },
        {
          title: 'Achievements',
          icon: 'ribbon' as const,
          onPress: () => navigation.navigate('Achievements'),
           
          gradient: ['#f59e0b', '#eab308'] as [string, string],
        },
        {
          title: 'Referral Program',
          icon: 'gift' as const,
          onPress: () => navigation.navigate('Referrals'),
           
          gradient: ['#ec4899', '#f472b6'] as [string, string],
        },
        {
          title: 'Holographic UI Demo',
          icon: 'sparkles' as const,
          onPress: () => navigation.navigate('HolographicDemo'),
           
          gradient: ['#8b5cf6', '#a855f7'] as [string, string],
        },
      ],
    },
    {
      title: 'Account',
      icon: 'person',
       
      gradient: ['#10b981', '#34d399'] as [string, string],
      items: [
        {
          title: 'Edit Profile',
          icon: 'person' as const,
          onPress: () => navigation.navigate('Profile'),
           
          gradient: ['#3b82f6', '#60a5fa'] as [string, string],
        },
        {
          title: 'Account',
          icon: 'lock-closed' as const,
          onPress: () => navigation.navigate('Account'),
           
          gradient: ['#6366f1', '#818cf8'] as [string, string],
        },
        {
          title: 'Privacy',
          icon: 'shield' as const,
          onPress: () => navigation.navigate('Privacy'),
           
          gradient: ['#10b981', '#34d399'] as [string, string],
        },
        {
          title: 'Sessions',
          icon: 'phone-portrait' as const,
          onPress: () => navigation.navigate('Sessions'),
           
          gradient: ['#f97316', '#fb923c'] as [string, string],
        },
      ],
    },
    {
      title: 'Preferences',
      icon: 'settings',
       
      gradient: ['#6366f1', '#818cf8'] as [string, string],
      items: [
        {
          title: 'Appearance',
          icon: 'color-palette' as const,
          onPress: () => navigation.navigate('Appearance'),
           
          gradient: ['#ec4899', '#f472b6'] as [string, string],
        },
        {
          title: 'UI Customization',
          icon: 'options' as const,
          onPress: () => navigation.navigate('UICustomization'),
           
          gradient: ['#8b5cf6', '#a855f7'] as [string, string],
        },
        {
          title: 'Chat Bubbles',
          icon: 'chatbubbles' as const,
          onPress: () => navigation.navigate('ChatBubbles'),
           
          gradient: ['#06b6d4', '#22d3ee'] as [string, string],
        },
        {
          title: 'Avatar Settings',
          icon: 'person-circle' as const,
          onPress: () => navigation.navigate('AvatarSettings'),
           
          gradient: ['#f59e0b', '#fbbf24'] as [string, string],
        },
        {
          title: 'Notifications',
          icon: 'notifications' as const,
          onPress: () => navigation.navigate('Notifications'),
           
          gradient: ['#ef4444', '#f87171'] as [string, string],
        },
      ],
    },
    {
      title: 'About',
      icon: 'information-circle',
       
      gradient: ['#6b7280', '#9ca3af'] as [string, string],
      items: [
        {
          title: 'Help & Support',
          icon: 'help-circle' as const,
          onPress: () => {},
           
          gradient: ['#06b6d4', '#22d3ee'] as [string, string],
        },
        {
          title: 'Terms of Service',
          icon: 'document-text' as const,
          onPress: () => navigation.navigate('TermsOfService'),
           
          gradient: ['#8b5cf6', '#a855f7'] as [string, string],
        },
        {
          title: 'Privacy Policy',
          icon: 'shield-checkmark' as const,
          onPress: () => navigation.navigate('PrivacyPolicy'),
           
          gradient: ['#10b981', '#34d399'] as [string, string],
        },
      ],
    },
  ];
  
  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const renderSettingItem = (
    item: typeof settingsSections[0]['items'][0],
    index: number,
    totalItems: number
  ) => {
    const isPremiumItem = 'isPremium' in item || 'isShop' in item;

    return (
      <TouchableOpacity
        key={item.title}
        style={[
          styles.settingsItem,
          index < totalItems - 1 && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          item.onPress();
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.settingIconContainer}
        >
          <Ionicons name={item.icon} size={18} color="#fff" />
        </LinearGradient>
        
        <Text style={[
          styles.settingsItemText,
          { color: colors.text },
          isPremiumItem && { fontWeight: '600' },
        ]}>
          {item.title}
        </Text>
        
        {'isPremium' in item && (
          <LinearGradient
            colors={['#F59E0B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBadge}
          >
            <Text style={styles.proBadgeText}>PRO</Text>
          </LinearGradient>
        )}
        
        {'isShop' in item && (
          <LinearGradient
            colors={['#10b981', '#34d399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBadge}
          >
            <Text style={styles.proBadgeText}>SHOP</Text>
          </LinearGradient>
        )}
        
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* User Profile Card */}
      <Animated.View
        style={[
          styles.profileCardWrapper,
          {
            opacity: profileOpacity,
            transform: [{ scale: profileScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Profile');
          }}
          activeOpacity={0.8}
        >
          <GlassCard variant="neon" intensity="medium" style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.profileAvatarContainer}>
                {getValidImageUrl(user?.avatar_url) ? (
                  <AnimatedAvatar
                    source={{ uri: getValidImageUrl(user?.avatar_url)! }}
                    size={70}
                    borderAnimation="holographic"
                    isPremium={true}
                  />
                ) : (
                  <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.displayName, { color: colors.text }]}>
                  {user?.display_name || user?.username}
                </Text>
                <Text style={[styles.username, { color: colors.textSecondary }]}>
                  @{user?.username}
                </Text>
                
                {user?.karma !== undefined && (
                  <View style={styles.karmaContainer}>
                    <LinearGradient
                      colors={['#f59e0b', '#fbbf24']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.karmaBadge}
                    >
                      <Ionicons name="trophy" size={12} color="#fff" />
                      <Text style={styles.karmaText}>
                        {formatKarma(user.karma)} karma
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
              
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
              </LinearGradient>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Settings Sections */}
      <Animated.View
        style={[
          styles.sectionsWrapper,
          {
            opacity: sectionsOpacity,
            transform: [{ translateY: sectionsTranslateY }],
          },
        ]}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={section.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionIconContainer}
              >
                { }
                <Ionicons name={section.icon as keyof typeof Ionicons.glyphMap} size={12} color="#fff" />
              </LinearGradient>
              <Text style={[
                styles.sectionTitle,
                { color: section.title === 'Premium' ? '#F59E0B' : colors.textSecondary },
              ]}>
                {section.title}
              </Text>
            </View>
            
            <GlassCard variant="frosted" intensity="subtle" style={styles.sectionContent}>
              {section.items.map((item, index) => 
                renderSettingItem(item, index, section.items.length)
              )}
            </GlassCard>
          </View>
        ))}
        
        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
            <GlassCard variant="frosted" intensity="subtle" style={styles.logoutCard}>
              <View style={styles.logoutContent}>
                <LinearGradient
                  colors={['#ef4444', '#f87171']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoutIconContainer}
                >
                  <Ionicons name="log-out" size={18} color="#fff" />
                </LinearGradient>
                <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
        
        {/* Version */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          CGraph v0.8.1 ✨
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCardWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileCard: {
    borderRadius: 20,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileAvatarContainer: {
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  karmaContainer: {
    flexDirection: 'row',
  },
  karmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  karmaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionsWrapper: {
    paddingBottom: 32,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  settingIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 10,
  },
  logoutIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
