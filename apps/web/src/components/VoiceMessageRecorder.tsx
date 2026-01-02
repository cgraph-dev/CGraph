import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { Waveform, generatePlaceholderWaveform } from './Waveform';
import { api } from '@/lib/api';

interface VoiceMessageRecorderProps {
  /** Callback when recording is complete and ready to send */
  onComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
  /** Callback when recording is cancelled */
  onCancel?: () => void;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  /** Additional CSS classes */
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'preview' | 'uploading';

/**
 * Voice message recorder component.
 * 
 * Features:
 * - Microphone recording with visual feedback
 * - Live waveform visualization during recording
 * - Preview before sending
 * - Automatic stop at max duration
 * - Cancel/delete functionality
 */
export function VoiceMessageRecorder({
  onComplete,
  onCancel,
  maxDuration = 300,
  className = '',
}: VoiceMessageRecorderProps) {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

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
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });

      streamRef.current = stream;

      // Set up audio analysis for live waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setState('preview');
      };

      // Start recording
      mediaRecorder.start(100);
      setState('recording');
      setDuration(0);
      setWaveformData([]);

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      // Start waveform visualization
      visualizeWaveform();

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied. Please allow microphone access.');
      cleanup();
    }
  }, [maxDuration, cleanup]);

  const visualizeWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average amplitude
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / bufferLength / 255;

      setWaveformData(prev => [...prev, average].slice(-100));

      animationRef.current = requestAnimationFrame(update);
    };

    update();
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

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

    onComplete({
      blob: audioBlob,
      duration,
      waveform: waveformData.length > 0 ? waveformData : generatePlaceholderWaveform(50),
    });

    // Reset state
    setAudioBlob(null);
    setWaveformData([]);
    setDuration(0);
    setState('idle');
  }, [audioBlob, duration, waveformData, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Idle state - show mic button
  if (state === 'idle') {
    return (
      <div className={className}>
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Record voice message"
        >
          <Mic size={20} />
          <span className="text-sm">Voice message</span>
        </button>
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </div>
    );
  }

  // Recording state - show live waveform
  if (state === 'recording') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        
        <div className="flex-1 min-w-0">
          <Waveform
            data={waveformData.length > 0 ? waveformData : generatePlaceholderWaveform(50)}
            progress={1}
            playedColor="#ef4444"
            unplayedColor="#fca5a5"
            height={32}
          />
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
            Recording: {formatTime(duration)} / {formatTime(maxDuration)}
          </div>
        </div>

        <button
          onClick={stopRecording}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          aria-label="Stop recording"
        >
          <Square size={16} />
        </button>

        <button
          onClick={handleCancel}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Cancel recording"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  // Preview state - show recorded audio
  if (state === 'preview') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <Waveform
          data={waveformData.length > 0 ? waveformData : generatePlaceholderWaveform(50)}
          progress={0}
          height={32}
        />
        
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatTime(duration)}
        </span>

        <button
          onClick={handleCancel}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
          aria-label="Delete recording"
        >
          <Trash2 size={18} />
        </button>

        <button
          onClick={handleSend}
          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
          aria-label="Send voice message"
        >
          <Send size={16} />
        </button>
      </div>
    );
  }

  // Uploading state
  return (
    <div className={`flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm text-gray-600 dark:text-gray-400">Sending...</span>
    </div>
  );
}
