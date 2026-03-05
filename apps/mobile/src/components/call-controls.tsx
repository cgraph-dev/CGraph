/**
 * Call Controls (Mobile) — Bottom floating bar during calls
 *
 * Features:
 * - Mic, Camera, Speaker, Flip Camera, End Call buttons
 * - Haptic feedback on press
 * - Incoming call full-screen overlay (accept/decline)
 * - Animated entry
 *
 * @module components/call-controls
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { FadeInUp, FadeIn, SlideInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────

interface CallControlsProps {
  isMuted?: boolean;
  isCameraOff?: boolean;
  isSpeakerOn?: boolean;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleSpeaker?: () => void;
  onFlipCamera?: () => void;
  onEndCall?: () => void;
}

interface IncomingCallOverlayProps {
  visible: boolean;
  callerName: string;
  callerAvatar?: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

// ── Call Controls ──────────────────────────────────────────────────────

export function CallControls({
  isMuted = false,
  isCameraOff = false,
  isSpeakerOn = false,
  onToggleMic,
  onToggleCamera,
  onToggleSpeaker,
  onFlipCamera,
  onEndCall,
}: CallControlsProps): React.ReactElement {
  const press = useCallback(
    (fn?: () => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      fn?.();
    },
    [],
  );

  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.container}>
      <ControlBtn
        icon="microphone"
        activeIcon="microphone-off"
        label="Mic"
        active={!isMuted}
        toggled={isMuted}
        onPress={() => press(onToggleMic)}
      />
      <ControlBtn
        icon="camera"
        activeIcon="camera-off"
        label="Camera"
        active={!isCameraOff}
        toggled={isCameraOff}
        onPress={() => press(onToggleCamera)}
      />
      <ControlBtn
        icon="volume-high"
        activeIcon="volume-off"
        label="Speaker"
        active={isSpeakerOn}
        toggled={!isSpeakerOn}
        onPress={() => press(onToggleSpeaker)}
      />
      <ControlBtn
        icon="camera-flip-outline"
        label="Flip"
        onPress={() => press(onFlipCamera)}
      />

      {/* End call — bigger, red */}
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onEndCall?.();
        }}
        style={styles.endCallBtn}
      >
        <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFFFFF" />
        <Text style={styles.endCallLabel}>End</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Control Button ─────────────────────────────────────────────────────

function ControlBtn({
  icon,
  activeIcon,
  label,
  active,
  toggled,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  activeIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active?: boolean;
  toggled?: boolean;
  onPress: () => void;
}) {
  const displayIcon = toggled && activeIcon ? activeIcon : icon;
  const color = toggled ? '#ef4444' : 'rgba(255,255,255,0.7)';
  const bgColor = toggled ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)';

  return (
    <Pressable onPress={onPress} style={[styles.controlBtn, { backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name={displayIcon} size={22} color={color} />
      <Text style={[styles.controlLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ── Incoming Call Overlay ──────────────────────────────────────────────

export function IncomingCallOverlay({
  visible,
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
}: IncomingCallOverlayProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.incomingContainer}>
      {/* Caller info */}
      <View style={styles.callerInfo}>
        {callerAvatar ? (
          <Animated.Image
            entering={SlideInUp.duration(400)}
            source={{ uri: callerAvatar }}
            style={styles.callerAvatar}
          />
        ) : (
          <Animated.View entering={SlideInUp.duration(400)} style={styles.callerAvatarPlaceholder}>
            <Text style={styles.callerInitial}>
              {callerName.charAt(0).toUpperCase()}
            </Text>
          </Animated.View>
        )}
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callerSubtitle}>Incoming call...</Text>
      </View>

      {/* Accept / Decline */}
      <View style={styles.incomingActions}>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            onDecline?.();
          }}
          style={styles.declineBtn}
        >
          <MaterialCommunityIcons name="phone-hangup" size={28} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAccept?.();
          }}
          style={styles.acceptBtn}
        >
          <MaterialCommunityIcons name="phone" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  endCallBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 64,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    marginLeft: 8,
  },
  endCallLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Incoming call
  incomingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111214',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 120,
    paddingBottom: 80,
  },
  callerInfo: {
    alignItems: 'center',
    gap: 12,
  },
  callerAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  callerAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  callerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  callerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
  },
  incomingActions: {
    flexDirection: 'row',
    gap: 60,
  },
  declineBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CallControls;
