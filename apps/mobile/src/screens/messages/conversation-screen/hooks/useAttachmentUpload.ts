/**
 * useAttachmentUpload Hook
 *
 * Manages file and image upload functionality for conversation attachments.
 * Handles image grids, file uploads, and video uploads with progress tracking.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { durations } from '@cgraph/animation-constants';
import { useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { withTiming, runOnJS, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import api from '../../../../lib/api';
import { normalizeMessage } from '../../../../lib/normalizers';
import { createLogger } from '../../../../lib/logger';
import { getMimeType } from '../utils';
import type { Message } from '../../../../types';

const logger = createLogger('useAttachmentUpload');

interface AttachmentItem {
  uri: string;
  type: 'image' | 'video' | 'file';
  name?: string;
  mimeType?: string;
  duration?: number;
}

interface UseAttachmentUploadOptions {
  conversationId: string;
  setIsSending: (sending: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  closeAttachmentPreview: () => void;
  attachmentPreviewAnim: SharedValue<number>;
  handleImagePicker: () => Promise<void>;
  onScrollToBottom: () => void;
}

export interface UseAttachmentUploadReturn {
  uploadAndSendFile: (
    uri: string,
    type: 'image' | 'file' | 'video',
    filename?: string,
    caption?: string,
    duration?: number
  ) => Promise<void>;
  sendPendingAttachments: (attachments: AttachmentItem[], caption: string) => Promise<void>;
  addMoreAttachments: () => void;
}

/**
 * Hook for managing attachment uploads in conversations.
 */
export function useAttachmentUpload({
  conversationId,
  setIsSending,
  setMessages,
  closeAttachmentPreview,
  attachmentPreviewAnim,
  handleImagePicker,
  onScrollToBottom,
}: UseAttachmentUploadOptions): UseAttachmentUploadReturn {
  // Track active upload for potential cancellation
  const uploadAbortRef = useRef<AbortController | null>(null);

  // Upload and send a single file as message
  const uploadAndSendFile = useCallback(
    async (
      uri: string,
      type: 'image' | 'file' | 'video',
      filename?: string,
      caption?: string,
      duration?: number
    ) => {
      setIsSending(true);

      try {
        const formData = new FormData();
        const defaultExt = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'bin';
        const name = filename || `${type}_${Date.now()}.${defaultExt}`;

        // Use helper for accurate MIME type detection
        const defaultMime =
          type === 'image'
            ? 'image/jpeg'
            : type === 'video'
              ? 'video/mp4'
              : 'application/octet-stream';
        const mimeType = getMimeType(name, defaultMime);

         
        formData.append('file', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name,
          type: mimeType,
        } as unknown);
        formData.append('context', 'message');

        logger.debug('Uploading file:', { name, type: mimeType, uri: uri.substring(0, 50) });

        const response = await api.post('/api/v1/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minute timeout for video uploads
        });

        logger.debug('Upload response:', JSON.stringify(response.data));

        // Extract URL from various response formats
        const fileUrl = response.data?.data?.url || response.data?.url || response.data?.file?.url;

        if (fileUrl) {
          // Send message with file attachment
          const messageContent =
            caption || (type === 'image' ? 'Photo' : type === 'video' ? 'Video' : `${name}`);
          const msgPayload: Record<string, unknown> = {
            content: messageContent,
            content_type: type,
            file_url: fileUrl,
            file_name: name,
            file_mime_type: mimeType,
          };

          // Add metadata for videos
          if (type === 'video') {
            msgPayload.metadata = {
              duration: duration || 0,
              mimeType: mimeType,
            };
          }

          const msgResponse = await api.post(
            `/api/v1/conversations/${conversationId}/messages`,
            msgPayload
          );

          const rawMessage = msgResponse.data.data || msgResponse.data.message || msgResponse.data;
          if (rawMessage?.id) {
            const normalized = normalizeMessage(rawMessage);
            // Prepend for inverted list (newest first)
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === normalized.id);
              if (exists) return prev;
              return [normalized, ...prev];
            });
            onScrollToBottom();
          }
        } else {
          logger.error('No file URL in response:', response.data);
          Alert.alert('Error', 'Upload failed - no file URL returned.');
        }
      } catch (error: unknown) {
         
        const err = error as {
          response?: { data?: { error?: { message?: string } } };
          message?: string;
        };
        logger.error('Error uploading file:', err?.response?.data || err?.message || error);
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to send file. Please try again.';
        Alert.alert('Upload Error', errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, setIsSending, setMessages, onScrollToBottom]
  );

  // Send all pending attachments
  const sendPendingAttachments = useCallback(
    async (attachments: AttachmentItem[], caption: string) => {
      if (attachments.length === 0) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const trimmedCaption = caption.trim();
      const attachmentsToSend = [...attachments];
      closeAttachmentPreview();
      setIsSending(true);

      try {
        // Separate images, videos, and files
        const images = attachmentsToSend.filter((a) => a.type === 'image');
        const videos = attachmentsToSend.filter((a) => a.type === 'video');
        const files = attachmentsToSend.filter((a) => a.type === 'file');

        // Upload all images and collect URLs for grid message
        if (images.length > 0) {
          const uploadedUrls: string[] = [];

          for (const image of images) {
            const formData = new FormData();
            const name = image.name || `photo_${Date.now()}.jpg`;
            const mimeType = getMimeType(name, image.mimeType || 'image/jpeg');

             
            formData.append('file', {
              uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
              name,
              type: mimeType,
            } as unknown);
            formData.append('context', 'message');

            const response = await api.post('/api/v1/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 60000,
            });

            const fileUrl =
              response.data?.data?.url || response.data?.url || response.data?.file?.url;
            if (fileUrl) {
              uploadedUrls.push(fileUrl);
            }
          }

          // Send all images as a single message with grid metadata
          if (uploadedUrls.length > 0) {
            const msgPayload = {
              content:
                trimmedCaption ||
                `${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`,
              content_type: 'image',
              file_url: uploadedUrls[0],
              link_preview:
                uploadedUrls.length > 1
                  ? {
                      grid_images: uploadedUrls,
                      image_count: uploadedUrls.length,
                    }
                  : undefined,
            };
            logger.debug('Sending message:', JSON.stringify(msgPayload));
            const msgResponse = await api.post(
              `/api/v1/conversations/${conversationId}/messages`,
              msgPayload
            );

            const rawMessage =
              msgResponse.data.data || msgResponse.data.message || msgResponse.data;
            if (__DEV__) {
              logger.debug('Server response metadata:', JSON.stringify(rawMessage?.metadata));
              logger.debug('Message ID:', rawMessage?.id);
            }
            if (rawMessage?.id) {
              onScrollToBottom();
            }
          }
        }

        // Send files individually
        for (const file of files) {
          await uploadAndSendFile(
            file.uri,
            file.type,
            file.name,
            files.indexOf(file) === 0 ? trimmedCaption : undefined
          );
        }

        // Send videos individually
        for (const video of videos) {
          await uploadAndSendFile(
            video.uri,
            'video',
            video.name,
            videos.indexOf(video) === 0 && !files.length ? trimmedCaption : undefined,
            video.duration
          );
        }
      } catch (error: unknown) {
         
        const err = error as { response?: { data?: { error?: string } } };
        logger.error('Error sending attachments:', error);
        logger.error('Error response:', err?.response?.data);
        Alert.alert(
          'Error',
          err?.response?.data?.error || 'Failed to send attachments. Please try again.'
        );
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, setIsSending, closeAttachmentPreview, uploadAndSendFile, onScrollToBottom]
  );

  // Add more attachments to pending list
  const addMoreAttachments = useCallback(() => {
    const afterAnim = async () => {
      closeAttachmentPreview();
      await handleImagePicker();
    };
    attachmentPreviewAnim.value = withTiming(0, { duration: durations.fast.ms }, (finished) => {
      if (finished) runOnJS(afterAnim)();
    });
  }, [attachmentPreviewAnim, closeAttachmentPreview, handleImagePicker]);

  return {
    uploadAndSendFile,
    sendPendingAttachments,
    addMoreAttachments,
  };
}

export default useAttachmentUpload;
