/** FileUpload — file upload component with drag-and-drop, preview, tier limits, and E2EE support. */
import { useState, useRef, ChangeEvent } from 'react';
import {
  PhotoIcon,
  XMarkIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { encryptFileForUpload } from '@/lib/crypto/file-encryption';

interface TierLimits {
  max_file_size_bytes: number;
  max_storage_bytes: number;
  used_storage_bytes?: number;
}

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  className?: string;
  children?: React.ReactNode;
  /** Tier limits from GET /api/v1/premium/status */
  tierLimits?: TierLimits;
  /** Whether the conversation uses E2EE */
  isEncrypted?: boolean;
  /** Conversation ID for E2EE key lookup */
  conversationId?: string;
}

/**
 * File Upload component with tier-based limits and E2EE support.
 *
 * Features:
 * - Drag-and-drop support
 * - Image preview with lightbox on click
 * - Document file cards with icon + metadata
 * - Upload progress bar
 * - Tier-based file size validation
 * - E2EE file encryption before upload (when enabled)
 */
export default function FileUpload({
  onUpload,
  accept = 'image/*,application/pdf,application/zip,text/*',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
  children,
  tierLimits,
  isEncrypted = false,
  conversationId,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string; isImage: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveMaxSize = tierLimits?.max_file_size_bytes || maxSize;

  const validateFile = (file: File): boolean => {
    if (file.size > effectiveMaxSize) {
      const limitMB = Math.round(effectiveMaxSize / 1024 / 1024);
      if (tierLimits && effectiveMaxSize === tierLimits.max_file_size_bytes) {
        setError(
          `File "${file.name}" exceeds your plan's ${limitMB}MB limit. Upgrade for larger uploads.`
        );
      } else {
        setError(
          `File ${file.name} is too large. Max size is ${limitMB}MB`
        );
      }
      return false;
    }
    return true;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const validFiles: File[] = [];
    const newPreviews: { file: File; url: string; isImage: boolean }[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file);
        const isImage = file.type.startsWith('image/');
        newPreviews.push({
          file,
          url: isImage ? URL.createObjectURL(file) : '',
          isImage,
        });
      }
    });

    if (validFiles.length > 0) {
      setPreviews((prev) => (multiple ? [...prev, ...newPreviews] : newPreviews));
      setUploadProgress(0);

      // E2EE: encrypt files before upload if conversation is encrypted
      let filesToUpload = validFiles;
      if (isEncrypted && conversationId) {
        try {
          const encryptedFiles = await Promise.all(
            validFiles.map(async (file) => {
              const { encryptedBlob, metadata } = await encryptFileForUpload(file, conversationId);
              // Attach encryption metadata to the blob for the upload handler
              const encryptedFile = new File([encryptedBlob], file.name, {
                type: 'application/octet-stream',
              });
              Object.defineProperty(encryptedFile, 'encryptionMetadata', { value: metadata });
              return encryptedFile;
            })
          );
          filesToUpload = encryptedFiles;
        } catch (err) {
          setError('Failed to encrypt file. Please try again.');
          setUploadProgress(null);
          return;
        }
      }

      // Simulate upload progress (actual progress comes from presigned URL PUT)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev !== null && prev < 90) return prev + 10;
          clearInterval(interval);
          return prev;
        });
      }, 200);
      onUpload(filesToUpload);
      setTimeout(() => {
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
      }, 2000);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev];
      const toRemove = newPreviews[index];
      if (toRemove) {
        URL.revokeObjectURL(toRemove.url);
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {children ? (
        <div onClick={() => inputRef.current?.click()}>{children}</div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ${
            isDragging
              ? 'scale-[1.02] border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
              : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/50 hover:shadow-md'
          }`}
        >
          <PhotoIcon className="mx-auto mb-2 h-10 w-10 text-gray-500" />
          <p className="text-sm text-gray-400">
            <span className="text-primary-400">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Max file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {previews.map((preview, idx) => (
            <div
              key={preview.url || preview.file.name}
              className="animate-scaleIn relative"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {preview.isImage ? (
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  onClick={() => setLightboxUrl(preview.url)}
                  className="h-20 w-20 cursor-pointer rounded-lg object-cover ring-2 ring-transparent transition-all duration-200 hover:ring-primary-500"
                />
              ) : (
                <div className="flex h-20 w-40 items-center gap-2 rounded-lg bg-gray-200 p-2 dark:bg-gray-700">
                  <DocumentIcon className="h-8 w-8 flex-shrink-0 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(preview.file.size)}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={() => removePreview(idx)}
                className="absolute -right-2 -top-2 flex h-5 w-5 transform items-center justify-center rounded-full bg-red-500 transition-transform hover:scale-110"
              >
                <XMarkIcon className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={lightboxUrl}
              alt="Preview"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
