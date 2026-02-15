import {
  MicrophoneIcon,
  StopIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';
import { Waveform, generatePlaceholderWaveform } from './Waveform';
import { useVoiceRecorder } from './useVoiceRecorder';

interface VoiceMessageRecorderProps {
  onComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
  onCancel?: () => void;
  maxDuration?: number;
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Voice message recorder with live waveform visualization and preview. */
export function VoiceMessageRecorder({
  onComplete,
  onCancel,
  maxDuration = 300,
  className = '',
}: VoiceMessageRecorderProps) {
  const {
    state,
    duration,
    waveformData,
    error,
    startRecording,
    stopRecording,
    handleCancel,
    handleSend,
  } = useVoiceRecorder({ maxDuration, onComplete, onCancel });

  const placeholder = generatePlaceholderWaveform(50);

  if (state === 'idle') {
    return (
      <div className={className}>
        <button
          onClick={startRecording}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Record voice message"
        >
          <MicrophoneIcon className="h-5 w-5" />
          <span className="text-sm">Voice message</span>
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // Recording state - show live waveform
  if (state === 'recording') {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20 ${className}`}
      >
        <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />

        <div className="min-w-0 flex-1">
          <Waveform
            data={waveformData.length > 0 ? waveformData : placeholder}
            progress={1}
            playedColor="#ef4444"
            unplayedColor="#fca5a5"
            height={32}
          />
          <div className="mt-1 text-sm text-red-600 dark:text-red-400">
            Recording: {formatTime(duration)} / {formatTime(maxDuration)}
          </div>
        </div>

        <button
          onClick={stopRecording}
          className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
          aria-label="Stop recording"
        >
          <StopIcon className="h-4 w-4" />
        </button>

        <button
          onClick={handleCancel}
          className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Cancel recording"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Preview state - show recorded audio
  if (state === 'preview') {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${className}`}
      >
        <Waveform
          data={waveformData.length > 0 ? waveformData : placeholder}
          progress={0}
          height={32}
        />

        <span className="text-sm text-gray-600 dark:text-gray-400">{formatTime(duration)}</span>

        <button
          onClick={handleCancel}
          className="p-2 text-gray-500 transition-colors hover:text-red-500"
          aria-label="Delete recording"
        >
          <TrashIcon className="h-5 w-5" />
        </button>

        <button
          onClick={handleSend}
          className="rounded-full bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
          aria-label="Send voice message"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Uploading state
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${className}`}
    >
      <ArrowPathIcon className="h-5 w-5 animate-spin" />
      <span className="text-sm text-gray-600 dark:text-gray-400">Sending...</span>
    </div>
  );
}
