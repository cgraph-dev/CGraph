/**
 * useVoiceRecorder — encapsulates all recording logic.
 *
 * Returns state, controls, and data needed by the VoiceMessageRecorder UI.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { generatePlaceholderWaveform } from './waveform';

const logger = createLogger('useVoiceRecorder');

type RecordingState = 'idle' | 'recording' | 'preview' | 'uploading';

interface UseVoiceRecorderOptions {
  maxDuration?: number;
  onComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
  onCancel?: () => void;
}

export function useVoiceRecorder({
  maxDuration = 300,
  onComplete,
  onCancel,
}: UseVoiceRecorderOptions) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const visualizeWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / bufferLength / 255;
      setWaveformData((prev) => [...prev, average].slice(-100));
      animationRef.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setState('preview');
      };

      mediaRecorder.start(100);
      setState('recording');
      setDuration(0);
      setWaveformData([]);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
        if (elapsed >= maxDuration) stopRecording();
      }, 1000);

      visualizeWaveform();
    } catch (err) {
      logger.error('Failed to start recording:', err);
      setError('Microphone access denied. Please allow microphone access.');
      cleanup();
    }
  }, [maxDuration, cleanup, stopRecording, visualizeWaveform]);

  const handleCancel = useCallback(() => {
    cleanup();
    setAudioBlob(null);
    setWaveformData([]);
    setDuration(0);
    setState('idle');
    onCancel?.();
  }, [cleanup, onCancel]);

  const handleSend = useCallback(() => {
    if (!audioBlob) return;
    setState('uploading');
    const finalWaveform =
      waveformData.length > 0 ? waveformData : generatePlaceholderWaveform(duration);
    onComplete({ blob: audioBlob, duration, waveform: finalWaveform });
    cleanup();
    setAudioBlob(null);
    setWaveformData([]);
    setDuration(0);
    setState('idle');
  }, [audioBlob, duration, waveformData, onComplete, cleanup]);

  return {
    state,
    duration,
    waveformData,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    handleCancel,
    handleSend,
  };
}
