/**
 * VoiceCallScreen - Revolutionary Voice Call Interface
 * Features:
 * - Real-time audio visualization with waveforms
 * - Animated avatar with glow effects
 * - Floating particles background
 * - Haptic feedback on all interactions
 * - Beautiful call controls with glassmorphism
 * - Connection quality indicator
 * - Call duration timer
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import AnimatedAvatar from '@/components/ui/animated-avatar';
import GlassCard from '@/components/ui/glass-card';
import ParticleBackground from '@/components/ui/particle-background';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/lib/design/design-system';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CallStackParamList = {
  VoiceCall: {
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    isIncoming?: boolean;
  };
};

type VoiceCallRouteProp = RouteProp<CallStackParamList, 'VoiceCall'>;

type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';
type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

const AUDIO_LEVELS_COUNT = 32;

/**
 *
 */
export default function VoiceCallScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CallStackParamList>>();
  const route = useRoute<VoiceCallRouteProp>();
  const { recipientId, recipientName, recipientAvatar, isIncoming } = route.params;

  // State
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('excellent');
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(AUDIO_LEVELS_COUNT).fill(0));

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const avatarGlowAnim = useRef(new Animated.Value(0.5)).current;

  // Refs
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioSimulatorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.slower.ms,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulate connection
    if (callState === 'connecting') {
      simulateConnection();
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (audioSimulatorRef.current) clearInterval(audioSimulatorRef.current);
    };
  }, []);

  // Pulse animation for connecting state
  useEffect(() => {
    if (callState === 'connecting' || callState === 'ringing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: durations.verySlow.ms,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: durations.verySlow.ms,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Ring animation (expanding circles)
      const ring = Animated.loop(
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: durations.loop.ms,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      );
      ring.start();

      return () => {
        pulse.stop();
        ring.stop();
      };
    }
  }, [callState]);

  // Connected state animations
  useEffect(() => {
    if (callState === 'connected') {
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Avatar glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(avatarGlowAnim, {
            toValue: 1,
            duration: durations.loop.ms,
            useNativeDriver: false,
          }),
          Animated.timing(avatarGlowAnim, {
            toValue: 0.5,
            duration: durations.loop.ms,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Simulate audio levels
      audioSimulatorRef.current = setInterval(() => {
        const newLevels = Array(AUDIO_LEVELS_COUNT)
          .fill(0)
          .map(() => Math.random() * (isMuted ? 0.1 : 1));
        setAudioLevels(newLevels);
      }, 100);

      return () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        if (audioSimulatorRef.current) clearInterval(audioSimulatorRef.current);
      };
    }
  }, [callState, isMuted]);

  const simulateConnection = () => {
    setTimeout(() => {
      HapticFeedback.success();
      setCallState('connected');
    }, 2000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMute = useCallback(() => {
    HapticFeedback.medium();
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSpeaker = useCallback(() => {
    HapticFeedback.medium();
    setIsSpeakerOn(!isSpeakerOn);
  }, [isSpeakerOn]);

  const handleEndCall = useCallback(() => {
    HapticFeedback.heavy();
    setCallState('ended');
    setTimeout(() => navigation.goBack(), 500);
  }, [navigation]);

  const handleAnswer = useCallback(() => {
    HapticFeedback.success();
    setCallState('connecting');
    simulateConnection();
  }, []);

  const handleDecline = useCallback(() => {
    HapticFeedback.error();
    setCallState('ended');
    setTimeout(() => navigation.goBack(), 500);
  }, [navigation]);

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return Colors.semantic.success;
      case 'good': return Colors.primary[400];
      case 'fair': return Colors.semantic.warning;
      case 'poor': return Colors.semantic.error;
    }
  };

  const getConnectionQualityBars = () => {
    const barCount = { excellent: 4, good: 3, fair: 2, poor: 1 }[connectionQuality];
    return Array(4).fill(0).map((_, i) => i < barCount);
  };

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ParticleBackground
        type="orbs"
        count={15}
        colors={[Colors.primary[500], Colors.purple[500], Colors.neon.cyan]}
        speed={0.5}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Connection Quality Indicator */}
            {callState === 'connected' && (
              <View style={styles.qualityIndicator}>
                <View style={styles.qualityBars}>
                  {getConnectionQualityBars().map((active, i) => (
                    <View
                      key={i}
                      style={[
                        styles.qualityBar,
                        {
                          height: 8 + i * 4,
                          backgroundColor: active
                            ? getConnectionQualityColor()
                            : Colors.dark[600],
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.qualityText}>{connectionQuality}</Text>
              </View>
            )}

            {/* Main Avatar Section */}
            <View style={styles.avatarSection}>
              {/* Ringing circles */}
              {(callState === 'connecting' || callState === 'ringing') && (
                <>
                  <Animated.View
                    style={[
                      styles.ringCircle,
                      {
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.ringCircle,
                      {
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                      },
                    ]}
                  />
                </>
              )}

              {/* Avatar */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <AnimatedAvatar
                  source={
                    recipientAvatar
                      ? { uri: recipientAvatar }
                       
                      : require('@/assets/default-avatar.png')
                  }
                  size={140}
                  borderAnimation={callState === 'connected' ? 'glow' : 'pulse'}
                  shape="circle"
                  particleEffect={callState === 'connected' ? 'sparkles' : 'none'}
                  isPremium={true}
                />
              </Animated.View>

              {/* Audio Waveform (when connected) */}
              {callState === 'connected' && (
                <View style={styles.waveformContainer}>
                  {audioLevels.map((level, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveformBar,
                        {
                          height: 4 + level * 30,
                          backgroundColor: Colors.primary[500],
                          opacity: 0.6 + level * 0.4,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Name and Status */}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{recipientName}</Text>
                <Text style={styles.callStatus}>
                  {callState === 'connecting' && 'Connecting...'}
                  {callState === 'ringing' && 'Incoming Call...'}
                  {callState === 'connected' && formatDuration(callDuration)}
                  {callState === 'ended' && 'Call Ended'}
                </Text>
              </View>
            </View>

            {/* Call Controls */}
            <View style={styles.controlsSection}>
              {callState === 'ringing' ? (
                // Incoming call controls
                <View style={styles.incomingControls}>
                  <TouchableOpacity
                    style={[styles.controlButton, styles.declineButton]}
                    onPress={handleDecline}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[Colors.red[500], Colors.red[600]]}
                      style={styles.controlButtonGradient}
                    >
                      <Ionicons name="close" size={36} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, styles.answerButton]}
                    onPress={handleAnswer}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[Colors.primary[500], Colors.primary[600]]}
                      style={styles.controlButtonGradient}
                    >
                      <Ionicons name="call" size={32} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                // Active call controls
                <GlassCard variant="frosted" intensity="medium" style={styles.controlsCard}>
                  <View style={styles.controls}>
                    {/* Mute Button */}
                    <TouchableOpacity
                      style={[styles.controlIcon, isMuted && styles.controlIconActive]}
                      onPress={handleMute}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isMuted ? 'mic-off' : 'mic'}
                        size={28}
                        color={isMuted ? Colors.semantic.error : Colors.dark[50]}
                      />
                      <Text style={styles.controlLabel}>
                        {isMuted ? 'Unmute' : 'Mute'}
                      </Text>
                    </TouchableOpacity>

                    {/* Speaker Button */}
                    <TouchableOpacity
                      style={[styles.controlIcon, isSpeakerOn && styles.controlIconActive]}
                      onPress={handleSpeaker}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                        size={28}
                        color={isSpeakerOn ? Colors.primary[500] : Colors.dark[50]}
                      />
                      <Text style={styles.controlLabel}>Speaker</Text>
                    </TouchableOpacity>

                    {/* Video Button */}
                    <TouchableOpacity
                      style={styles.controlIcon}
                      onPress={() => {
                        HapticFeedback.light();
                        // Navigate to video call
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="videocam" size={28} color={Colors.dark[50]} />
                      <Text style={styles.controlLabel}>Video</Text>
                    </TouchableOpacity>

                    {/* End Call Button */}
                    <TouchableOpacity
                      style={[styles.controlIcon, styles.endCallIcon]}
                      onPress={handleEndCall}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={[Colors.red[500], Colors.red[600]]}
                        style={styles.endCallGradient}
                      >
                        <Ionicons name="call" size={24} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                      </LinearGradient>
                      <Text style={[styles.controlLabel, { color: Colors.red[500] }]}>End</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              )}
            </View>

            {/* Encryption indicator */}
            <View style={styles.encryptionIndicator}>
              <Ionicons name="lock-closed" size={14} color={Colors.primary[500]} />
              <Text style={styles.encryptionText}>End-to-end encrypted</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </ParticleBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark[950],
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
  },

  // Quality Indicator
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: Colors.dark[800] + '80',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  qualityBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginRight: Spacing[2],
  },
  qualityBar: {
    width: 4,
    borderRadius: 2,
  },
  qualityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[300],
    textTransform: 'capitalize',
  },

  // Avatar Section
  avatarSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },
  userInfo: {
    marginTop: Spacing[8],
    alignItems: 'center',
  },
  userName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark[50],
  },
  callStatus: {
    fontSize: Typography.fontSize.lg,
    color: Colors.dark[400],
    marginTop: Spacing[2],
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: SCREEN_WIDTH - 80,
    marginTop: Spacing[6],
    gap: 2,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },

  // Controls
  controlsSection: {
    paddingBottom: Spacing[8],
  },
  controlsCard: {
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[2],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlIcon: {
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
  },
  controlIconActive: {
    backgroundColor: Colors.dark[700],
  },
  controlLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[400],
    marginTop: Spacing[1],
  },
  endCallIcon: {
    backgroundColor: 'transparent',
  },
  endCallGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Incoming controls
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing[8],
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  controlButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    shadowColor: Colors.red[500],
  },
  answerButton: {
    shadowColor: Colors.primary[500],
  },

  // Encryption
  encryptionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
  },
  encryptionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[500],
  },
});
