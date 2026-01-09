/**
 * VideoPlayerModal Component
 * 
 * Full-screen video player modal with playback controls.
 * Wraps the VideoPlayerComponent for modal presentation.
 * 
 * @module components/conversation/VideoPlayerModal
 * @since v0.7.29
 */

import React, { memo, useCallback, useState, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

export interface VideoPlayerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Video source URL */
  videoUrl: string | null;
  /** Animation value for entrance/exit */
  viewerAnim: Animated.Value;
  /** Scale animation for zoom effect */
  scaleAnim: Animated.Value;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Full-screen video player modal.
 * 
 * Features:
 * - Uses expo-video for native playback
 * - Loading state with spinner
 * - Error handling with retry option
 * - Fade and scale entrance animation
 * - Tap backdrop to dismiss
 * 
 * @example
 * ```tsx
 * <VideoPlayerModal
 *   visible={showVideo}
 *   videoUrl="https://example.com/video.mp4"
 *   viewerAnim={fadeAnim}
 *   scaleAnim={scaleAnim}
 *   onClose={() => setShowVideo(false)}
 * />
 * ```
 */
export const VideoPlayerModal = memo(function VideoPlayerModal({
  visible,
  videoUrl,
  viewerAnim,
  scaleAnim,
  onClose,
}: VideoPlayerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(videoUrl || '', (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.play();
    setIsLoading(false);
    setHasError(false);
  });

  const handleRetry = useCallback(() => {
    if (player && videoUrl) {
      setIsLoading(true);
      setHasError(false);
      player.replace(videoUrl);
      player.play();
    }
  }, [player, videoUrl]);

  const handleClose = useCallback(() => {
    if (player) {
      player.pause();
    }
    onClose();
  }, [player, onClose]);

  if (!videoUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: viewerAnim }]}>
        {/* Backdrop - tap to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        {/* Video content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
              opacity: viewerAnim,
            },
          ]}
        >
          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color="#f43f5e" />
              <Text style={styles.errorText}>Failed to load video</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <VideoView
                player={player}
                style={styles.video}
                nativeControls
                contentFit="contain"
                allowsFullscreen
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </>
          )}
        </Animated.View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <View style={styles.closeBtnInner}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '500',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  closeBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPlayerModal;
