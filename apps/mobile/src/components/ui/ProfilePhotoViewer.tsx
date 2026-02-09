/**
 * ProfilePhotoViewer - Fullscreen avatar viewer with zoom animation (Mobile)
 * Tap any avatar to expand to fullscreen with Reanimated morph + pinch-to-zoom
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────
interface ProfilePhoto {
  source: ImageSourcePropType | null;
  name: string;
  fallback?: string;
}

interface ProfilePhotoViewerContextValue {
  open: (photo: ProfilePhoto) => void;
  close: () => void;
}

// ── Context ────────────────────────────────────────────────
const Ctx = createContext<ProfilePhotoViewerContextValue | null>(null);

export function useProfilePhotoViewer() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      'useProfilePhotoViewer must be used within ProfilePhotoViewerProvider',
    );
  }
  return ctx;
}

// ── Provider ───────────────────────────────────────────────
export function ProfilePhotoViewerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [photo, setPhoto] = useState<ProfilePhoto | null>(null);

  const open = useCallback((p: ProfilePhoto) => {
    setPhoto(p);
    setVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setPhoto(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        {photo && (
          <FullscreenViewer photo={photo} onClose={close} />
        )}
      </Modal>
    </Ctx.Provider>
  );
}

// ── Fullscreen Viewer ──────────────────────────────────────
function FullscreenViewer({
  photo,
  onClose,
}: {
  photo: ProfilePhoto;
  onClose: () => void;
}) {
  // Pinch-to-zoom state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Pan state
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Entrance scale
  const entryScale = useSharedValue(0.5);

  React.useEffect(() => {
    entryScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, { damping: 15 });
        savedScale.value = 1;
      } else if (scale.value > 4) {
        scale.value = withSpring(4, { damping: 15 });
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      // Reset if close to origin while not zoomed
      if (savedScale.value <= 1) {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1, { damping: 15 });
        savedScale.value = 1;
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2.5, { damping: 15 });
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value * entryScale.value },
    ],
  }));

  const imageSize = Math.min(SCREEN_W - 40, SCREEN_H * 0.6);

  return (
    <GestureHandlerRootView style={styles.fullscreen}>
      {/* Backdrop */}
      <Animated.View
        style={styles.backdrop}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      />

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Photo or fallback */}
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          {photo.source ? (
            <Image
              source={photo.source}
              style={[
                styles.image,
                { width: imageSize, height: imageSize },
              ]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.fallbackContainer,
                { width: imageSize, height: imageSize },
              ]}
            >
              <Text style={styles.fallbackText}>
                {photo.fallback ?? photo.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      {/* Name label */}
      <Animated.View
        style={styles.nameContainer}
        entering={FadeIn.delay(100).duration(200)}
      >
        <Text style={styles.nameText}>{photo.name}</Text>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 20,
  },
  fallbackContainer: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  fallbackText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#fff',
  },
  nameContainer: {
    position: 'absolute',
    bottom: 60,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});
