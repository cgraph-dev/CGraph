import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

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
 */
export function VoiceMessagePlayer({
  audioUrl,
  duration,
  waveformData,
  isSender = false,
  style,
}: VoiceMessagePlayerProps) {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>(
    waveformData || generatePlaceholderWaveform(30)
  );

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const loadSound = useCallback(async () => {
    if (soundRef.current) return true;
    
    setIsLoading(true);
    setError(null);

    try {
      // Configure audio session for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsLoaded(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Failed to load audio:', err);
      setError('Failed to load audio');
      setIsLoading(false);
      return false;
    }
  }, [audioUrl]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Playback error:', status.error);
        setError('Playback error');
        setIsPlaying(false);
      }
      return;
    }

    const positionSec = status.positionMillis / 1000;
    const durationSec = status.durationMillis ? status.durationMillis / 1000 : duration;
    
    setCurrentTime(positionSec);
    setProgress(durationSec > 0 ? positionSec / durationSec : 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      // Reset position to start
      soundRef.current?.setPositionAsync(0);
    }
  }, [duration]);

  const handlePlayPause = useCallback(async () => {
    await Haptics.selectionAsync();

    if (error) {
      // Retry loading
      setError(null);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsLoaded(false);
      }
    }

    if (!isLoaded) {
      const loaded = await loadSound();
      if (!loaded) return;
    }

    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [isPlaying, isLoaded, error, loadSound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render waveform with progress overlay
  const renderWaveform = () => {
    const barWidth = 2;
    const barGap = 1.5;
    const maxHeight = 24;

    return (
      <View style={styles.waveformContainer}>
        {waveform.map((amplitude, index) => {
          // Calculate if this bar should be "played" based on progress
          const barProgress = index / waveform.length;
          const isPlayed = barProgress <= progress;

          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(4, amplitude * maxHeight),
                  width: barWidth,
                  marginHorizontal: barGap / 2,
                  backgroundColor: isPlayed
                    ? (isSender ? '#fff' : colors.primary)
                    : (isSender ? 'rgba(255,255,255,0.4)' : colors.border),
                },
              ]}
            />
          );
        })}
      </View>
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
            backgroundColor: isSender 
              ? 'rgba(255,255,255,0.2)' 
              : colors.background 
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
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={buttonColor}
          />
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
            {formatTime(duration)}
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
