import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import GlassCard from '../ui/glass-card';
import type { LinkMetadata } from './rich-media-embed.types';

// ============================================================================
// Audio Embed Component
// ============================================================================

interface AudioEmbedProps {
  embed: LinkMetadata;
}

const AudioEmbed = memo(function AudioEmbed({ embed }: AudioEmbedProps): React.ReactElement | null {
  const audioUrl = embed.audioUrl || embed.url;
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const [isLoading, setIsLoading] = useState(false);

  // Configure audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  const handlePlayPause = useCallback(() => {
    try {
      if (isLoading) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, [isLoading, status.playing, player]);

  // Handle loading state
  useEffect(() => {
    if (status.playing || status.currentTime > 0) {
      setIsLoading(false);
    }
  }, [status.playing, status.currentTime]);

  return (
    <GlassCard variant="frosted" intensity="medium" style={styles.audioCard}>
      <View style={styles.audioContainer}>
        <TouchableOpacity style={styles.audioButton} onPress={handlePlayPause} disabled={isLoading}>
          <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.audioButtonGradient}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle} numberOfLines={1}>
            {embed.title || 'Audio File'}
          </Text>
          <Text style={styles.audioSubtitle}>
            {status.playing ? 'Playing...' : status.currentTime > 0 ? 'Paused' : 'Tap to play'}
          </Text>
        </View>

        <Ionicons name="musical-notes-outline" size={24} color="rgba(255,255,255,0.5)" />
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  audioCard: {
    padding: 12,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  audioButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  audioSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default AudioEmbed;
