/**
 * GroupListScreen - Premium UI with Glassmorphism & Animations
 * Features: GlassCard, smooth animations, haptic feedback
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { GroupsStackParamList, Group } from '../../types';
import GlassCard from '../../components/ui/GlassCard';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupList'>;
};

// Animated Group Item
const AnimatedGroupItem = ({
  item,
  index,
  onPress,
  colors,
}: {
  item: Group;
  index: number;
  onPress: () => void;
  colors: any;
}) => {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const memberCount = item.member_count || 0;
  const isLargeGroup = memberCount > 100;
  const isActiveGroup = memberCount > 50;

  return (
    <Animated.View
      style={[
        styles.groupItemWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <GlassCard
          variant={isActiveGroup ? 'neon' : 'frosted'}
          intensity="subtle"
          style={styles.groupCard}
          glowColor={isActiveGroup ? '#8b5cf6' : undefined}
        >
          <View style={styles.groupInner}>
            {/* Group Icon */}
            <View style={styles.groupIconSection}>
              {item.icon_url ? (
                <Image source={{ uri: item.icon_url }} style={styles.groupIconImage} />
              ) : (
                <LinearGradient
                  colors={isLargeGroup ? ['#8b5cf6', '#ec4899'] : ['#10b981', '#059669']}
                  style={styles.groupIconPlaceholder}
                >
                  <Text style={styles.groupIconText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              {isActiveGroup && (
                <View style={styles.activeIndicator}>
                  <View style={styles.activeDot} />
                </View>
              )}
            </View>

            {/* Group Info */}
            <View style={styles.groupInfo}>
              <View style={styles.groupNameRow}>
                <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {isLargeGroup && (
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={styles.verifiedBadge}
                  >
                    <Ionicons name="flame" size={10} color="#fff" />
                  </LinearGradient>
                )}
              </View>
              <View style={styles.groupMeta}>
                <View style={styles.memberCount}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
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
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isActiveGroup ? colors.primary : colors.textTertiary} 
              />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function GroupListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.text,
        fontWeight: '700',
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Navigate to create group
          }}
          style={styles.headerButton}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.headerButtonGradient}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
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
  
  const renderGroup = ({ item, index }: { item: Group; index: number }) => (
    <AnimatedGroupItem
      item={item}
      index={index}
      onPress={() => navigation.navigate('Group', { groupId: item.id })}
      colors={colors}
    />
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <GlassCard variant="crystal" intensity="medium" style={styles.emptyCard}>
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={styles.emptyIconContainer}
        >
          <Ionicons name="people" size={48} color="#fff" />
        </LinearGradient>
        
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Groups Yet
        </Text>
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
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.emptyButton}
            >
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
        contentContainerStyle={[
          styles.listContent,
          groups.length === 0 && styles.emptyContainer,
        ]}
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
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
  },
  groupItemWrapper: {
    marginBottom: 2,
  },
  groupCard: {
    borderRadius: 16,
    padding: 0,
  },
  groupInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
    gap: 2,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupMembers: {
    fontSize: 13,
  },
  groupDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  arrowContainer: {
    marginLeft: 8,
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
