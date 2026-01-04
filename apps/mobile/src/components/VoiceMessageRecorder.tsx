import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
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
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // Ignore errors during cleanup
      }
      recordingRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {
        // Ignore errors during cleanup
      }
      soundRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Create and prepare recording
      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        },
        undefined, // No status update callback, we use metering
        100 // 100ms metering interval
      );

      recordingRef.current = recording;
      setState('recording');
      setDuration(0);
      setWaveformData([]);

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
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          try {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording && status.metering !== undefined) {
              // Convert dB to 0-1 range (metering is in dB, typically -160 to 0)
              const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
              setWaveformData(prev => [...prev, normalizedLevel].slice(-50));
            }
          } catch (e) {
            // Ignore metering errors
          }
        }
      }, 100);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      cleanup();
    }
  }, [maxDuration, cleanup]);

  const stopRecording = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        if (uri) {
          setRecordingUri(uri);
          setState('preview');
        }
      } catch (err) {
        console.error('Failed to stop recording:', err);
        setError('Failed to save recording. Please try again.');
      }
    }
  }, []);

  const handleCancel = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cleanup();
    setRecordingUri(null);
    setWaveformData([]);
    setDuration(0);
    setPlaybackPosition(0);
    setIsPlaying(false);
    setState('idle');
    onCancel?.();
  }, [cleanup, onCancel]);

  const handlePlayPause = useCallback(async () => {
    if (!recordingUri) return;

    await Haptics.selectionAsync();

    if (isPlaying) {
      // Pause
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } else {
      // Play
      try {
        if (soundRef.current) {
          await soundRef.current.playAsync();
        } else {
          // Reset audio mode for playback
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: recordingUri },
            { shouldPlay: true },
            (status: { isLoaded: boolean; positionMillis?: number; didJustFinish?: boolean }) => {
              if (status.isLoaded) {
                setPlaybackPosition((status.positionMillis || 0) / 1000);
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  setPlaybackPosition(0);
                }
              }
            }
          );
          soundRef.current = sound;
        }
        setIsPlaying(true);
      } catch (err) {
        console.error('Failed to play recording:', err);
      }
    }
  }, [recordingUri, isPlaying]);

  const handleSend = useCallback(async () => {
    if (!recordingUri) return;
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setState('uploading');

    // Cleanup sound if playing
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

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
    const bars = waveformData.length > 0 ? waveformData : Array(20).fill(0.1);
    const barWidth = 3;
    const barGap = 2;
    const maxHeight = 40;

    return (
      <View style={styles.waveformContainer}>
        {bars.slice(-30).map((amplitude, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: Math.max(4, amplitude * maxHeight),
                backgroundColor: state === 'recording' ? colors.error : colors.primary,
                width: barWidth,
                marginHorizontal: barGap / 2,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.retryText, { color: colors.primary }]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {state === 'idle' && (
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: colors.primary }]}
          onPress={startRecording}
        >
          <Ionicons name="mic" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Hold to Record</Text>
        </TouchableOpacity>
      )}

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
