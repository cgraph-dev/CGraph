/**
 * AttachmentVideoPreview Component
 *
 * Displays a video thumbnail preview for pending attachments before sending.
 * Uses expo-video for efficient video frame rendering.
 *
 * @module components/conversation/AttachmentVideoPreview
 * @since v0.7.29
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AttachmentVideoPreviewProps {
  /** Local file URI of the video */
  uri: string;
  /** Video duration in seconds (optional) */
  duration?: number;
}

/**
 * Formats seconds to MM:SS display format.
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

/**
 * Renders a video preview thumbnail with play overlay and duration badge.
 *
 * Used in the attachment preview modal before sending videos.
 * The video player is paused by default, showing the first frame as a thumbnail.
 *
 * @example
 * ```tsx
 * <AttachmentVideoPreview
 *   uri="file:///path/to/video.mp4"
 *   duration={45}
 * />
 * ```
 */
export const AttachmentVideoPreview = memo(function AttachmentVideoPreview({
  uri,
  duration,
}: AttachmentVideoPreviewProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.pause(); // Start paused to show thumbnail
  });

  return (
    <View style={styles.container}>
      <VideoView style={styles.video} player={player} contentFit="cover" nativeControls={false} />

      {/* Play button overlay */}
      <View style={styles.playOverlay}>
        <View style={styles.playButton}>
          <Ionicons name="play" size={40} color="#fff" />
        </View>
      </View>

      {/* Duration badge */}
      {duration !== undefined && duration > 0 && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT * 0.5,
  },
  video: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 12,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AttachmentVideoPreview;
