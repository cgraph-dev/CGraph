/**
 * CallHistoryScreen - Beautiful Call History with Animations
 * Features:
 * - Grouped calls by date
 * - Animated list items with stagger
 * - Call type indicators (voice/video, incoming/outgoing/missed)
 * - Quick actions (call back, delete)
 * - Empty state with animation
 * - Pull to refresh
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import AnimatedAvatar from '@/components/ui/AnimatedAvatar';
import GlassCard from '@/components/ui/GlassCard';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/lib/design/DesignSystem';
import { HapticFeedback, getStaggerDelay } from '@/lib/animations/AnimationEngine';

type CallType = 'voice' | 'video';
type CallDirection = 'incoming' | 'outgoing' | 'missed';

interface CallRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  type: CallType;
  direction: CallDirection;
  duration: number; // seconds
  timestamp: Date;
}

interface CallSection {
  title: string;
  data: CallRecord[];
}

// Mock data
const MOCK_CALLS: CallRecord[] = [
  {
    id: '1',
    recipientId: 'user1',
    recipientName: 'Alice Johnson',
    recipientAvatar: undefined,
    type: 'video',
    direction: 'outgoing',
    duration: 1245,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: '2',
    recipientId: 'user2',
    recipientName: 'Bob Smith',
    recipientAvatar: undefined,
    type: 'voice',
    direction: 'missed',
    duration: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    recipientId: 'user3',
    recipientName: 'Charlie Wilson',
    recipientAvatar: undefined,
    type: 'voice',
    direction: 'incoming',
    duration: 567,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
  {
    id: '4',
    recipientId: 'user1',
    recipientName: 'Alice Johnson',
    recipientAvatar: undefined,
    type: 'video',
    direction: 'incoming',
    duration: 2134,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
  },
  {
    id: '5',
    recipientId: 'user4',
    recipientName: 'Diana Ross',
    recipientAvatar: undefined,
    type: 'voice',
    direction: 'outgoing',
    duration: 890,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
];

export default function CallHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [calls, setCalls] = useState<CallRecord[]>(MOCK_CALLS);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'missed'>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    HapticFeedback.light();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return 'No answer';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDateSection = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (callDate.getTime() === today.getTime()) return 'Today';
    if (callDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const groupCallsByDate = useCallback((): CallSection[] => {
    const filteredCalls = filter === 'missed'
      ? calls.filter(c => c.direction === 'missed')
      : calls;

    const groups: { [key: string]: CallRecord[] } = {};

    filteredCalls.forEach(call => {
      const section = getDateSection(call.timestamp);
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(call);
    });

    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [calls, filter]);

  const handleCallBack = useCallback((call: CallRecord) => {
    HapticFeedback.medium();
    if (call.type === 'video') {
      navigation.navigate('VideoCall', {
        recipientId: call.recipientId,
        recipientName: call.recipientName,
        recipientAvatar: call.recipientAvatar,
      });
    } else {
      navigation.navigate('VoiceCall', {
        recipientId: call.recipientId,
        recipientName: call.recipientName,
        recipientAvatar: call.recipientAvatar,
      });
    }
  }, [navigation]);

  const handleDeleteCall = useCallback((callId: string) => {
    HapticFeedback.medium();
    setCalls(prev => prev.filter(c => c.id !== callId));
  }, []);

  const getDirectionIcon = (direction: CallDirection) => {
    switch (direction) {
      case 'incoming':
        return { name: 'arrow-down-left' as const, color: Colors.primary[500] };
      case 'outgoing':
        return { name: 'arrow-up-right' as const, color: Colors.blue[500] };
      case 'missed':
        return { name: 'arrow-down-left' as const, color: Colors.semantic.error };
    }
  };

  const renderRightActions = (callId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteCall(callId)}
      >
        <LinearGradient
          colors={[Colors.red[500], Colors.red[600]]}
          style={styles.deleteGradient}
        >
          <Ionicons name="trash" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCallItem = ({ item, index }: { item: CallRecord; index: number }) => {
    const directionIcon = getDirectionIcon(item.direction);
    const itemAnim = new Animated.Value(0);

    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 300,
      delay: getStaggerDelay(index, 50),
      useNativeDriver: true,
    }).start();

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <Animated.View
          style={{
            opacity: itemAnim,
            transform: [
              {
                translateX: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={styles.callItem}
            onPress={() => handleCallBack(item)}
            activeOpacity={0.7}
          >
            <AnimatedAvatar
              source={
                item.recipientAvatar
                  ? { uri: item.recipientAvatar }
                  : require('@/assets/default-avatar.png')
              }
              size={52}
              borderAnimation={item.direction === 'missed' ? 'none' : 'gradient'}
              shape="circle"
            />

            <View style={styles.callInfo}>
              <View style={styles.callHeader}>
                <Text
                  style={[
                    styles.callName,
                    item.direction === 'missed' && styles.missedCallName,
                  ]}
                >
                  {item.recipientName}
                </Text>
                <Text style={styles.callTime}>{formatTimestamp(item.timestamp)}</Text>
              </View>

              <View style={styles.callDetails}>
                <View style={styles.callType}>
                  <Ionicons
                    name={directionIcon.name}
                    size={14}
                    color={directionIcon.color}
                  />
                  <Ionicons
                    name={item.type === 'video' ? 'videocam' : 'call'}
                    size={14}
                    color={Colors.dark[400]}
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <Text style={styles.callDuration}>{formatDuration(item.duration)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.callBackButton}
              onPress={() => handleCallBack(item)}
            >
              <Ionicons
                name={item.type === 'video' ? 'videocam' : 'call'}
                size={22}
                color={Colors.primary[500]}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section }: { section: CallSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={[Colors.dark[700], Colors.dark[800]]}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="call-outline" size={48} color={Colors.dark[500]} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No calls yet</Text>
      <Text style={styles.emptySubtitle}>
        Your call history will appear here
      </Text>
    </View>
  );

  const sections = groupCallsByDate();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Calls</Text>

            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                onPress={() => {
                  HapticFeedback.light();
                  setFilter('all');
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === 'all' && styles.filterTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, filter === 'missed' && styles.filterTabActive]}
                onPress={() => {
                  HapticFeedback.light();
                  setFilter('missed');
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === 'missed' && styles.filterTextActive,
                  ]}
                >
                  Missed
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Call List */}
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            renderItem={renderCallItem}
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary[500]}
              />
            }
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark[900],
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark[50],
    marginBottom: Spacing[4],
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.dark[800],
    borderRadius: BorderRadius.lg,
    padding: Spacing[1],
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.dark[700],
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.dark[400],
  },
  filterTextActive: {
    color: Colors.dark[50],
  },

  // List
  listContent: {
    paddingBottom: Spacing[20],
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.dark[900],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Call Item
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.dark[900],
  },
  callInfo: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark[50],
  },
  missedCallName: {
    color: Colors.semantic.error,
  },
  callTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[500],
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  callType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callDuration: {
    fontSize: Typography.fontSize.sm,
    color: Colors.dark[400],
    marginLeft: Spacing[2],
  },
  callBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark[800],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Delete action
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacing[4],
  },
  deleteGradient: {
    width: 60,
    height: '80%',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing[20],
  },
  emptyIconContainer: {
    marginBottom: Spacing[6],
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark[300],
    marginBottom: Spacing[2],
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.dark[500],
  },
});
