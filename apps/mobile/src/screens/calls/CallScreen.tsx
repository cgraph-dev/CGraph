/**
 * Call Screen - Mobile Voice and Video Calls
 *
 * Full-featured WebRTC call interface with:
 * - Video/audio call modes
 * - Call controls (mute, camera, speaker, end)
 * - Connection status indicators
 * - Animated UI elements
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

// =============================================================================
// TYPES
// =============================================================================

type CallParams = {
  Call: {
    recipientId: string;
    callType: 'audio' | 'video';
    incoming?: boolean;
    roomId?: string;
  };
};

type Props = {
  navigation: NativeStackNavigationProp<CallParams, 'Call'>;
  route: RouteProp<CallParams, 'Call'>;
};

interface CallUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'error';

// =============================================================================
// CONSTANTS
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CALL_STATES: Record<CallStatus, string> = {
  idle: 'Initializing...',
  ringing: 'Calling...',
  connecting: 'Connecting...',
  connected: 'Connected',
  ended: 'Call Ended',
  error: 'Connection Error',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function CallScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { recipientId, callType, incoming = false, roomId } = route.params;

  const [recipient, setRecipient] = useState<CallUser | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const callStartTimeRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch recipient info
  useEffect(() => {
    async function fetchRecipient() {
      try {
        const response = await api.get(`/api/v1/users/${recipientId}`);
        setRecipient(response.data);
      } catch (error) {
        console.error('Failed to fetch recipient:', error);
      }
    }
    fetchRecipient();
  }, [recipientId]);

  // Simulate call connection (in real app, use WebRTC)
  useEffect(() => {
    setCallStatus('ringing');
    const timeout = setTimeout(() => {
      setCallStatus('connecting');
      setTimeout(() => {
        setCallStatus('connected');
        callStartTimeRef.current = Date.now();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1500);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Track call duration
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (callStatus === 'connected') {
      interval = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }
      }, 1000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [callStatus]);

  // Pulse animation for ringing/connecting states
  useEffect(() => {
    if (callStatus === 'ringing' || callStatus === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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

      // Ring animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callStatus, pulseAnim, ringAnim]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (callStatus === 'connected') {
      controlsTimeoutRef.current = setTimeout(() => {
        Animated.timing(controlsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 5000);
    }
  }, [callStatus, controlsAnim]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Format duration
  const formattedDuration = useMemo(() => {
    const hours = Math.floor(callDuration / 3600);
    const minutes = Math.floor((callDuration % 3600) / 60);
    const seconds = callDuration % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  // Call actions
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleToggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleToggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleEndCall = useCallback(() => {
    setCallStatus('ended');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => {
      navigation.goBack();
    }, 500);
  }, [navigation]);

  // Control button component
  const ControlButton = useCallback(
    ({
      icon,
      label,
      onPress,
      active,
      danger,
    }: {
      icon: string;
      label: string;
      onPress: () => void;
      active?: boolean;
      danger?: boolean;
    }) => (
      <TouchableOpacity onPress={onPress} style={styles.controlButtonContainer}>
        <View
          style={[
            styles.controlButton,
            danger
              ? { backgroundColor: colors.error }
              : active
              ? { backgroundColor: colors.primary }
              : { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
          ]}
        >
          <Text style={styles.controlIcon}>{icon}</Text>
        </View>
        <Text style={[styles.controlLabel, { color: 'rgba(255, 255, 255, 0.7)' }]}>{label}</Text>
      </TouchableOpacity>
    ),
    [colors.error, colors.primary]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={resetControlsTimeout}
          style={styles.touchableArea}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: controlsAnim }]}>
            <View style={styles.headerInfo}>
              <Text style={styles.recipientName}>{recipient?.displayName || 'Calling...'}</Text>
              <Text style={styles.callStatus}>
                {callStatus === 'connected' ? formattedDuration : CALL_STATES[callStatus]}
              </Text>
            </View>

            {/* Connection Quality */}
            <View style={styles.qualityIndicator}>
              <View style={styles.qualityBars}>
                {[1, 2, 3, 4].map((bar) => (
                  <View
                    key={bar}
                    style={[
                      styles.qualityBar,
                      {
                        height: bar * 4,
                        backgroundColor: bar <= 3 ? colors.success : 'rgba(255, 255, 255, 0.3)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Main Content - Avatar or Video */}
          <View style={styles.mainContent}>
            {callStatus === 'ringing' || callStatus === 'connecting' ? (
              <>
                {/* Animated Rings */}
                <Animated.View
                  style={[
                    styles.ring,
                    {
                      transform: [
                        {
                          scale: ringAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2],
                          }),
                        },
                      ],
                      opacity: ringAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 0],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.ring,
                    {
                      transform: [
                        {
                          scale: ringAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 1.5, 2],
                          }),
                        },
                      ],
                      opacity: ringAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 0.3, 0],
                      }),
                    },
                  ]}
                />

                {/* Avatar */}
                <Animated.View
                  style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}
                >
                  {recipient?.avatarUrl ? (
                    <Image source={{ uri: recipient.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      style={styles.avatarPlaceholder}
                    >
                      <Text style={styles.avatarInitial}>
                        {recipient?.displayName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </LinearGradient>
                  )}
                </Animated.View>
              </>
            ) : callStatus === 'connected' ? (
              isVideoEnabled && callType === 'video' ? (
                // Video placeholder (in real app, use RTCView)
                <View style={styles.videoContainer}>
                  <View style={styles.remoteVideo}>
                    {recipient?.avatarUrl ? (
                      <Image source={{ uri: recipient.avatarUrl }} style={styles.videoPlaceholder} />
                    ) : (
                      <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.videoPlaceholder}
                      >
                        <Text style={styles.avatarInitial}>
                          {recipient?.displayName?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                  {/* Local video (PiP) */}
                  <View style={styles.localVideo}>
                    <LinearGradient
                      colors={['#374151', '#1f2937']}
                      style={styles.localVideoInner}
                    >
                      <Text style={styles.localVideoText}>You</Text>
                    </LinearGradient>
                  </View>
                </View>
              ) : (
                // Audio call - show avatar
                <View style={styles.avatarContainer}>
                  {recipient?.avatarUrl ? (
                    <Image source={{ uri: recipient.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      style={styles.avatarPlaceholder}
                    >
                      <Text style={styles.avatarInitial}>
                        {recipient?.displayName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              )
            ) : null}
          </View>

          {/* Controls */}
          <Animated.View style={[styles.controls, { opacity: controlsAnim }]}>
            <View style={styles.controlsRow}>
              <ControlButton
                icon={isMuted ? '🔇' : '🎤'}
                label={isMuted ? 'Unmute' : 'Mute'}
                onPress={handleToggleMute}
                active={isMuted}
              />

              {callType === 'video' && (
                <ControlButton
                  icon={isVideoEnabled ? '📹' : '📷'}
                  label={isVideoEnabled ? 'Camera Off' : 'Camera On'}
                  onPress={handleToggleVideo}
                  active={!isVideoEnabled}
                />
              )}

              <ControlButton
                icon={isSpeakerOn ? '🔊' : '🔈'}
                label={isSpeakerOn ? 'Speaker' : 'Earpiece'}
                onPress={handleToggleSpeaker}
                active={isSpeakerOn}
              />
            </View>

            {/* End Call Button */}
            <TouchableOpacity onPress={handleEndCall} style={styles.endCallContainer}>
              <View style={[styles.endCallButton, { backgroundColor: colors.error }]}>
                <Text style={styles.endCallIcon}>📞</Text>
              </View>
              <Text style={[styles.controlLabel, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                End Call
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  safeArea: {
    flex: 1,
  },
  touchableArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerInfo: {
    alignItems: 'flex-start',
  },
  recipientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  callStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  qualityIndicator: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  qualityBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  qualityBar: {
    width: 4,
    borderRadius: 2,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  avatarContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
  },
  videoContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  localVideoInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localVideoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  controlButtonContainer: {
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlLabel: {
    fontSize: 12,
  },
  endCallContainer: {
    alignItems: 'center',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    transform: [{ rotate: '135deg' }],
  },
  endCallIcon: {
    fontSize: 28,
    transform: [{ rotate: '-135deg' }],
  },
});
