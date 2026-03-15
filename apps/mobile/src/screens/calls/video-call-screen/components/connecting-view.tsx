import React from 'react';
import { View, Text, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedAvatar from '@/components/ui/animated-avatar';
import { Colors } from '@/lib/design/design-system';
import { styles } from '../styles';
import type { CallState } from '../types';

interface Props {
  callState: CallState;
  recipientName: string;
  recipientAvatar?: string;
  fadeAnim: Animated.Value;
  onAnswer: () => void;
  onDecline: () => void;
}

/** Description. */
/** Connecting View component. */
export function ConnectingView({
  callState,
  recipientName,
  recipientAvatar,
  fadeAnim,
  onAnswer,
  onDecline,
}: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.dark[950], Colors.dark[900]]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.connectingContent, { opacity: fadeAnim }]}>
          <AnimatedAvatar
            source={
              recipientAvatar
                ? { uri: recipientAvatar }
                :  
                  require('@/assets/default-avatar.png')
            }
            size={140}
            borderAnimation="pulse"
            shape="circle"
            particleEffect="sparkles"
          />
          <Text style={styles.connectingName}>{recipientName}</Text>
          <Text style={styles.connectingStatus}>
            {callState === 'connecting' ? 'Connecting video...' : 'Incoming video call...'}
          </Text>
          {callState === 'ringing' && (
            <View style={styles.incomingControls}>
              <TouchableOpacity
                style={[styles.callButton, styles.declineButton]}
                onPress={onDecline}
              >
                <LinearGradient
                  colors={[Colors.red[500], Colors.red[600]]}
                  style={styles.callButtonGradient}
                >
                  <Ionicons name="close" size={36} color="white" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.callButton, styles.answerButton]} onPress={onAnswer}>
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[600]]}
                  style={styles.callButtonGradient}
                >
                  <Ionicons name="videocam" size={32} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
