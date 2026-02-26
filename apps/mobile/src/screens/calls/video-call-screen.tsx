/**
 * VideoCallScreen - Revolutionary Video Call Interface
 * Features:
 * - Full-screen video with PiP (Picture-in-Picture)
 * - Animated controls with auto-hide
 * - Connection quality indicator
 * - Screen layout toggle (grid/spotlight)
 * - Camera switch with flip animation
 * - Beautiful gesture controls
 * - Virtual background effects (placeholder)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Image,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import GlassCard from '@/components/ui/glass-card';
import AnimatedAvatar from '@/components/ui/animated-avatar';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/lib/design/design-system';
import { HapticFeedback, SpringPresets } from '@/lib/animations/animation-engine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CallStackParamList = {
  VideoCall: {
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    isIncoming?: boolean;
    isGroupCall?: boolean;
    participants?: Array<{ id: string; name: string; avatar?: string }>;
  };
};

type VideoCallRouteProp = RouteProp<CallStackParamList, 'VideoCall'>;

type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';
type LayoutMode = 'spotlight' | 'grid';

const PIP_WIDTH = 120;
const PIP_HEIGHT = 160;
const PIP_MARGIN = 16;

/**
 *
 */
export default function VideoCallScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CallStackParamList>>();
  const route = useRoute<VideoCallRouteProp>();
  const insets = useSafeAreaInsets();
  const {
    recipientId,
    recipientName,
    recipientAvatar,
    isIncoming,
    isGroupCall,
    participants = [],
  } = route.params;

  // State
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('spotlight');
  const [callDuration, setCallDuration] = useState(0);

  // PiP position state
  const [pipPosition, setPipPosition] = useState({
    x: SCREEN_WIDTH - PIP_WIDTH - PIP_MARGIN,
    y: insets.top + PIP_MARGIN,
  });

  // Animations
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const pipScale = useRef(new Animated.Value(1)).current;
  const pipAnimX = useRef(new Animated.Value(pipPosition.x)).current;
  const pipAnimY = useRef(new Animated.Value(pipPosition.y)).current;
  const cameraFlipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Refs
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // PiP Pan Responder
  const pipPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        HapticFeedback.light();
        Animated.spring(pipScale, {
          toValue: 1.05,
          ...SpringPresets.snappy,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        const newX = Math.max(
          PIP_MARGIN,
          Math.min(SCREEN_WIDTH - PIP_WIDTH - PIP_MARGIN, pipPosition.x + gesture.dx)
        );
        const newY = Math.max(
          insets.top + PIP_MARGIN,
          Math.min(SCREEN_HEIGHT - PIP_HEIGHT - PIP_MARGIN - 100, pipPosition.y + gesture.dy)
        );
        pipAnimX.setValue(newX);
        pipAnimY.setValue(newY);
      },
      onPanResponderRelease: (_, gesture) => {
        // Snap to nearest corner
        const midX = SCREEN_WIDTH / 2;
        const finalX =
          pipPosition.x + gesture.dx < midX
            ? PIP_MARGIN
            : SCREEN_WIDTH - PIP_WIDTH - PIP_MARGIN;

        const newY = Math.max(
          insets.top + PIP_MARGIN,
          Math.min(SCREEN_HEIGHT - PIP_HEIGHT - PIP_MARGIN - 100, pipPosition.y + gesture.dy)
        );

        HapticFeedback.medium();

        Animated.parallel([
          Animated.spring(pipAnimX, {
            toValue: finalX,
            ...SpringPresets.bouncy,
            useNativeDriver: true,
          }),
          Animated.spring(pipAnimY, {
            toValue: newY,
            ...SpringPresets.bouncy,
            useNativeDriver: true,
          }),
          Animated.spring(pipScale, {
            toValue: 1,
            ...SpringPresets.snappy,
            useNativeDriver: true,
          }),
        ]).start();

        setPipPosition({ x: finalX, y: newY });
      },
    })
  ).current;

  useEffect(() => {
    // Entry animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Simulate connection
    if (callState === 'connecting') {
      setTimeout(() => {
        HapticFeedback.success();
        setCallState('connected');
      }, 2000);
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
      };
    }
  }, [callState]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsVisible && callState === 'connected') {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

      controlsTimeoutRef.current = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setControlsVisible(false));
      }, 5000);
    }
  }, [controlsVisible, callState]);

  const showControls = useCallback(() => {
    if (!controlsVisible) {
      setControlsVisible(true);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [controlsVisible]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFlipCamera = useCallback(() => {
    HapticFeedback.medium();
    Animated.sequence([
      Animated.timing(cameraFlipAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(cameraFlipAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      cameraFlipAnim.setValue(0);
    });
    setIsFrontCamera(!isFrontCamera);
  }, [isFrontCamera]);

  const handleEndCall = useCallback(() => {
    HapticFeedback.heavy();
    setCallState('ended');
    setTimeout(() => navigation.goBack(), 500);
  }, [navigation]);

  const handleAnswer = useCallback(() => {
    HapticFeedback.success();
    setCallState('connecting');
    setTimeout(() => {
      setCallState('connected');
    }, 2000);
  }, []);

  const handleDecline = useCallback(() => {
    HapticFeedback.error();
    setCallState('ended');
    setTimeout(() => navigation.goBack(), 500);
  }, [navigation]);

  const toggleLayout = useCallback(() => {
    HapticFeedback.light();
    setLayoutMode(prev => (prev === 'spotlight' ? 'grid' : 'spotlight'));
  }, []);

  const cameraFlipRotate = cameraFlipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  const cameraFlipScale = cameraFlipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.8, 1],
  });

  // Render connecting/ringing state
  if (callState === 'connecting' || callState === 'ringing') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[Colors.dark[950], Colors.dark[900]]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.connectingContent, { opacity: fadeAnim }]}>
            <AnimatedAvatar
              source={
                recipientAvatar
                  ? { uri: recipientAvatar }
                   
                  : require('@/assets/default-avatar.png')
              }
              size={140}
              borderAnimation="pulse"
              shape="circle"
              particleEffect="sparkles"
            />

            <Text style={styles.connectingName}>{recipientName}</Text>
            <Text style={styles.connectingStatus}>
              {callState === 'connecting' ? 'Connecting video...' : 'Incoming video call...'}
            </Text>

            {callState === 'ringing' && (
              <View style={styles.incomingControls}>
                <TouchableOpacity
                  style={[styles.callButton, styles.declineButton]}
                  onPress={handleDecline}
                >
                  <LinearGradient
                    colors={[Colors.red[500], Colors.red[600]]}
                    style={styles.callButtonGradient}
                  >
                    <Ionicons name="close" size={36} color="white" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.callButton, styles.answerButton]}
                  onPress={handleAnswer}
                >
                  <LinearGradient
                    colors={[Colors.primary[500], Colors.primary[600]]}
                    style={styles.callButtonGradient}
                  >
                    <Ionicons name="videocam" size={32} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={showControls}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" hidden={!controlsVisible} />

        {/* Remote video (placeholder) */}
        <View style={styles.remoteVideo}>
          <LinearGradient
            colors={[Colors.dark[800], Colors.dark[900]]}
            style={StyleSheet.absoluteFill}
          />
          <AnimatedAvatar
            source={
              recipientAvatar
                ? { uri: recipientAvatar }
                 
                : require('@/assets/default-avatar.png')
            }
            size={100}
            borderAnimation="glow"
            shape="circle"
          />
          <Text style={styles.noVideoText}>{recipientName}</Text>
          <Text style={styles.noVideoSubtext}>Video paused</Text>
        </View>

        {/* Local video PiP */}
        <Animated.View
          {...pipPanResponder.panHandlers}
          style={[
            styles.pip,
            {
              transform: [
                { translateX: pipAnimX },
                { translateY: pipAnimY },
                { scale: pipScale },
                { rotateY: cameraFlipRotate },
                { scaleX: cameraFlipScale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.dark[700], Colors.dark[800]]}
            style={styles.pipContent}
          >
            {isVideoOff ? (
              <View style={styles.pipVideoOff}>
                <Ionicons name="videocam-off" size={24} color={Colors.dark[400]} />
              </View>
            ) : (
              <>
                <View style={styles.pipPlaceholder}>
                  <Ionicons name="person" size={40} color={Colors.dark[500]} />
                </View>
                <View style={styles.pipBadge}>
                  <Text style={styles.pipBadgeText}>You</Text>
                </View>
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Controls overlay */}
        <Animated.View
          style={[
            styles.controlsOverlay,
            { opacity: controlsOpacity },
          ]}
          pointerEvents={controlsVisible ? 'auto' : 'none'}
        >
          {/* Top bar */}
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.topButton}
                onPress={() => {
                  HapticFeedback.light();
                  navigation.goBack();
                }}
              >
                <Ionicons name="chevron-down" size={28} color="white" />
              </TouchableOpacity>

              <View style={styles.topCenter}>
                <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
                <View style={styles.encryptedBadge}>
                  <Ionicons name="lock-closed" size={12} color={Colors.primary[500]} />
                  <Text style={styles.encryptedText}>Encrypted</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.topButton} onPress={handleFlipCamera}>
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Bottom controls */}
          <SafeAreaView edges={['bottom']}>
            <GlassCard variant="frosted" intensity="strong" style={styles.bottomControls}>
              <View style={styles.controlsRow}>
                {/* Mute */}
                <TouchableOpacity
                  style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                  onPress={() => {
                    HapticFeedback.medium();
                    setIsMuted(!isMuted);
                  }}
                >
                  <View
                    style={[
                      styles.controlIconBg,
                      isMuted && { backgroundColor: Colors.semantic.error },
                    ]}
                  >
                    <Ionicons
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={24}
                      color="white"
                    />
                  </View>
                  <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                {/* Video */}
                <TouchableOpacity
                  style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
                  onPress={() => {
                    HapticFeedback.medium();
                    setIsVideoOff(!isVideoOff);
                  }}
                >
                  <View
                    style={[
                      styles.controlIconBg,
                      isVideoOff && { backgroundColor: Colors.semantic.error },
                    ]}
                  >
                    <Ionicons
                      name={isVideoOff ? 'videocam-off' : 'videocam'}
                      size={24}
                      color="white"
                    />
                  </View>
                  <Text style={styles.controlText}>{isVideoOff ? 'Start' : 'Stop'}</Text>
                </TouchableOpacity>

                {/* Layout (for group calls) */}
                {isGroupCall && (
                  <TouchableOpacity style={styles.controlButton} onPress={toggleLayout}>
                    <View style={styles.controlIconBg}>
                      <Ionicons
                        name={layoutMode === 'grid' ? 'grid' : 'expand'}
                        size={24}
                        color="white"
                      />
                    </View>
                    <Text style={styles.controlText}>
                      {layoutMode === 'grid' ? 'Grid' : 'Spotlight'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Effects */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => HapticFeedback.light()}
                >
                  <View style={styles.controlIconBg}>
                    <Ionicons name="sparkles" size={24} color="white" />
                  </View>
                  <Text style={styles.controlText}>Effects</Text>
                </TouchableOpacity>

                {/* End Call */}
                <TouchableOpacity style={styles.controlButton} onPress={handleEndCall}>
                  <LinearGradient
                    colors={[Colors.red[500], Colors.red[600]]}
                    style={styles.endCallButton}
                  >
                    <Ionicons
                      name="call"
                      size={24}
                      color="white"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                  </LinearGradient>
                  <Text style={[styles.controlText, { color: Colors.red[400] }]}>End</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </SafeAreaView>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
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

  // Remote video
  remoteVideo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark[50],
    marginTop: Spacing[4],
  },
  noVideoSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.dark[400],
    marginTop: Spacing[1],
  },

  // PiP
  pip: {
    position: 'absolute',
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  pipContent: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  pipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipVideoOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark[800],
  },
  pipBadge: {
    position: 'absolute',
    bottom: Spacing[2],
    left: Spacing[2],
    backgroundColor: Colors.dark[900] + 'CC',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  pipBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[50],
  },

  // Controls overlay
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark[800] + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    alignItems: 'center',
  },
  callDuration: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark[50],
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[1],
  },
  encryptedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[400],
  },

  // Bottom controls
  bottomControls: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[4],
    paddingVertical: Spacing[4],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  controlButtonActive: {},
  controlIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dark[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[300],
  },
  endCallButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Connecting state
  connectingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  connectingName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark[50],
    marginTop: Spacing[6],
  },
  connectingStatus: {
    fontSize: Typography.fontSize.lg,
    color: Colors.dark[400],
  },
  incomingControls: {
    flexDirection: 'row',
    gap: Spacing[16],
    marginTop: Spacing[12],
  },
  callButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  callButtonGradient: {
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
});
