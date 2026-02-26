/**
 * useAttachmentUploader Hook
 * Encapsulates file validation, upload progress, drag-and-drop, and delete logic
 */

import { useState, useCallback, useRef } from 'react';
import { useForumStore, type PostAttachment } from '@/modules/forums/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AttachmentUploader');

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
];

interface UseAttachmentUploaderOptions {
  postId?: string;
  attachmentsCount: number;
  maxSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  onUpload?: (attachment: PostAttachment) => void;
  onDelete?: (attachmentId: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing attachment uploader.
 */
export function useAttachmentUploader({
  postId,
  attachmentsCount,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  onUpload,
  onDelete,
}: UseAttachmentUploaderOptions) {
  const { uploadAttachment, deleteAttachment } = useForumStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `${file.name}: File too large (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`;
    }
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: File type not allowed`;
    }
    if (attachmentsCount >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    return null;
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
        continue;
      }

      const fileId = `${Date.now()}-${file.name}`;
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

      try {
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[fileId] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [fileId]: current + 10 };
          });
        }, 200);

        const attachment = await uploadAttachment(file, postId);

        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

        setTimeout(() => {
          setUploadProgress((prev) => {
            const { [fileId]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);

        onUpload?.(attachment);
        HapticFeedback.success();
      } catch (err) {
        logger.error('Upload failed:', err);
        newErrors.push(`${file.name}: Upload failed`);
        HapticFeedback.error();
        setUploadProgress((prev) => {
          const { [fileId]: _, ...rest } = prev;
          return rest;
        });
      }
    }

    setErrors(newErrors);
    if (newErrors.length > 0) {
      setTimeout(() => setErrors([]), 5000);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [attachmentsCount]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      onDelete?.(attachmentId);
      HapticFeedback.medium();
    } catch (err) {
      logger.error('Delete failed:', err);
      HapticFeedback.error();
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return {
    isDragging,
    uploadProgress,
    errors,
    fileInputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
    handleDelete,
    openFilePicker,
    allowedTypes,
    maxSize,
    maxFiles,
  };
}
