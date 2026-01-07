import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { createLogger } from '../lib/logger';

const logger = createLogger('VoiceRecorder');

interface VoiceMessageRecorderProps {
  /** Callback when recording is complete and ready to send */
  onComplete: (data: { uri: string; duration: number; waveform: number[] }) => void;
  /** Callback when recording is cancelled */
  onCancel?: () => void;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
}

type RecordingState = 'idle' | 'recording' | 'preview' | 'uploading';

/**
 * Voice message recorder component for React Native.
 * 
 * Features:
 * - Microphone recording with visual feedback
 * - Live waveform visualization during recording
 * - Preview before sending with playback
 * - Automatic stop at max duration
 * - Cancel/delete functionality
 * - Haptic feedback for interactions
 */
export function VoiceMessageRecorder({
  onComplete,
  onCancel,
  maxDuration = 300,
}: VoiceMessageRecorderProps) {
  const { colors } = useTheme();
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  // expo-audio hooks for recording
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  
  // Player for preview - will be set when we have a recording URI
  const previewPlayer = useAudioPlayer(recordingUri || undefined);
  const previewStatus = useAudioPlayerStatus(previewPlayer);
  const isPlaying = previewStatus?.playing || false;
  const playbackFinished = previewStatus && !previewStatus.playing && 
    previewStatus.currentTime > 0 && 
    previewStatus.duration > 0 && 
    previewStatus.currentTime >= previewStatus.duration - 0.1;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animated values for recording waveform bars (30 bars)
  const waveformAnims = useRef<Animated.Value[]>(
    Array.from({ length: 30 }, () => new Animated.Value(0.1))
  ).current;
  
  // Current metering level for animations
  const currentMeteringRef = useRef(0);
  
  // Refs to track latest recorder state for interval callbacks
  const isRecordingRef = useRef(false);
  const meteringRef = useRef<number | undefined>(undefined);
  
  // Update refs when recorder state changes
  useEffect(() => {
    isRecordingRef.current = recorderState.isRecording;
    meteringRef.current = recorderState.metering;
  }, [recorderState.isRecording, recorderState.metering]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();
      if (!permissionStatus.granted) {
        setError('Microphone permission is required to record voice messages');
      }
    })();

    return () => {
      cleanup();
    };
  }, []);

  // Pulsing animation for recording indicator
  useEffect(() => {
    if (state === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const cleanup = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
    // expo-audio handles cleanup automatically via hooks
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Configure audio session for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording with expo-audio
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setState('recording');
      setDuration(0);
      setWaveformData([]);
      
      // Reset all waveform animations
      waveformAnims.forEach(anim => anim.setValue(0.1));

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      // Start metering for waveform visualization
      // expo-audio's metering may not update continuously via hooks
      // So we use a combination of real metering (when available) and simulation
      let barIndex = 0;
      let lastMeteringValue = 0.3;
      
      meteringIntervalRef.current = setInterval(() => {
        // Check if we have real metering data from expo-audio
        const hasRealMetering = meteringRef.current !== undefined && meteringRef.current !== null;
        
        let normalizedLevel: number;
        
        if (hasRealMetering && isRecordingRef.current) {
          // Use real metering data - convert dB to 0-1 range
          normalizedLevel = Math.max(0.15, Math.min(1, (meteringRef.current! + 60) / 60));
          lastMeteringValue = normalizedLevel;
        } else {
          // Simulate organic waveform when real metering isn't available
          // Create smooth transitions with some randomness
          const targetLevel = 0.2 + Math.random() * 0.6; // Random between 0.2 and 0.8
          normalizedLevel = lastMeteringValue + (targetLevel - lastMeteringValue) * 0.3;
          normalizedLevel = Math.max(0.15, Math.min(0.85, normalizedLevel));
          lastMeteringValue = normalizedLevel;
        }
        
        currentMeteringRef.current = normalizedLevel;
        setWaveformData(prev => [...prev, normalizedLevel].slice(-50));
        
        // Animate the current bar with smooth spring animation
        Animated.spring(waveformAnims[barIndex % 30], {
          toValue: normalizedLevel,
          friction: 3,
          tension: 100,
          useNativeDriver: false,
        }).start();
        
        // Move to next bar
        barIndex++;
        
        // Also add some random variation to nearby bars for organic feel
        const nearbyIndex = (barIndex + 1) % 30;
        const variation = normalizedLevel * (0.5 + Math.random() * 0.5);
        Animated.spring(waveformAnims[nearbyIndex], {
          toValue: variation,
          friction: 4,
          tension: 80,
          useNativeDriver: false,
        }).start();
      }, 80);

    } catch (err) {
      logger.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      cleanup();
    }
  }, [maxDuration, cleanup, audioRecorder, recorderState]);

  const stopRecording = useCallback(async () => {
    // Guard: only stop if we're actually recording
    if (state !== 'recording') return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }

    try {
      // Check recorder state before stopping
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      }
      const uri = audioRecorder.uri;
      if (uri) {
        setRecordingUri(uri);
        setState('preview');
      }
    } catch (err) {
      logger.error('Failed to stop recording:', err);
      setError('Failed to save recording. Please try again.');
    }
  }, [audioRecorder, recorderState.isRecording, state]);

  const handleCancel = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cleanup();
    setRecordingUri(null);
    setWaveformData([]);
    setDuration(0);
    setPlaybackPosition(0);
    setState('idle');
    onCancel?.();
  }, [cleanup, onCancel]);

  const handlePlayPause = useCallback(async () => {
    if (!recordingUri) return;

    await Haptics.selectionAsync();

    try {
      // Reset audio mode for playback
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (isPlaying) {
        previewPlayer.pause();
      } else {
        // If playback finished (at the end), seek to beginning first
        if (playbackFinished) {
          previewPlayer.seekTo(0);
          // Small delay to let seek complete before playing
          setTimeout(() => {
            previewPlayer.play();
          }, 50);
        } else {
          previewPlayer.play();
        }
      }
    } catch (err) {
      logger.error('Failed to play recording:', err);
    }
  }, [recordingUri, isPlaying, previewPlayer, playbackFinished]);

  // Update playback position from preview player status
  useEffect(() => {
    if (previewStatus) {
      setPlaybackPosition(previewStatus.currentTime || 0);
    }
  }, [previewStatus]);

  const handleSend = useCallback(async () => {
    if (!recordingUri) return;
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setState('uploading');

    onComplete({
      uri: recordingUri,
      duration,
      waveform: waveformData,
    });
  }, [recordingUri, duration, waveformData, onComplete]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render waveform visualization
  const renderWaveform = () => {
    const barWidth = 3;
    const barGap = 2;
    const maxHeight = 40;
    
    // During recording, use animated values for smooth real-time visualization
    if (state === 'recording') {
      return (
        <View style={styles.waveformContainer}>
          {waveformAnims.map((animValue, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, maxHeight],
                  }),
                  backgroundColor: colors.error,
                  width: barWidth,
                  marginHorizontal: barGap / 2,
                },
              ]}
            />
          ))}
        </View>
      );
    }
    
    // For preview/other states, use static waveform data
    const bars = waveformData.length > 0 ? waveformData : Array(30).fill(0.1);
    const displayBars = bars.slice(-30);
    
    // Pad to 30 bars if needed
    while (displayBars.length < 30) {
      displayBars.unshift(0.1);
    }
    
    // Calculate progress for preview mode waveform animation
    let progressRatio = 0;
    if (state === 'preview' && previewStatus?.duration && previewStatus.duration > 0) {
      progressRatio = (previewStatus.currentTime || 0) / previewStatus.duration;
    }
    const progressIndex = Math.floor(progressRatio * displayBars.length);

    return (
      <View style={styles.waveformContainer}>
        {displayBars.map((amplitude, index) => {
          // In preview mode, color bars based on playback progress
          let barColor = colors.primary;
          if (state === 'preview') {
            barColor = index <= progressIndex ? colors.primary : colors.textSecondary;
          }
          
          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(4, amplitude * maxHeight),
                  backgroundColor: barColor,
                  width: barWidth,
                  marginHorizontal: barGap / 2,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  if (error) {
    return (
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // In idle state, wrap with TouchableWithoutFeedback to allow dismiss on tap outside
  if (state === 'idle') {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: colors.primary }]}
          onPress={startRecording}
        >
          <Ionicons name="mic" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Tap to Record</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={handleCancel}
        >
          <Text style={[styles.dismissText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {state === 'recording' && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingHeader}>
            <Animated.View
              style={[
                styles.recordingIndicator,
                { backgroundColor: colors.error, transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text style={[styles.recordingTime, { color: colors.text }]}>
              {formatDuration(duration)}
            </Text>
            <Text style={[styles.maxDuration, { color: colors.textSecondary }]}>
              / {formatDuration(maxDuration)}
            </Text>
          </View>

          {renderWaveform()}

          <View style={styles.recordingActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background }]}
              onPress={handleCancel}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: colors.error }]}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={32} color="#fff" />
            </TouchableOpacity>

            <View style={styles.actionButtonPlaceholder} />
          </View>
        </View>
      )}

      {state === 'preview' && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>Voice Message</Text>
            <Text style={[styles.previewDuration, { color: colors.textSecondary }]}>
              {formatDuration(duration)}
            </Text>
          </View>

          {renderWaveform()}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background }]}
              onPress={handleCancel}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: '#22c55e' }]}
              onPress={handleSend}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === 'uploading' && (
        <View style={styles.uploadingContainer}>
          <Ionicons name="cloud-upload" size={32} color={colors.primary} />
          <Text style={[styles.uploadingText, { color: colors.text }]}>Sending...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
  },
  recordingContainer: {
    gap: 16,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  maxDuration: {
    fontSize: 14,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    overflow: 'hidden',
  },
  waveformBar: {
    borderRadius: 2,
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPlaceholder: {
    width: 44,
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    gap: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewDuration: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  uploadingText: {
    fontSize: 14,
  },
});

export default VoiceMessageRecorder;
