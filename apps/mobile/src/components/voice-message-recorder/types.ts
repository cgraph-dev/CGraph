/**
 * Types for voice message recorder component.
 * @module components/voice-message-recorder/types
 */

export interface VoiceMessageRecorderProps {
  /** Callback when recording is complete and ready to send */
  onComplete: (data: { uri: string; duration: number; waveform: number[] }) => void;
  /** Callback when recording is cancelled */
  onCancel?: () => void;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
}

export type RecordingState = 'idle' | 'recording' | 'preview' | 'uploading';
