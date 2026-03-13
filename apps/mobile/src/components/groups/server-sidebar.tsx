/**
 * Server Sidebar (Mobile) — Full-screen slide-in server navigation
 *
 * Adapted for mobile:
 * - Full-screen overlay when open, slides in from left
 * - Horizontal server icon bar at top (scrollable row)
 * - Channel list below with category structure
 * - Swipe-right to dismiss
 *
 * @module components/groups/server-sidebar
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  Dimensions,
  PanResponder,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// ── Types ──────────────────────────────────────────────────────────────

interface Server {
  id: string;
  name: string;
  iconUrl?: string;
  hasUnread?: boolean;
  mentionCount?: number;
}

interface ServerSidebarProps {
  visible: boolean;
  onClose: () => void;
  servers: Server[];
  activeServerId?: string;
  onServerSelect?: (serverId: string) => void;
  children?: React.ReactNode; // Channel list
}

// ── Server Icon (Horizontal) ───────────────────────────────────────────

function ServerIconItem({
  server,
  isActive,
  onPress,
}: {
  server: Server;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.iconContainer}
    >
      <View style={[styles.serverIcon, isActive && styles.serverIconActive]}>
        {server.iconUrl ? (
          <Animated.Image source={{ uri: server.iconUrl }} style={styles.serverImage} />
        ) : (
          <Text style={styles.serverInitials}>{server.name.slice(0, 2).toUpperCase()}</Text>
        )}
      </View>

      {/* Unread dot */}
      {server.hasUnread && !isActive && <View style={styles.unreadDot} />}

      {/* Mention badge */}
      {(server.mentionCount ?? 0) > 0 && (
        <View style={styles.mentionBadge}>
          <Text style={styles.mentionText}>
            {(server.mentionCount ?? 0) > 99 ? '99+' : server.mentionCount}
          </Text>
        </View>
      )}

      {/* Active indicator bar */}
      {isActive && <View style={styles.activeBar} />}
    </Pressable>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

/** Description. */
/** Server Sidebar component. */
export function ServerSidebar({
  visible,
  onClose,
  servers,
  activeServerId,
  onServerSelect,
  children,
}: ServerSidebarProps): React.ReactElement | null {
  const translateX = useSharedValue(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && gestureState.dx < 0,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.value = gestureState.dx;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          onClose();
        }
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.min(0, translateX.value) }],
  }));

  const handleServerPress = useCallback(
    (serverId: string) => {
      onServerSelect?.(serverId);
    },
    [onServerSelect]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View
        entering={SlideInLeft.duration(250).springify()}
        exiting={SlideOutLeft.duration(200)}
        style={[styles.sidebarPanel, animatedStyle]}
        {...panResponder.panHandlers}
      >
        {/* Horizontal server icon bar */}
        <View style={styles.iconBar}>
          <FlatList
            data={servers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.iconBarContent}
            renderItem={({ item }) => (
              <ServerIconItem
                server={item}
                isActive={item.id === activeServerId}
                onPress={() => handleServerPress(item.id)}
              />
            )}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Channel list content */}
        <View style={styles.channelArea}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#2b2d31',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  iconBar: {
    paddingTop: 56, // status bar + margin
    paddingBottom: 8,
    backgroundColor: '#1e1f22',
  },
  iconBarContent: {
    paddingHorizontal: 12,
    gap: 12,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  serverIconActive: {
    borderRadius: 16,
    backgroundColor: '#6366f1',
  },
  serverImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  serverInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unreadDot: {
    position: 'absolute',
    bottom: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1e1f22',
  },
  mentionBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#1e1f22',
  },
  mentionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeBar: {
    marginTop: 4,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  channelArea: {
    flex: 1,
  },
});

export default ServerSidebar;
