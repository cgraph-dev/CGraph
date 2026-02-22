/**
 * VideoPlayerComponent
 * 
 * Full-featured video player using expo-video with custom controls.
 * Provides play/pause, progress tracking, and time display.
 * 
 * @module components/conversation/VideoPlayerComponent
 * @since v0.7.29
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

export interface VideoPlayerComponentProps {
  /** URL of the video to play */
  videoUrl: string;
  /** Total duration in seconds (optional, for progress display) */
  duration?: number;
  /** Callback when close is requested */
  onClose: () => void;
}

/**
 * Formats seconds to MM:SS display format.
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Custom video player with overlay controls.
 * 
 * Features:
 * - Auto-plays on mount
 * - Tap to show/hide controls
 * - Play/pause toggle
 * - Progress bar with current time / duration
 * - Native video rendering via expo-video
 * 
 * @example
 * ```tsx
 * <VideoPlayerComponent
 *   videoUrl="https://example.com/video.mp4"
 *   duration={120}
 *   onClose={() => setShowPlayer(false)}
 * />
 * ```
 */
export const VideoPlayerComponent = memo(function VideoPlayerComponent({
  videoUrl,
  duration,
  onClose,
}: VideoPlayerComponentProps) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.play();
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Subscribe to playing state changes
  useEffect(() => {
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Poll for current time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (player.currentTime !== undefined) {
        setCurrentTime(player.currentTime);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  }, [isPlaying, player]);

  const handleTap = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <Pressable style={styles.videoPlayerWrapper} onPress={handleTap}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />

      {/* Custom Controls Overlay */}
      {showControls && (
        <View style={styles.videoControlsOverlay}>
          {/* Center play/pause button */}
          <TouchableOpacity style={styles.videoPlayPauseBtn} onPress={togglePlayPause}>
            <View style={styles.videoPlayPauseBtnInner}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Bottom progress bar */}
          <View style={styles.videoProgressContainer}>
            <Text style={styles.videoTimeText}>{formatTime(currentTime)}</Text>
            <View style={styles.videoProgressBar}>
              <View style={[styles.videoProgressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.videoTimeText}>
              {duration ? formatTime(duration) : '--:--'}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  videoPlayerWrapper: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayPauseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayPauseBtnInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  videoProgressContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  videoProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  videoTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
});

export default VideoPlayerComponent;
