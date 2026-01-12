/**
 * AttachmentUploader Component
 * Drag & drop file upload with thumbnails and progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useForumStore, type PostAttachment } from '@/stores/forumStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import GlassCard from '@/components/ui/GlassCard';

interface AttachmentUploaderProps {
  postId?: string;
  attachments?: PostAttachment[];
  onUpload?: (attachment: PostAttachment) => void;
  onDelete?: (attachmentId: string) => void;
  maxSize?: number; // bytes (default 10MB)
  maxFiles?: number; // default 5
  allowedTypes?: string[]; // MIME types
  className?: string;
}

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

export default function AttachmentUploader({
  postId,
  attachments = [],
  onUpload,
  onDelete,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  className = '',
}: AttachmentUploaderProps) {
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
    if (attachments.length >= maxFiles) {
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
        // Simulate upload progress
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
      } catch (error) {
        console.error('Upload failed:', error);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [attachments.length]);

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
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      onDelete?.(attachmentId);
      HapticFeedback.medium();
    } catch (error) {
      console.error('Delete failed:', error);
      HapticFeedback.error();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  return (
    <div className={className}>
      {/* Drop Zone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed
          transition-all duration-200 p-8
          ${
            isDragging
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-dark-600 bg-dark-800/50 hover:border-primary-500/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <CloudArrowUpIcon className={`h-12 w-12 ${isDragging ? 'text-primary-400' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-semibold text-white">
              {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files, up to {(maxSize / 1024 / 1024).toFixed(0)}MB each
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 space-y-1"
          >
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-red-400 flex items-center gap-2">
                <XMarkIcon className="h-4 w-4" />
                {error}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      <AnimatePresence>
        {Object.entries(uploadProgress).map(([fileId, progress]) => (
          <motion.div
            key={fileId}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3"
          >
            <GlassCard className="p-3" variant="frosted">
              <div className="flex items-center gap-3">
                <DocumentIcon className="h-5 w-5 text-primary-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">Uploading...</span>
                    <span className="text-sm text-primary-400">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-400">
            Attachments ({attachments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {attachments.map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <GlassCard className="p-3 group" variant="frosted">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail or Icon */}
                      {isImage(attachment.fileType) && attachment.thumbnailUrl ? (
                        <img
                          src={attachment.thumbnailUrl}
                          alt={attachment.originalFilename}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-dark-700 flex items-center justify-center">
                          {isImage(attachment.fileType) ? (
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          ) : (
                            <DocumentIcon className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {attachment.originalFilename}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(attachment.fileSize)}
                          {attachment.downloads > 0 && (
                            <span className="ml-2">
                              • {attachment.downloads} download{attachment.downloads !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <motion.a
                          href={attachment.downloadUrl}
                          download={attachment.originalFilename}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-lg bg-dark-700/50 hover:bg-primary-500/20 transition-colors"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 text-gray-400 hover:text-primary-400" />
                        </motion.a>
                        <motion.button
                          onClick={() => handleDelete(attachment.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-lg bg-dark-700/50 hover:bg-red-500/20 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-red-400" />
                        </motion.button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
