/**
 * Voice message recording component with waveform visualization, timer, and audio level metering.
 * @module components/VoiceMessageRecorder
 */
import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import ReanimatedAnimated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import type { VoiceMessageRecorderProps } from './types';
import { styles } from './styles';
import { useVoiceRecorder, formatDuration } from './use-voice-recorder';
import { WaveformDisplay } from './waveform-display';

export type { VoiceMessageRecorderProps, RecordingState } from './types';

/**
 * Voice message recorder component for React Native.
 *
 * Features:
 * - Microphone recording with visual feedback
 * - Live waveform visualization during recording
 * - Preview before sending with playback
 * - Automatic stop at max duration
 * - Cancel/delete functionality
 * - Haptic feedback for interactions
 */
export function VoiceMessageRecorder(props: VoiceMessageRecorderProps) {
  const { colors } = useThemeStore();
  const {
    state,
    duration,
    waveformData,
    error,
    isPlaying,
    waveformBarHeights,
    pulseAnimatedStyle,
    previewStatus,
    maxDuration,
    startRecording,
    stopRecording,
    handleCancel,
    handlePlayPause,
    handleSend,
  } = useVoiceRecorder(props);

  if (error) {
    return (
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  if (state === 'idle') {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: colors.primary }]}
          onPress={startRecording}
        >
          <Ionicons name="mic" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Tap to Record</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissButton} onPress={handleCancel}>
          <Text style={[styles.dismissText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const waveformProps = {
    waveformBarHeights,
    waveformData,
    previewStatus,
    errorColor: colors.error,
    primaryColor: colors.primary,
    textSecondaryColor: colors.textSecondary,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {state === 'recording' && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingHeader}>
            <ReanimatedAnimated.View
              style={[
                styles.recordingIndicator,
                { backgroundColor: colors.error },
                pulseAnimatedStyle,
              ]}
            />
            <Text style={[styles.recordingTime, { color: colors.text }]}>
              {formatDuration(duration)}
            </Text>
            <Text style={[styles.maxDurationText, { color: colors.textSecondary }]}>
              / {formatDuration(maxDuration)}
            </Text>
          </View>
          <WaveformDisplay state={state} {...waveformProps} />
          <View style={styles.recordingActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background }]}
              onPress={handleCancel}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: colors.error }]}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={32} color="#fff" />
            </TouchableOpacity>
            <View style={styles.actionButtonPlaceholder} />
          </View>
        </View>
      )}

      {state === 'preview' && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>Voice Message</Text>
            <Text style={[styles.previewDuration, { color: colors.textSecondary }]}>
              {formatDuration(duration)}
            </Text>
          </View>
          <WaveformDisplay state={state} {...waveformProps} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background }]}
              onPress={handleCancel}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={handlePlayPause}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: '#22c55e' }]}
              onPress={handleSend}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === 'uploading' && (
        <View style={styles.uploadingContainer}>
          <Ionicons name="cloud-upload" size={32} color={colors.primary} />
          <Text style={[styles.uploadingText, { color: colors.text }]}>Sending...</Text>
        </View>
      )}
    </View>
  );
}

export default VoiceMessageRecorder;
