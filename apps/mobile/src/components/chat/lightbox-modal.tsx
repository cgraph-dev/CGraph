import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

// ============================================================================
// Lightbox Video Player
// ============================================================================

interface LightboxVideoProps {
  url: string;
}

function LightboxVideo({ url }: LightboxVideoProps): React.ReactElement | null {
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.play();
  });

  return (
    <VideoView player={player} style={styles.lightboxVideo} nativeControls contentFit="contain" />
  );
}

// ============================================================================
// Lightbox Modal Component
// ============================================================================

interface LightboxModalProps {
  media: { url: string; type: 'image' | 'video' } | null;
  onClose: () => void;
}

/** Lightbox Modal component. */
function LightboxModal({ media, onClose }: LightboxModalProps): React.ReactElement {
  return (
    <Modal visible={!!media} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lightboxContainer}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="dark" />
        </Pressable>

        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <BlurView intensity={80} tint="dark" style={styles.closeButtonInner}>
            <Ionicons name="close" size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        {media && (
          <View style={styles.lightboxContent}>
            {media.type === 'image' ? (
              <Image
                source={{ uri: media.url }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            ) : (
              <LightboxVideo url={media.url} />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  lightboxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  closeButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContent: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxVideo: {
    width: '100%',
    height: '100%',
  },
});

export default LightboxModal;
