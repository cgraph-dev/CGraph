/**
 * Video Components for ConversationScreen
 *
 * Components for video thumbnail display and playback.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useState, useEffect, memo } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import type {
  VideoPlayerComponentProps,
  InlineVideoThumbnailProps,
  AttachmentVideoPreviewProps,
} from '../types';

// =============================================================================
// Inline Video Thumbnail
// =============================================================================

/**
 * Shows first frame of video without playback controls.
 * Used for displaying video previews in message bubbles.
 */
export const InlineVideoThumbnail = memo(function InlineVideoThumbnail({
  videoUrl,
}: InlineVideoThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const { colors } = useThemeStore();

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
    player.pause(); // Keep paused to show first frame only
  });

  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.log('[Video] Loading thumbnail for:', videoUrl);
    }
    const errorSub = player.addListener('statusChange', (status) => {
      if (status.error) {
        console.error('[Video] Thumbnail error:', status.error);
        setHasError(true);
      }
    });
    return () => errorSub.remove();
  }, [player, videoUrl]);

  if (hasError) {
    return (
      <View
        style={[
          styles.videoThumbnail,
          { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Ionicons name="videocam-off-outline" size={40} color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <VideoView
      style={styles.videoThumbnail}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
});

// =============================================================================
// Video Player Component
// =============================================================================

/**
 * Full-screen video player with custom controls.
 * Used for playing videos in fullscreen modal.
 */
export const VideoPlayerComponent = memo(function VideoPlayerComponent({
  videoUrl,
  duration,
  onClose,
}: VideoPlayerComponentProps) {
  const { colors } = useThemeStore();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
    player.play();
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.log('[Video] Playing video:', videoUrl);
    }

    const playSub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const statusSub = player.addListener('statusChange', (status) => {
      if (status.error) {
        console.error('[Video] Player error:', status.error);
        setHasError(true);
        setErrorMessage(String(status.error));
      }
    });

    return () => {
      playSub.remove();
      statusSub.remove();
    };
  }, [player, videoUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.currentTime !== undefined) {
        setCurrentTime(player.currentTime);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [player]);

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTap = () => {
    setShowControls(!showControls);
  };

  if (hasError) {
    return (
      <View
        style={[
          styles.videoPlayerWrapper,
          { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={64} color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>Failed to load video</Text>
        {__DEV__ && errorMessage && (
          <Text
            style={{
              color: '#999',
              marginTop: 8,
              fontSize: 12,
              textAlign: 'center',
              paddingHorizontal: 20,
            }}
          >
            {errorMessage}
          </Text>
        )}
        <TouchableOpacity
          style={{
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: 8,
          }}
          onPress={onClose}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              <View
                style={[
                  styles.videoProgressFill,
                  {
                    width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
            <Text style={styles.videoTimeText}>{duration ? formatTime(duration) : '--:--'}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
});

// =============================================================================
// Attachment Video Preview
// =============================================================================

/**
 * Video preview component for pending attachments.
 * Shows thumbnail with play button and duration badge.
 */
export const AttachmentVideoPreview = memo(function AttachmentVideoPreview({
  uri,
  duration,
}: AttachmentVideoPreviewProps) {
  const { colors } = useThemeStore();
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.pause();
  });

  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.log('[Video] Attachment preview for:', uri);
    }
    const errorSub = player.addListener('statusChange', (status) => {
      if (status.error) {
        console.error('[Video] Attachment preview error:', status.error);
        setHasError(true);
      }
    });
    return () => errorSub.remove();
  }, [player, uri]);

  if (hasError) {
    return (
      <View
        style={[
          styles.attachmentPreviewVideoContainer,
          { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Ionicons name="videocam-outline" size={48} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Video</Text>
        {duration !== undefined && duration > 0 && (
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.attachmentPreviewVideoContainer}>
      <VideoView
        style={styles.attachmentPreviewImage}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.videoPlayOverlay}>
        <View style={styles.videoPlayButton}>
          <Ionicons name="play" size={40} color="#fff" />
        </View>
      </View>
      {duration !== undefined && duration > 0 && (
        <View style={styles.videoDurationBadge}>
          <Text style={styles.videoDurationText}>
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </Text>
        </View>
      )}
    </View>
  );
});

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  // Thumbnail styles
  videoThumbnail: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Player styles
  videoPlayerWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPlayer: {
    flex: 1,
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayPauseBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayPauseBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoProgressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    width: 45,
  },
  videoProgressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  videoProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },

  // Attachment preview styles
  attachmentPreviewVideoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachmentPreviewImage: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default {
  InlineVideoThumbnail,
  VideoPlayerComponent,
  AttachmentVideoPreview,
};
