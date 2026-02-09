/**
 * useCallRecording - Hook for recording voice/video calls
 * Uses MediaRecorder API to capture call streams
 */

import { useState, useRef, useCallback } from 'react';
import { toast } from '@/shared/components/ui';

interface UseCallRecordingOptions {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  roomId: string | null;
}

interface UseCallRecordingReturn {
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  downloadRecording: () => void;
}

export function useCallRecording({
  localStream,
  remoteStreams,
  roomId,
}: UseCallRecordingOptions): UseCallRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const recordingBlobRef = useRef<Blob | null>(null);

  const startRecording = useCallback(() => {
    if (!localStream) {
      toast.error('No active call to record');
      return;
    }

    try {
      // Combine all audio streams into one
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add local audio
      const localSource = audioContext.createMediaStreamSource(localStream);
      localSource.connect(destination);

      // Add remote audio streams
      remoteStreams.forEach((stream) => {
        const remoteSource = audioContext.createMediaStreamSource(stream);
        remoteSource.connect(destination);
      });

      // Add video track from local stream if available
      const combinedTracks = [...destination.stream.getTracks()];
      const localVideoTracks = localStream.getVideoTracks();
      if (localVideoTracks.length > 0 && localVideoTracks[0] !== undefined) {
        combinedTracks.push(localVideoTracks[0]);
      }

      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'audio/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        recordingBlobRef.current = blob;
      };

      recorder.start(1000); // Collect data every second
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      // Duration counter
      durationRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Notify participants
      toast.info('Recording started — all participants are notified');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  }, [localStream, remoteStreams]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current) return null;

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = () => {
        const mimeType = recorder.mimeType;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        recordingBlobRef.current = blob;
        setIsRecording(false);

        if (durationRef.current) {
          clearInterval(durationRef.current);
        }

        toast.success('Recording saved');
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const downloadRecording = useCallback(() => {
    const blob = recordingBlobRef.current;
    if (!blob) {
      toast.error('No recording available');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = blob.type.includes('video') ? 'webm' : 'webm';
    a.download = `call-recording-${roomId || 'unknown'}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [roomId]);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    downloadRecording,
  };
}
