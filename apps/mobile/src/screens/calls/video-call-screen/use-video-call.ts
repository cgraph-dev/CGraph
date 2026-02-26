import { durations } from '@cgraph/animation-constants';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HapticFeedback, SpringPresets } from '@/lib/animations/animation-engine';
import { PIP_WIDTH, PIP_HEIGHT, PIP_MARGIN, type CallStackParamList, type CallState, type LayoutMode } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function useVideoCall() {
  const navigation = useNavigation<NativeStackNavigationProp<CallStackParamList>>();
  const route = useRoute<RouteProp<CallStackParamList, 'VideoCall'>>();
  const insets = useSafeAreaInsets();
  const {
    recipientId, recipientName, recipientAvatar,
    isIncoming, isGroupCall, participants = [],
  } = route.params;

  // State
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('spotlight');
  const [callDuration, setCallDuration] = useState(0);
  const [pipPosition, setPipPosition] = useState({
    x: SCREEN_WIDTH - PIP_WIDTH - PIP_MARGIN,
    y: insets.top + PIP_MARGIN,
  });

  // Animations
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const pipScale = useRef(new Animated.Value(1)).current;
  const pipAnimX = useRef(new Animated.Value(SCREEN_WIDTH - PIP_WIDTH - PIP_MARGIN)).current;
  const pipAnimY = useRef(new Animated.Value(insets.top + PIP_MARGIN)).current;
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
        Animated.spring(pipScale, { toValue: 1.05, ...SpringPresets.snappy, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gesture) => {
        const newX = Math.max(PIP_MARGIN, Math.min(SCREEN_WIDTH - PIP_WIDTH - PIP_MARGIN, pipPosition.x + gesture.dx));
        const newY = Math.max(insets.top + PIP_MARGIN, Math.min(SCREEN_HEIGHT - PIP_HEIGHT - PIP_MARGIN - 100, pipPosition.y + gesture.dy));
        pipAnimX.setValue(newX);
        pipAnimY.setValue(newY);
      },
      onPanResponderRelease: (_, gesture) => {
        const midX = SCREEN_WIDTH / 2;
        const finalX = pipPosition.x + gesture.dx < midX ? PIP_MARGIN : SCREEN_WIDTH - PIP_WIDTH - PIP_MARGIN;
        const newY = Math.max(insets.top + PIP_MARGIN, Math.min(SCREEN_HEIGHT - PIP_HEIGHT - PIP_MARGIN - 100, pipPosition.y + gesture.dy));
        HapticFeedback.medium();
        Animated.parallel([
          Animated.spring(pipAnimX, { toValue: finalX, ...SpringPresets.bouncy, useNativeDriver: true }),
          Animated.spring(pipAnimY, { toValue: newY, ...SpringPresets.bouncy, useNativeDriver: true }),
          Animated.spring(pipScale, { toValue: 1, ...SpringPresets.snappy, useNativeDriver: true }),
        ]).start();
        setPipPosition({ x: finalX, y: newY });
      },
    })
  ).current;

  // Entry animation + simulate connection
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: durations.slow.ms, useNativeDriver: true }).start();
    if (callState === 'connecting') {
      setTimeout(() => { HapticFeedback.success(); setCallState('connected'); }, 2000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
      return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
    }
  }, [callState]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsVisible && callState === 'connected') {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        Animated.timing(controlsOpacity, { toValue: 0, duration: durations.slow.ms, useNativeDriver: true })
          .start(() => setControlsVisible(false));
      }, 5000);
    }
  }, [controlsVisible, callState]);

  const showControls = useCallback(() => {
    if (!controlsVisible) {
      setControlsVisible(true);
      Animated.timing(controlsOpacity, { toValue: 1, duration: durations.normal.ms, useNativeDriver: true }).start();
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
      Animated.timing(cameraFlipAnim, { toValue: 0.5, duration: durations.fast.ms, useNativeDriver: true }),
      Animated.timing(cameraFlipAnim, { toValue: 1, duration: durations.fast.ms, useNativeDriver: true }),
    ]).start(() => cameraFlipAnim.setValue(0));
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
    setTimeout(() => setCallState('connected'), 2000);
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

  const cameraFlipRotate = cameraFlipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '0deg'] });
  const cameraFlipScale = cameraFlipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.8, 1] });

  return {
    navigation, recipientId, recipientName, recipientAvatar,
    isIncoming, isGroupCall, participants,
    callState, isMuted, setIsMuted, isVideoOff, setIsVideoOff,
    isFrontCamera, controlsVisible, layoutMode, callDuration,
    controlsOpacity, pipScale, pipAnimX, pipAnimY, fadeAnim,
    cameraFlipRotate, cameraFlipScale,
    pipPanResponder, showControls, formatDuration,
    handleFlipCamera, handleEndCall, handleAnswer, handleDecline, toggleLayout,
  };
}
