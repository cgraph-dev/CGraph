/**
 * VideoCallScreen - Revolutionary Video Call Interface
 * Features: Full-screen video with PiP, animated controls, connection quality,
 * screen layout toggle, camera switch, gesture controls
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import AnimatedAvatar from '@/components/ui/animated-avatar';
import { Colors } from '@/lib/design/design-system';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { styles } from './video-call-screen/styles';
import { useVideoCall } from './video-call-screen/use-video-call';
import { ConnectingView } from './video-call-screen/components/connecting-view';
import { CallControls } from './video-call-screen/components/call-controls';

/**
 * Video Call Screen component.
 *
 */
export default function VideoCallScreen() {
  const vc = useVideoCall();

  // Connecting/ringing state
  if (vc.callState === 'connecting' || vc.callState === 'ringing') {
    return (
      <ConnectingView
        callState={vc.callState}
        recipientName={vc.recipientName}
        recipientAvatar={vc.recipientAvatar}
        fadeAnim={vc.fadeAnim}
        onAnswer={vc.handleAnswer}
        onDecline={vc.handleDecline}
      />
    );
  }

  return (
    <TouchableWithoutFeedback onPress={vc.showControls}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" hidden={!vc.controlsVisible} />

        {/* Remote video placeholder */}
        <View style={styles.remoteVideo}>
          <LinearGradient
            colors={[Colors.dark[800], Colors.dark[900]]}
            style={StyleSheet.absoluteFill}
          />
          <AnimatedAvatar
            source={
              vc.recipientAvatar
                ? { uri: vc.recipientAvatar }
                : // eslint-disable-next-line @typescript-eslint/no-require-imports
                  require('@/assets/default-avatar.png')
            }
            size={100}
            borderAnimation="glow"
            shape="circle"
          />
          <Text style={styles.noVideoText}>{vc.recipientName}</Text>
          <Text style={styles.noVideoSubtext}>Video paused</Text>
        </View>

        {/* Local video PiP */}
        <Animated.View
          {...vc.pipPanResponder.panHandlers}
          style={[
            styles.pip,
            {
              transform: [
                { translateX: vc.pipAnimX },
                { translateY: vc.pipAnimY },
                { scale: vc.pipScale },
                { rotateY: vc.cameraFlipRotate },
                { scaleX: vc.cameraFlipScale },
              ],
            },
          ]}
        >
          <LinearGradient colors={[Colors.dark[700], Colors.dark[800]]} style={styles.pipContent}>
            {vc.isVideoOff ? (
              <View style={styles.pipVideoOff}>
                <Ionicons name="videocam-off" size={24} color={Colors.dark[400]} />
              </View>
            ) : (
              <>
                <View style={styles.pipPlaceholder}>
                  <Ionicons name="person" size={40} color={Colors.dark[500]} />
                </View>
                <View style={styles.pipBadge}>
                  <Text style={styles.pipBadgeText}>You</Text>
                </View>
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Controls overlay */}
        <Animated.View
          style={{ opacity: vc.controlsOpacity, ...StyleSheet.absoluteFillObject }}
          pointerEvents={vc.controlsVisible ? 'auto' : 'none'}
        >
          <CallControls
            callDuration={vc.callDuration}
            isMuted={vc.isMuted}
            isVideoOff={vc.isVideoOff}
            isGroupCall={vc.isGroupCall}
            layoutMode={vc.layoutMode}
            onFlipCamera={vc.handleFlipCamera}
            onEndCall={vc.handleEndCall}
            onToggleMute={() => {
              HapticFeedback.medium();
              vc.setIsMuted(!vc.isMuted);
            }}
            onToggleVideo={() => {
              HapticFeedback.medium();
              vc.setIsVideoOff(!vc.isVideoOff);
            }}
            onToggleLayout={vc.toggleLayout}
            onGoBack={() => {
              HapticFeedback.light();
              vc.navigation.goBack();
            }}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
