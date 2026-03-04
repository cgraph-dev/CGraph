/**
 * Sub-components for AttachmentUploader
 * Dropzone, ErrorList, UploadProgressList, and AttachmentList
 */

import { type RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { type PostAttachment } from '@/modules/forums/store';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';

/* ─── helpers ─── */

/**
 * unknown for the forums module.
 */
/**
 * Formats file size.
 *
 * @param bytes - The bytes.
 * @returns The processed result.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const isImage = (fileType: string) => fileType.startsWith('image/');

/* ─── Dropzone ─── */

interface DropzoneProps {
  isDragging: boolean;
  maxFiles: number;
  maxSize: number;
  allowedTypes: string[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPicker: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Dropzone component.
 */
export function Dropzone({
  isDragging,
  maxFiles,
  maxSize,
  allowedTypes,
  fileInputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  onOpenPicker,
}: DropzoneProps) {
  return (
    <motion.div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onOpenPicker}
      whileHover={{ scale: 1.01 }}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-200 ${
        isDragging
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-dark-600 bg-dark-800/50 hover:border-primary-500/50'
      } `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={onFileSelect}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <CloudArrowUpIcon
          className={`h-12 w-12 ${isDragging ? 'text-primary-400' : 'text-gray-400'}`}
        />
        <div>
          <p className="text-sm font-semibold text-white">
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Max {maxFiles} files, up to {(maxSize / 1024 / 1024).toFixed(0)}MB each
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── ErrorList ─── */

/**
 * unknown for the forums module.
 */
/**
 * Error List component.
 */
export function ErrorList({ errors }: { errors: string[] }) {
  return (
    <AnimatePresence>
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-3 space-y-1"
        >
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-400">
              <XMarkIcon className="h-4 w-4" />
              {error}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── UploadProgressList ─── */

/**
 * unknown for the forums module.
 */
/**
 * Upload Progress List component.
 */
export function UploadProgressList({ progress }: { progress: Record<string, number> }) {
  return (
    <AnimatePresence>
      {Object.entries(progress).map(([fileId, pct]) => (
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
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-white">Uploading...</span>
                  <span className="text-sm text-primary-400">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={tweens.standard}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

/* ─── AttachmentList ─── */

interface AttachmentListProps {
  attachments: PostAttachment[];
  onDelete: (id: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Attachment List component.
 */
export function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-400">Attachments ({attachments.length})</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AnimatePresence>
          {attachments.map((attachment) => (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GlassCard className="group p-3" variant="frosted">
                <div className="flex items-start gap-3">
                  {isImage(attachment.fileType) && attachment.thumbnailUrl ? (
                    <img
                      src={attachment.thumbnailUrl}
                      alt={attachment.originalFilename}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-dark-700">
                      {isImage(attachment.fileType) ? (
                        <PhotoIcon className="h-6 w-6 text-gray-400" />
                      ) : (
                        <DocumentIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {attachment.originalFilename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(attachment.fileSize)}
                      {attachment.downloads > 0 && (
                        <span className="ml-2">
                          • {attachment.downloads} download
                          {attachment.downloads !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <motion.a
                      href={attachment.downloadUrl}
                      download={attachment.originalFilename}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="rounded-lg bg-dark-700/50 p-1.5 transition-colors hover:bg-primary-500/20"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 text-gray-400 hover:text-primary-400" />
                    </motion.a>
                    <motion.button
                      onClick={() => onDelete(attachment.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="rounded-lg bg-dark-700/50 p-1.5 transition-colors hover:bg-red-500/20"
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
  );
}
