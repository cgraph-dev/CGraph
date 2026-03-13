import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/ui/glass-card';
import { Colors } from '@/lib/design/design-system';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { styles } from '../styles';
import type { LayoutMode } from '../types';

interface Props {
  isMuted: boolean;
  isVideoOff: boolean;
  isGroupCall?: boolean;
  layoutMode: LayoutMode;
  callDuration: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleLayout: () => void;
  onFlipCamera: () => void;
  onEndCall: () => void;
  onGoBack: () => void;
}

/** Description. */
/** Call Controls component. */
export function CallControls({
  isMuted,
  isVideoOff,
  isGroupCall,
  layoutMode,
  callDuration,
  onToggleMute,
  onToggleVideo,
  onToggleLayout,
  onFlipCamera,
  onEndCall,
  onGoBack,
}: Props) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <SafeAreaView edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              HapticFeedback.light();
              onGoBack();
            }}
          >
            <Ionicons name="chevron-down" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
            <View style={styles.encryptedBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.primary[500]} />
              <Text style={styles.encryptedText}>Encrypted</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.topButton} onPress={onFlipCamera}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']}>
        <GlassCard variant="frosted" intensity="strong" style={styles.bottomControls}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={onToggleMute}
            >
              <View
                style={[
                  styles.controlIconBg,
                  isMuted && { backgroundColor: Colors.semantic.error },
                ]}
              >
                <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="white" />
              </View>
              <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={onToggleVideo}
            >
              <View
                style={[
                  styles.controlIconBg,
                  isVideoOff && { backgroundColor: Colors.semantic.error },
                ]}
              >
                <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={24} color="white" />
              </View>
              <Text style={styles.controlText}>{isVideoOff ? 'Start' : 'Stop'}</Text>
            </TouchableOpacity>

            {isGroupCall && (
              <TouchableOpacity style={styles.controlButton} onPress={onToggleLayout}>
                <View style={styles.controlIconBg}>
                  <Ionicons
                    name={layoutMode === 'grid' ? 'grid' : 'expand'}
                    size={24}
                    color="white"
                  />
                </View>
                <Text style={styles.controlText}>
                  {layoutMode === 'grid' ? 'Grid' : 'Spotlight'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.controlButton} onPress={() => HapticFeedback.light()}>
              <View style={styles.controlIconBg}>
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
              <Text style={styles.controlText}>Effects</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={onEndCall}>
              <LinearGradient
                colors={[Colors.red[500], Colors.red[600]]}
                style={styles.endCallButton}
              >
                <Ionicons
                  name="call"
                  size={24}
                  color="white"
                  style={{ transform: [{ rotate: '135deg' }] }}
                />
              </LinearGradient>
              <Text style={[styles.controlText, { color: Colors.red[400] }]}>End</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </SafeAreaView>
    </>
  );
}
