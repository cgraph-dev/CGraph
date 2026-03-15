/**
 * File attachment message component.
 * @module
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { formatBytes } from '@/lib/utils';
import type { Message } from '@/modules/chat/store';

interface FileMessageProps {
  message: Message;
  isOwnMessage: boolean;
  className?: string;
}

/**
 * FileMessage Component
 *
 * Displays file attachments in messages with:
 * - File type icons and previews
 * - Download functionality
 * - Image thumbnails for image files
 * - File metadata (name, size, type)
 */
export function FileMessage({ message, isOwnMessage, className = '' }: FileMessageProps) {
  const [imageError, setImageError] = useState(false);

  // Extract file metadata from message with proper type casting

   
  const fileUrl = (message.metadata?.fileUrl || message.metadata?.file_url) as string | undefined; // type assertion: message metadata field

   
  const fileName = (message.metadata?.fileName ||
    message.metadata?.file_name ||
    'Unknown file') as string; // type assertion: message metadata field

   
  const fileSize = (message.metadata?.fileSize || message.metadata?.file_size || 0) as number; // type assertion: message metadata field

   
  const fileMimeType = (message.metadata?.fileMimeType ||
    message.metadata?.file_mime_type ||
    '') as string; // type assertion: message metadata field

   
  const thumbnailUrl = (message.metadata?.thumbnailUrl || message.metadata?.thumbnail_url) as
    | string
    | undefined; // type assertion: message metadata field

  if (!fileUrl) {
    return null;
  }

  // Determine file type category
  const isImage = fileMimeType.startsWith('image/');
  const isVideo = fileMimeType.startsWith('video/');
  const isAudio = fileMimeType.startsWith('audio/');
  const isDocument = fileMimeType.includes('pdf') || fileMimeType.includes('document');

  // Get appropriate icon
  const getFileIcon = () => {
    if (isImage) return <PhotoIcon className="h-8 w-8" />;
    if (isVideo) return <VideoCameraIcon className="h-8 w-8" />;
    if (isAudio) return <MusicalNoteIcon className="h-8 w-8" />;
    if (isDocument) return <DocumentTextIcon className="h-8 w-8" />;
    return <DocumentIcon className="h-8 w-8" />;
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? (parts[parts.length - 1] ?? '').toUpperCase() : '';
  };

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={className}>
      {/* Image Preview */}
      {isImage && !imageError && (thumbnailUrl || fileUrl) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative max-w-sm overflow-hidden rounded-lg"
        >
          <img
            src={thumbnailUrl || fileUrl}
            alt={fileName}
            onError={() => setImageError(true)}
            className="max-h-96 w-full object-contain"
            loading="lazy"
          />
          {/* Download overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className="rounded-full bg-white/20 p-3 backdrop-blur-sm hover:bg-white/30"
            >
              <ArrowDownTrayIcon className="h-6 w-6 text-white" />
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* Generic File Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`group relative flex min-w-[280px] max-w-sm items-center gap-3 rounded-xl border p-4 transition-all hover:scale-[1.02] ${
            isOwnMessage
              ? 'border-primary-500/30 bg-primary-500/10 hover:border-primary-500/50'
              : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.08]'
          }`}
        >
          {/* File Icon */}
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
              isImage
                ? 'bg-blue-500/20 text-blue-400'
                : isVideo
                  ? 'bg-purple-500/20 text-purple-400'
                  : isAudio
                    ? 'bg-pink-500/20 text-pink-400'
                    : isDocument
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {getFileIcon()}
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white" title={fileName}>
              {fileName}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{formatBytes(fileSize)}</span>
              {getFileExtension(fileName) && (
                <>
                  <span>•</span>
                  <span>{getFileExtension(fileName)}</span>
                </>
              )}
            </div>
          </div>

          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDownload}
            className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
              isOwnMessage
                ? 'text-primary-400 hover:bg-primary-500/20'
                : 'text-gray-400 hover:bg-white/[0.06]'
            }`}
            title="Download file"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
