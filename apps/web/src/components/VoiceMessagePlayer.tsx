import { useState, useRef, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { Waveform, generatePlaceholderWaveform } from './Waveform';
import { api } from '@/lib/api';

interface VoiceMessagePlayerProps {
  /** Voice message ID */
  messageId: string;
  /** Audio source URL */
  audioUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Preloaded waveform data (optional) */
  waveformData?: number[];
  /** Show download button */
  showDownload?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Audio player component for voice messages.
 * 
 * Features:
 * - Play/pause controls
 * - Waveform visualization with progress
 * - Click-to-seek on waveform
 * - Duration display
 * - Optional download button
 */
export function VoiceMessagePlayer({
  messageId,
  audioUrl,
  duration,
  waveformData,
  showDownload = false,
  className = '',
}: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(
    waveformData || generatePlaceholderWaveform(50)
  );
  const [isLoading, setIsLoading] = useState(!waveformData);

  // Fetch waveform data if not provided
  useEffect(() => {
    if (waveformData) return;

    let cancelled = false;

    const fetchWaveform = async () => {
      try {
        const response = await api.get(`/api/v1/voice-messages/${messageId}/waveform`);
        if (!cancelled && response.data?.waveform) {
          setWaveform(response.data.waveform);
        }
      } catch (error) {
        console.warn('Failed to fetch waveform:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchWaveform();
    return () => { cancelled = true; };
  }, [messageId, waveformData]);

  // Update progress during playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const newProgress = audio.duration ? audio.currentTime / audio.duration : 0;
      setProgress(newProgress);
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((newProgress: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    audio.currentTime = newProgress * audio.duration;
    setProgress(newProgress);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `voice-message-${messageId}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [audioUrl, messageId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayback}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <PauseIcon className="h-5 w-5" />
        ) : (
          <PlayIcon className="h-5 w-5 ml-0.5" />
        )}
      </button>

      {/* Waveform and Time */}
      <div className="flex-1 min-w-0">
        <Waveform
          data={waveform}
          progress={progress}
          onSeek={handleSeek}
          height={32}
          barWidth={2}
          barGap={1}
          className={isLoading ? 'opacity-50' : ''}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Download Button */}
      {showDownload && (
        <button
          onClick={handleDownload}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Download voice message"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
