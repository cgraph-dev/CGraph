/**
 * VideoPlayerModal Component
 *
 * Full-screen video player modal.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { VideoPlayerComponent } from './video-components';

interface VideoPlayerModalProps {
  visible: boolean;
  videoUrl: string | null;
  duration?: number;
  onClose: () => void;
}

/**
 * Full-screen video player modal.
 */
export function VideoPlayerModal({ visible, videoUrl, duration, onClose }: VideoPlayerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.videoPlayerContainer}>
        <TouchableOpacity style={styles.videoPlayerBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.videoPlayerContent}>
          {videoUrl && (
            <VideoPlayerComponent videoUrl={videoUrl} duration={duration} onClose={onClose} />
          )}
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.videoPlayerCloseBtn}
          onPress={onClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <View style={styles.videoPlayerCloseBtnInner}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default VideoPlayerModal;
