import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, AudioStatus, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/theme-context';
import { createLogger } from '../lib/logger';

const logger = createLogger('VoicePlayer');

interface VoiceMessagePlayerProps {
  /** Audio source URL */
  audioUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Preloaded waveform data (optional) */
  waveformData?: number[];
  /** Whether this message was sent by the current user */
  isSender?: boolean;
  /** Additional styles */
  style?: object;
}

/**
 * Audio player component for voice messages in React Native.
 *
 * Features:
 * - Play/pause controls with haptic feedback
 * - Waveform visualization with progress overlay
 * - Duration display with current position
 * - Loading state handling
 * - Error handling with retry
 *
 * Uses expo-audio (SDK 54+) for modern audio playback.
 */
export function VoiceMessagePlayer({
  audioUrl,
  duration: initialDuration,
  waveformData,
  isSender = false,
  style,
}: VoiceMessagePlayerProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(initialDuration || 0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>(
    waveformData || generatePlaceholderWaveform(30)
  );
  const waveformContainerRef = useRef<View>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Create audio player with expo-audio hook
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  // Derive playing state from player status
  const isPlaying = status.playing;

  // Create animated values for each waveform bar
  const barAnimations = useMemo(() => waveform.map(() => new Animated.Value(1)), [waveform.length]);

  // Configure audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  // Handle status updates from expo-audio
  useEffect(() => {
    if (!status) return;

    const { currentTime: positionSec, duration: durationSec, playing } = status;

    // Update duration if we got it from the audio
    if (durationSec && durationSec > 0) {
      setAudioDuration(durationSec);
    }

    // Update current time and progress
    setCurrentTime(positionSec || 0);
    const effectiveDuration = durationSec || audioDuration;
    if (effectiveDuration > 0 && positionSec !== undefined) {
      setProgress(positionSec / effectiveDuration);
    }

    // Handle playback finished - reset to beginning
    if (!playing && positionSec !== undefined && audioDuration > 0) {
      const duration = durationSec || audioDuration;
      // If we're at the end (within 100ms), reset for replay
      if (positionSec >= duration - 0.1) {
        setProgress(0);
        setCurrentTime(0);
        player.seekTo(0);
      }
    }

    setIsLoading(false);
  }, [status, audioDuration, player]);

  // Animate waveform bars when playing
  useEffect(() => {
    if (isPlaying) {
      const animations = barAnimations.map((anim, index) => {
        const delay = index * 30; // Staggered start
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay % 300),
            Animated.timing(anim, {
              toValue: 1.3,
              duration: 200 + (index % 3) * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.85,
              duration: 200 + ((index + 1) % 3) * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ])
        );
      });

      animations.forEach((anim) => anim.start());

      return () => {
        animations.forEach((anim) => anim.stop());
        barAnimations.forEach((anim) => anim.setValue(1));
      };
    } else {
      // Reset all animations when not playing
      barAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying, barAnimations]);

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const handlePlayPause = useCallback(async () => {
    await Haptics.selectionAsync();

    if (error) {
      setError(null);
    }

    try {
      if (isPlaying) {
        player.pause();
      } else {
        // Check if at end and reset first
        const duration = status.duration || audioDuration;
        const position = status.currentTime || 0;
        if (duration > 0 && position >= duration - 0.1) {
          player.seekTo(0);
          setProgress(0);
          setCurrentTime(0);
        }
        player.play();
      }
    } catch (err) {
      logger.error('Play/pause error:', err);
      setError('Playback error');
    }
  }, [isPlaying, player, status, audioDuration, error]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seek when user taps on waveform
  const handleSeek = useCallback(
    async (event: { nativeEvent: { locationX: number } }) => {
      const { locationX } = event.nativeEvent;

      // Measure the waveform container width
      if (waveformContainerRef.current) {
        waveformContainerRef.current.measure((_x: number, _y: number, width: number) => {
          if (width > 0 && audioDuration > 0) {
            const newProgress = Math.max(0, Math.min(1, locationX / width));
            const newPosition = newProgress * audioDuration;

            setProgress(newProgress);
            setCurrentTime(newPosition);

            player.seekTo(newPosition);
          }
        });
      }
    },
    [audioDuration, player]
  );

  // Waveform rendering constants
  const barWidth = 2;
  const barGap = 1.5;
  const maxHeight = 24;

  // Render waveform with progress overlay and animation
  const renderWaveform = () => {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handleSeek}>
        <View ref={waveformContainerRef} style={styles.waveformContainer}>
          {waveform.map((amplitude, index) => {
            const barProgress = index / waveform.length;
            const isPlayed = barProgress <= progress;

            return (
              <Animated.View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: Math.max(4, amplitude * maxHeight),
                    width: barWidth,
                    marginHorizontal: barGap / 2,
                    backgroundColor: isPlayed
                      ? isSender
                        ? '#fff'
                        : colors.primary
                      : isSender
                        ? 'rgba(255,255,255,0.4)'
                        : colors.border,
                    transform: [{ scaleY: barAnimations[index] || 1 }],
                  },
                ]}
              />
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  const buttonColor = isSender ? '#fff' : colors.primary;
  const secondaryColor = isSender ? 'rgba(255,255,255,0.7)' : colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[
          styles.playButton,
          {
            backgroundColor: isSender ? 'rgba(255,255,255,0.2)' : colors.background,
          },
        ]}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={buttonColor} />
        ) : error ? (
          <Ionicons name="reload" size={20} color={buttonColor} />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={buttonColor} />
        )}
      </TouchableOpacity>

      {/* Waveform and Duration */}
      <View style={styles.content}>
        {renderWaveform()}
        <View style={styles.timeContainer}>
          <Text style={[styles.currentTime, { color: buttonColor }]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={[styles.separator, { color: secondaryColor }]}> / </Text>
          <Text style={[styles.duration, { color: secondaryColor }]}>
            {formatTime(audioDuration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Generate a placeholder waveform for visual consistency
 * when actual waveform data is not available.
 */
function generatePlaceholderWaveform(length: number): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < length; i++) {
    // Create a smooth wave pattern
    const phase = (i / length) * Math.PI * 4;
    const amplitude = 0.3 + 0.4 * Math.sin(phase) + 0.2 * Math.random();
    waveform.push(Math.max(0.1, Math.min(1, amplitude)));
  }
  return waveform;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 180,
    maxWidth: 260,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    overflow: 'hidden',
  },
  waveformBar: {
    borderRadius: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    fontSize: 11,
  },
  duration: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});

export default VoiceMessagePlayer;
