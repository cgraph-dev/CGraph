/**
 * Custom hook for voice message recording and playback.
 * @module components/voice-message-recorder/use-voice-recorder
 */
import { durations } from '@cgraph/animation-constants';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import {
  useAudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../../lib/logger';
import type { VoiceMessageRecorderProps, RecordingState } from './types';

const logger = createLogger('VoiceRecorder');

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function useVoiceRecorder({
  onComplete,
  onCancel,
  maxDuration = 300,
}: VoiceMessageRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_playbackPosition, setPlaybackPosition] = useState(0);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const previewPlayer = useAudioPlayer(recordingUri || undefined);
  const previewStatus = useAudioPlayerStatus(previewPlayer);
  const isPlaying = previewStatus?.playing || false;
  const playbackFinished =
    previewStatus &&
    !previewStatus.playing &&
    previewStatus.currentTime > 0 &&
    previewStatus.duration > 0 &&
    previewStatus.currentTime >= previewStatus.duration - 0.1;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useSharedValue(1);

  const waveformBarHeights = useRef<number[]>(
    Array.from({ length: 30 }, () => 0.1)
  ).current;
  const [_waveformTick, setWaveformTick] = useState(0);
  const currentMeteringRef = useRef(0);
  const isRecordingRef = useRef(false);
  const meteringRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    isRecordingRef.current = recorderState.isRecording;
    meteringRef.current = recorderState.metering;
  }, [recorderState.isRecording, recorderState.metering]);

  useEffect(() => {
    (async () => {
      const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();
      if (!permissionStatus.granted) {
        setError('Microphone permission is required to record voice messages');
      }
    })();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (state === 'recording') {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: durations.slower.ms }),
          withTiming(1, { duration: durations.slower.ms })
        ),
        -1,
        false
      );
      return () => {
        pulseAnim.value = 1;
      };
    } else {
      pulseAnim.value = 1;
    }
  }, [state, pulseAnim]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const cleanup = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setState('recording');
      setDuration(0);
      setWaveformData([]);
      waveformBarHeights.fill(0.1);
      setWaveformTick(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      let barIndex = 0;
      let lastMeteringValue = 0.3;
      meteringIntervalRef.current = setInterval(() => {
        const hasRealMetering =
          meteringRef.current !== undefined && meteringRef.current !== null;
        let normalizedLevel: number;
        if (hasRealMetering && isRecordingRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          normalizedLevel = Math.max(0.15, Math.min(1, (meteringRef.current! + 60) / 60));
          lastMeteringValue = normalizedLevel;
        } else {
          const targetLevel = 0.2 + Math.random() * 0.6;
          normalizedLevel = lastMeteringValue + (targetLevel - lastMeteringValue) * 0.3;
          normalizedLevel = Math.max(0.15, Math.min(0.85, normalizedLevel));
          lastMeteringValue = normalizedLevel;
        }
        currentMeteringRef.current = normalizedLevel;
        setWaveformData((prev) => [...prev, normalizedLevel].slice(-50));
        waveformBarHeights[barIndex % 30] = normalizedLevel;
        barIndex++;
        const nearbyIndex = (barIndex + 1) % 30;
        const variation = normalizedLevel * (0.5 + Math.random() * 0.5);
        waveformBarHeights[nearbyIndex] = variation;
        setWaveformTick((t) => t + 1);
      }, 80);
    } catch (err) {
      logger.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      cleanup();
    }
  }, [maxDuration, cleanup, audioRecorder, recorderState]);

  const stopRecording = useCallback(async () => {
    if (state !== 'recording') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      }
      const uri = audioRecorder.uri;
      if (uri) {
        setRecordingUri(uri);
        setState('preview');
      }
    } catch (err) {
      logger.error('Failed to stop recording:', err);
      setError('Failed to save recording. Please try again.');
    }
  }, [audioRecorder, recorderState.isRecording, state]);

  const handleCancel = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cleanup();
    setRecordingUri(null);
    setWaveformData([]);
    setDuration(0);
    setPlaybackPosition(0);
    setState('idle');
    onCancel?.();
  }, [cleanup, onCancel]);

  const handlePlayPause = useCallback(async () => {
    if (!recordingUri) return;
    await Haptics.selectionAsync();
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (isPlaying) {
        previewPlayer.pause();
      } else {
        if (playbackFinished) {
          previewPlayer.seekTo(0);
          setTimeout(() => {
            previewPlayer.play();
          }, 50);
        } else {
          previewPlayer.play();
        }
      }
    } catch (err) {
      logger.error('Failed to play recording:', err);
    }
  }, [recordingUri, isPlaying, previewPlayer, playbackFinished]);

  useEffect(() => {
    if (previewStatus) {
      setPlaybackPosition(previewStatus.currentTime || 0);
    }
  }, [previewStatus]);

  const handleSend = useCallback(async () => {
    if (!recordingUri) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setState('uploading');
    onComplete({ uri: recordingUri, duration, waveform: waveformData });
  }, [recordingUri, duration, waveformData, onComplete]);

  return {
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
  };
}
